import { createCanvas } from 'canvas';
import { getTemplate } from '../templates';
import { RenderData } from '../templates/types';
import { storage } from '../lib/storage';

export async function renderStub(data: RenderData, templateId?: string): Promise<Buffer> {
  const template = templateId ? getTemplate(templateId) : getTemplate(data.eventType);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');

  template.render(ctx, data);

  return canvas.toBuffer('image/png');
}

// Renders the stub and stores it, returning the public URL (saved as generatedImageUrl).
export async function renderAndSaveStub(stubId: string, data: RenderData, templateId?: string): Promise<string> {
  const buffer = await renderStub(data, templateId);
  return storage.put(`images/${stubId}.png`, buffer, 'image/png');
}

export async function renderOGImage(data: RenderData): Promise<Buffer> {
  const template = getTemplate(data.eventType);
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // OG-optimized: larger title, simplified layout
  template.render(ctx, data);

  return canvas.toBuffer('image/png');
}
