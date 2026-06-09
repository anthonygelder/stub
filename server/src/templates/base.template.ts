import { RenderData, StubTemplate } from './types';

export function drawBackground(ctx: any, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function drawBorder(ctx: any, w: number, h: number, color: string, margin = 30) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
}

export function drawDashedBorder(ctx: any, w: number, h: number, color: string, margin = 20) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.setLineDash([]);
}

export function drawTitle(ctx: any, text: string, y: number, w: number, color: string, font = 'bold 42px "Helvetica Neue", Helvetica, Arial, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, y);
}

export function drawSubtitle(ctx: any, text: string, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = '24px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, y);
}

export function drawFooter(ctx: any, text: string, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = '14px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h - 30);
}

export function drawBadge(ctx: any, text: string, x: number, y: number, bgColor: string, textColor: string) {
  const padding = 12;
  ctx.font = '18px "Helvetica Neue", Helvetica, Arial, sans-serif';
  const metrics = ctx.measureText(text);
  const w = metrics.width + padding * 2;

  ctx.fillStyle = bgColor;
  roundRect(ctx, x - w / 2, y - 14, w, 28, 14);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 6);
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
