import { StubTemplate } from '../types';
import { drawBackground, drawBorder, drawTitle, drawSubtitle, drawFooter, drawBadge, formatDate } from '../base.template';

export const holographicTemplate: StubTemplate = {
  id: 'holographic',
  name: 'Holographic',
  eventType: ['concert', 'sports', 'comedy', 'theater', 'custom', 'flight'],
  tier: 'premium',
  width: 1200,
  height: 630,
  colors: {
    background: '#0a0a1a',
    accent: '#00ffff',
    text: '#ffffff',
    secondary: '#e0f7fa',
    border: '#00838f',
    muted: '#4dd0e1',
  },
  render(ctx, data) {
    const { width: w, height: h, colors: c } = this;
    // Rainbow gradient background
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(0.25, '#003366');
    gradient.addColorStop(0.5, '#006666');
    gradient.addColorStop(0.75, '#003366');
    gradient.addColorStop(1, '#1a0033');
    drawBackground(ctx, w, h, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Holographic border
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3;
    ctx.shadowColor = c.accent;
    ctx.shadowBlur = 15;
    ctx.strokeRect(25, 25, w - 50, h - 50);
    ctx.shadowBlur = 0;

    drawBadge(ctx, 'HOLO', w / 2, 80, c.accent, '#000');
    drawTitle(ctx, data.eventTitle, 160, w, c.text);
    drawSubtitle(ctx, formatDate(data.eventDate), 220, w, c.accent);
    if (data.venueName) {
      drawSubtitle(ctx, data.venueName + (data.venueCity ? ` · ${data.venueCity}` : ''), 270, w, c.secondary);
    }
    if (data.seat) drawSubtitle(ctx, data.seat, 340, w, c.muted);
    drawSubtitle(ctx, `@${data.userHandle}`, h - 90, w, c.muted);
    ctx.shadowColor = c.accent;
    ctx.shadowBlur = 10;
    drawFooter(ctx, 'stub.app  ·  holographic', w, h, c.accent);
    ctx.shadowBlur = 0;
  },
};
