import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

// Normalize: a trailing slash on CLIENT_URL would produce `//api/...` callback
// URLs (breaking Google's redirect_uri match) and break CORS origin comparison.
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: isProduction ? requireEnv('JWT_SECRET') : (process.env.JWT_SECRET || 'dev-secret'),
  jwtRefreshSecret: isProduction ? requireEnv('JWT_REFRESH_SECRET') : (process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'),
  clientUrl,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: requireEnv('DATABASE_URL', isProduction ? undefined : 'postgresql://stub:stub@localhost:5432/stub_dev'),
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: `${clientUrl}/api/auth/google/callback`,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      keyId: process.env.APPLE_KEY_ID || '',
      privateKey: process.env.APPLE_PRIVATE_KEY || '',
      callbackUrl: `${clientUrl}/api/auth/apple/callback`,
    },
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local', // 'local' | 's3'
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || '', // set for S3-compatible (e.g. Cloudflare R2)
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '', // public bucket/CDN base URL
    },
  },
};
