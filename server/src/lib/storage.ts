import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config';

/**
 * Key-based blob storage so call sites never touch the filesystem directly.
 * Keys are forward-slash paths like `images/<id>.png` or `uploads/<file>.png`.
 */
export interface StorageDriver {
  put(key: string, buffer: Buffer, contentType: string): Promise<string>; // returns public URL
  get(key: string): Promise<Buffer | null>;
  exists(key: string): Promise<boolean>;
  publicUrl(key: string): string;
}

// server/src/lib -> server/data (matches the path the render/og tests read).
const LOCAL_ROOT = path.join(__dirname, '..', '..', 'data');

class LocalDriver implements StorageDriver {
  async put(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(LOCAL_ROOT, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return this.publicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.promises.readFile(path.join(LOCAL_ROOT, key));
    } catch {
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.promises.access(path.join(LOCAL_ROOT, key));
      return true;
    } catch {
      return false;
    }
  }

  publicUrl(key: string): string {
    return `/media/${key}`;
  }
}

class S3Driver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const s3 = config.storage.s3;
    this.bucket = s3.bucket;
    this.client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint || undefined,
      forcePathStyle: !!s3.endpoint, // needed for most S3-compatible endpoints
      credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey },
    });
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }),
    );
    return this.publicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  publicUrl(key: string): string {
    const base = config.storage.s3.publicBaseUrl.replace(/\/+$/, '');
    return `${base}/${key}`;
  }
}

export const storage: StorageDriver =
  config.storage.driver === 's3' ? new S3Driver() : new LocalDriver();
