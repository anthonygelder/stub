import { StubTemplate } from '../types';
import { drawBackground, drawBorder, drawTitle, drawSubtitle, drawFooter, drawBadge, formatDate } from '../base.template';

export const foilTemplate: StubTemplate = {
  id: 'foil',
  name: 'Gold Foil',
  eventType: ['concert', 'sports', 'comedy', 'theater', 'custom'],
  tier: 'premium',
  width: 1200,
  height: 630,
  colors: {
    background: '#1a1a1a',
    accent: '#ffd700',
    text: '#ffffff',
    secondary: '#ffecb3',
    border: '#b8860b',
    muted: '#8b7500',
  },
  render(ctx, data) {
    const { width: w, height: h, colors: c } = this;
    drawBackground(ctx, w, h, c.background);
    // Metallic border
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    // Inner gold line
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.setLineDash([]);
    // Gold gradient stripe
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#b8860b');
    gradient.addColorStop(0.5, '#ffd700');
    gradient.addColorStop(1, '#b8860b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 100, w, 4);
    ctx.fillRect(0, h - 104, w, 4);

    drawBadge(ctx, '✦ PREMIUM ✦', w / 2, 70, c.accent, '#1a1a1a');
    drawTitle(ctx, data.eventTitle, 170, w, c.text);
    drawSubtitle(ctx, formatDate(data.eventDate), 220, w, c.accent);
    if (data.venueName) {
      drawSubtitle(ctx, data.venueName + (data.venueCity ? ` · ${data.venueCity}` : ''), 270, w, c.secondary);
    }
    if (data.seat) drawSubtitle(ctx, data.seat, 340, w, c.muted);
    drawSubtitle(ctx, `@${data.userHandle}`, h - 90, w, c.muted);
    drawFooter(ctx, 'stub.app  ·  foil', w, h, c.muted);
  },
};
