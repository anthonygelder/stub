import { StubTemplate } from './types';
import { concertTemplate } from './concert.template';
import { sportsTemplate } from './sports.template';
import { flightTemplate } from './flight.template';
import { comedyTemplate } from './comedy.template';
import { theaterTemplate } from './theater.template';
import { customTemplate } from './custom.template';

export const templates: StubTemplate[] = [
  concertTemplate, sportsTemplate, flightTemplate,
  comedyTemplate, theaterTemplate, customTemplate,
];

export function getTemplate(eventTypeOrId: string): StubTemplate {
  // First try exact match by template id
  const byId = templates.find(t => t.id === eventTypeOrId);
  if (byId) return byId;

  // Then try match by event type
  const byType = templates.find(t =>
    Array.isArray(t.eventType) ? t.eventType.includes(eventTypeOrId) : t.eventType === eventTypeOrId
  );
  return byType || customTemplate;
}
