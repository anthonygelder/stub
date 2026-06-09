import { StubTemplate, RenderData } from '../types';
import { drawBackground, drawBorder, drawTitle, drawSubtitle, drawFooter, drawBadge, formatDate } from '../base.template';

export const vintageTemplate: StubTemplate = {
  id: 'vintage',
  name: 'Vintage',
  eventType: ['concert', 'sports', 'comedy', 'theater', 'custom'],
  tier: 'premium',
  width: 1200,
  height: 630,
  colors: {
    background: '#f4e4c1',
    accent: '#8b4513',
    text: '#3e2723',
    secondary: '#6d4c41',
    border: '#a0522d',
    muted: '#bcaaa4',
  },
  render(ctx, data) {
    const { width: w, height: h, colors: c } = this;
    // Parchment background
    drawBackground(ctx, w, h, c.background);
    // Distressed border (double-line)
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.strokeRect(28, 28, w - 56, h - 56);
    // Serif badge
    drawBadge(ctx, 'VINTAGE', w / 2, 80, c.accent, c.background);
    drawTitle(ctx, data.eventTitle, 160, w, c.text, 'bold 42px "Georgia", serif');
    drawSubtitle(ctx, formatDate(data.eventDate), 220, w, c.accent);
    if (data.venueName) {
      const venue = data.venueCity ? `${data.venueName} · ${data.venueCity}` : data.venueName;
      drawSubtitle(ctx, venue, 270, w, c.secondary);
    }
    if (data.seat) {
      drawSubtitle(ctx, `Seat: ${data.seat}`, 330, w, c.muted);
    }
    drawSubtitle(ctx, `@${data.userHandle}`, h - 90, w, c.muted);
    drawFooter(ctx, 'stub.app  ·  premium', w, h, c.muted);
  },
};
