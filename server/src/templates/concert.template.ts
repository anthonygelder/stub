import { StubTemplate } from './types';
import { drawBackground, drawBorder, drawTitle, drawSubtitle, drawFooter, drawBadge, formatDate } from './base.template';

export const concertTemplate: StubTemplate = {
  id: 'concert',
  name: 'Live Music',
  eventType: 'concert',
  tier: 'standard',
  width: 1200,
  height: 630,
  colors: {
    background: '#1a0a3e',
    accent: '#f5a623',
    text: '#ffffff',
    secondary: '#b8a9d4',
    border: '#3d2a6e',
    muted: '#6b5b8a',
  },
  render(ctx, data) {
    const { width: w, height: h, colors: c } = this;
    drawBackground(ctx, w, h, c.background);
    drawBorder(ctx, w, h, c.accent, 25);

    // Event type badge
    drawBadge(ctx, '🎵 CONCERT', w / 2, 80, c.accent, c.background);

    // Title
    drawTitle(ctx, data.eventTitle, 160, w, c.text);

    // Date
    drawSubtitle(ctx, formatDate(data.eventDate), 210, w, c.accent);

    // Venue
    if (data.venueName) {
      const venue = data.venueCity ? `${data.venueName} · ${data.venueCity}` : data.venueName;
      drawSubtitle(ctx, venue, 255, w, c.secondary);
    }

    // Seat
    if (data.seat) {
      drawBadge(ctx, `SEAT: ${data.seat}`, w / 2, 320, c.border, c.secondary);
    }

    // Companions
    if (data.companions) {
      drawSubtitle(ctx, `with ${data.companions}`, 380, w, c.muted);
    }

    // User info
    drawSubtitle(ctx, `@${data.userHandle}`, h - 90, w, c.muted);

    drawFooter(ctx, 'stub.app', w, h, c.muted);
  },
};
