import { prisma } from '../lib/prisma';

export interface ExternalMatch {
  title: string;
  venueName?: string;
  venueCity?: string;
  venueCountry?: string;
  eventDate: string;
  externalSource: string;
  externalId: string;
  metadata?: Record<string, any>;
}

// Mock: simulate API lookup — in production, this calls Setlist.fm / Ticketmaster
async function mockApiLookup(event: { title: string; venueName?: string | null; eventDate: Date }): Promise<ExternalMatch | null> {
  // Simulate 30% match rate for testing
  if (Math.random() < 0.3) {
    return {
      title: event.title,
      venueName: event.venueName || undefined,
      eventDate: event.eventDate.toISOString(),
      externalSource: 'setlist_fm',
      externalId: `sfm-${Math.random().toString(36).slice(2, 10)}`,
      metadata: { source: 'mock_enrichment' },
    };
  }
  return null;
}

export async function enrichEvents(): Promise<{ attempted: number; enriched: number; merged: number }> {
  const tier3Events = await prisma.event.findMany({
    where: { tier: 3, externalId: null },
    orderBy: { eventDate: 'desc' },
    take: 50,
  });

  let enriched = 0;
  let merged = 0;

  for (const event of tier3Events) {
    const match = await mockApiLookup(event);
    if (match) {
      // Check if a canonical event already exists for this match
      const existing = await prisma.event.findUnique({
        where: {
          externalSource_externalId: {
            externalSource: match.externalSource,
            externalId: match.externalId,
          },
        },
      });

      if (existing) {
        // Merge: repoint all stubs from tier3 to existing canonical
        await prisma.stub.updateMany({
          where: { eventId: event.id },
          data: { eventId: existing.id },
        });
        // Recalculate stub count
        const count = await prisma.stub.count({ where: { eventId: existing.id } });
        await prisma.event.update({ where: { id: existing.id }, data: { stubCount: count } });
        // Mark old event as merged
        await prisma.event.update({ where: { id: event.id }, data: { mergedInto: existing.id } });
        merged++;
      } else {
        // Promote: add external data to existing event
        await prisma.event.update({
          where: { id: event.id },
          data: {
            tier: 1,
            externalSource: match.externalSource,
            externalId: match.externalId,
            metadata: { ...((event.metadata as any) || {}), ...(match.metadata || {}) },
          },
        });
        enriched++;
      }
    }
  }

  return { attempted: tier3Events.length, enriched, merged };
}
