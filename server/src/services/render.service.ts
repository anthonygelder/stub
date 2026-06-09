import { createCanvas } from 'canvas';
import path from 'path';
import fs from 'fs';
import { getTemplate } from '../templates';
import { RenderData } from '../templates/types';

const IMAGE_DIR = path.join(__dirname, '..', '..', 'data', 'images');

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

export async function renderStub(data: RenderData, templateId?: string): Promise<Buffer> {
  const template = templateId ? getTemplate(templateId) : getTemplate(data.eventType);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');

  template.render(ctx, data);

  return canvas.toBuffer('image/png');
}

export async function renderAndSaveStub(stubId: string, data: RenderData, templateId?: string): Promise<string> {
  const buffer = await renderStub(data, templateId);
  const filePath = path.join(IMAGE_DIR, `${stubId}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export async function renderOGImage(data: RenderData): Promise<Buffer> {
  const template = getTemplate(data.eventType);
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // OG-optimized: larger title, simplified layout
  template.render(ctx, data);

  return canvas.toBuffer('image/png');
}
