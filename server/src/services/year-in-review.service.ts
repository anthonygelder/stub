import { createCanvas } from 'canvas';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { drawBackground, drawTitle, drawSubtitle, drawFooter, formatDate } from '../templates/base.template';

const IMAGE_DIR = path.join(__dirname, '..', '..', 'data', 'images');

export async function generateYearInReview(userId: string, year: number, isPremium = false): Promise<Buffer> {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year + 1}-01-01`);

  const stubs = await prisma.stub.findMany({
    where: { userId, createdAt: { gte: startDate, lt: endDate }, isDraft: false },
    include: { event: true },
    orderBy: { createdAt: 'asc' },
  });

  const totalStubs = stubs.length;
  const byType: Record<string, number> = {};
  const cities = new Set<string>();
  for (const s of stubs) {
    byType[s.event.type] = (byType[s.event.type] || 0) + 1;
    if (s.event.venueCity) cities.add(s.event.venueCity);
  }

  const canvas = createCanvas(1200, 1600);
  const ctx = canvas.getContext('2d');

  // Background
  drawBackground(ctx, 1200, 1600, '#0a0a0a');

  // Title
  ctx.fillStyle = '#f5a623';
  ctx.font = 'bold 56px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${year} Year in Review`, 600, 100);

  // Stats
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(String(totalStubs), 600, 260);

  ctx.fillStyle = '#888';
  ctx.font = '28px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('experiences logged', 600, 310);

  // By type
  let y = 400;
  ctx.font = '24px "Helvetica Neue", Helvetica, Arial, sans-serif';
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    const emoji: Record<string, string> = { concert: '🎵', sports: '⚽', comedy: '🎤', theater: '🎭', flight: '✈️', custom: '✨' };
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'left';
    ctx.fillText(`${emoji[type] || '✨'} ${type}: ${count}`, 200, y);
    y += 40;
  }

  // Cities
  if (cities.size > 0) {
    y += 20;
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${cities.size} cities visited`, 600, y);
  }

  // Watermark for free users
  if (!isPremium) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'italic 20px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Upgrade to Stub+ for watermark-free Year in Review', 600, 1540);
  }

  drawFooter(ctx, 'stub.app/year-in-review', 1200, 1580, '#555');

  return canvas.toBuffer('image/png');
}
