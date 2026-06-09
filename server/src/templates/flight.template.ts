import { StubTemplate } from './types';
import { drawBackground, drawDashedBorder, drawTitle, drawSubtitle, drawFooter, drawBadge, formatDate } from './base.template';

export const flightTemplate: StubTemplate = {
  id: 'flight',
  name: 'Boarding Pass',
  eventType: 'flight',
  tier: 'standard',
  width: 1200,
  height: 630,
  colors: {
    background: '#0a1628',
    accent: '#60a5fa',
    text: '#ffffff',
    secondary: '#93bbfc',
    border: '#1e3a5f',
    muted: '#4a6a8a',
  },
  render(ctx, data) {
    const { width: w, height: h, colors: c } = this;
    drawBackground(ctx, w, h, c.background);
    drawDashedBorder(ctx, w, h, c.accent, 20);

    drawBadge(ctx, '✈️ FLIGHT', w / 2, 80, c.accent, c.background);
    drawTitle(ctx, data.eventTitle, 150, w, c.text, 'bold 48px "Helvetica Neue", Helvetica, Arial, sans-serif');

    // Large date
    drawTitle(ctx, formatDate(data.eventDate), 230, w, c.accent, 'bold 36px "Helvetica Neue", Helvetica, Arial, sans-serif');

    if (data.personalData?.flightNumber) {
      drawBadge(ctx, `FLIGHT: ${data.personalData.flightNumber}`, w / 2, 310, c.border, c.secondary);
    }
    if (data.companions) {
      drawSubtitle(ctx, `Traveling with ${data.companions}`, 390, w, c.muted);
    }
    drawSubtitle(ctx, `@${data.userHandle}`, h - 90, w, c.muted);
    drawFooter(ctx, 'stub.app', w, h, c.muted);
  },
};
