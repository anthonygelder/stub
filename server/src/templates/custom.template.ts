import { StubTemplate } from './types';
import { drawBackground, drawBorder, drawTitle, drawSubtitle, drawFooter, drawBadge, formatDate } from './base.template';

export const customTemplate: StubTemplate = {
  id: 'custom',
  name: 'Custom Event',
  eventType: ['custom', 'other', 'festival', 'conference', 'meetup'],
  tier: 'standard',
  width: 1200,
  height: 630,
  colors: {
    background: '#111111',
    accent: '#ffffff',
    text: '#ffffff',
    secondary: '#a3a3a3',
    border: '#333333',
    muted: '#525252',
  },
  render(ctx, data) {
    const { width: w, height: h, colors: c } = this;
    drawBackground(ctx, w, h, c.background);
    drawBorder(ctx, w, h, c.accent, 25);

    const badgeLabel = data.eventType ? `📌 ${data.eventType.toUpperCase()}` : '📌 EVENT';
    drawBadge(ctx, badgeLabel, w / 2, 80, c.accent, c.background);
    drawTitle(ctx, data.eventTitle, 160, w, c.text);
    drawSubtitle(ctx, formatDate(data.eventDate), 210, w, c.accent);

    if (data.venueName) {
      const venue = data.venueCity ? `${data.venueName} · ${data.venueCity}` : data.venueName;
      drawSubtitle(ctx, venue, 255, w, c.secondary);
    }
    if (data.seat) {
      drawBadge(ctx, `SEAT: ${data.seat}`, w / 2, 320, c.border, c.secondary);
    }
    if (data.companions) {
      drawSubtitle(ctx, `with ${data.companions}`, 380, w, c.muted);
    }
    drawSubtitle(ctx, `@${data.userHandle}`, h - 90, w, c.muted);
    drawFooter(ctx, 'stub.app', w, h, c.muted);
  },
};
