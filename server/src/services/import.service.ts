import { prisma } from '../lib/prisma';
import { findOrCreateEvent } from './event.service';

export interface RawImportItem {
  [key: string]: any;
  type: string;
  title: string;
  venueName?: string;
  venueCity?: string;
  venueCountry?: string;
  eventDate: string;
  eventTime?: string;
  personalData?: Record<string, any>;
  externalSource?: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

export async function importEvents(userId: string, source: string, items: RawImportItem[]) {
  const results: any[] = [];
  let created = 0, matched = 0, candidates = 0;

  for (const item of items) {
    try {
      const dedupResult = await findOrCreateEvent({
        type: item.type,
        title: item.title,
        venueName: item.venueName,
        venueCity: item.venueCity,
        venueCountry: item.venueCountry,
        eventDate: item.eventDate,
        eventTime: item.eventTime,
        externalSource: item.externalSource,
        externalId: item.externalId,
        metadata: item.metadata,
      });

      if (dedupResult.candidates) {
        candidates++;
        // For import, auto-pick first candidate
        const eventId = dedupResult.candidates[0].id;
        const stub = await prisma.stub.create({
          data: {
            userId, eventId,
            personalData: item.personalData || {},
            importSource: source,
            isDraft: true,
            importData: item,
          },
          include: { event: true },
        });
        results.push(stub);
      } else {
        const eventId = dedupResult.event!.id;
        if (dedupResult.matched) matched++; else created++;
        const stub = await prisma.stub.create({
          data: {
            userId, eventId,
            personalData: item.personalData || {},
            importSource: source,
            isDraft: true,
            importData: item,
          },
          include: { event: true },
        });
        results.push(stub);
      }
    } catch (err) {
      // Skip failed items, continue processing
      console.error('Import item failed:', err);
    }
  }

  return { stubs: results, stats: { total: items.length, created, matched, candidates, failed: items.length - results.length } };
}

export async function getDraftStubs(userId: string) {
  return prisma.stub.findMany({
    where: { userId, isDraft: true },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function publishStub(userId: string, stubId: string) {
  const stub = await prisma.stub.findFirst({ where: { id: stubId, userId, isDraft: true } });
  if (!stub) throw new Error('DRAFT_NOT_FOUND');

  const updated = await prisma.stub.update({
    where: { id: stubId },
    data: { isDraft: false, visibility: 'public' },
    include: { event: true },
  });

  // Increment event stubCount now that it's published
  await prisma.event.update({
    where: { id: stub.eventId },
    data: { stubCount: { increment: 1 } },
  });

  return updated;
}

export async function rejectStub(userId: string, stubId: string) {
  const stub = await prisma.stub.findFirst({ where: { id: stubId, userId, isDraft: true } });
  if (!stub) throw new Error('DRAFT_NOT_FOUND');
  await prisma.stub.delete({ where: { id: stubId } });
  return { rejected: stubId };
}

export async function getImportStats(userId: string) {
  const stubs = await prisma.stub.findMany({
    where: { userId, importSource: { not: null } },
    select: { importSource: true, isDraft: true },
  });

  const bySource: Record<string, { total: number; drafts: number; published: number }> = {};
  for (const s of stubs) {
    const source = s.importSource!;
    if (!bySource[source]) bySource[source] = { total: 0, drafts: 0, published: 0 };
    bySource[source].total++;
    if (s.isDraft) bySource[source].drafts++;
    else bySource[source].published++;
  }

  return { bySource, totalImported: stubs.length };
}
