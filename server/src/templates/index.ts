import { StubTemplate } from './types';
import { concertTemplate } from './concert.template';
import { sportsTemplate } from './sports.template';
import { flightTemplate } from './flight.template';
import { comedyTemplate } from './comedy.template';
import { theaterTemplate } from './theater.template';
import { customTemplate } from './custom.template';
import { vintageTemplate } from './premium/vintage.template';
import { foilTemplate } from './premium/foil.template';
import { holographicTemplate } from './premium/holographic.template';

export const templates: StubTemplate[] = [
  concertTemplate, sportsTemplate, flightTemplate,
  comedyTemplate, theaterTemplate, customTemplate,
];

export const premiumTemplates: StubTemplate[] = [
  vintageTemplate, foilTemplate, holographicTemplate,
];

export const allTemplates: StubTemplate[] = [
  ...templates, ...premiumTemplates,
];

export function getTemplate(eventTypeOrId: string, allowPremium = true): StubTemplate {
  const pool = allowPremium ? allTemplates : templates;
  // First try exact match by template id
  const byId = pool.find(t => t.id === eventTypeOrId);
  if (byId) return byId;

  // Then try match by event type
  const byType = pool.find(t =>
    Array.isArray(t.eventType) ? t.eventType.includes(eventTypeOrId) : t.eventType === eventTypeOrId
  );
  return byType || customTemplate;
}
