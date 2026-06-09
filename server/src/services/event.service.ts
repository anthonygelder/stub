import { prisma } from '../lib/prisma';

interface CreateEventInput {
  type: string;
  title: string;
  subtitle?: string;
  venueName?: string;
  venueCity?: string;
  venueCountry?: string;
  eventDate: string;
  eventTime?: string;
  externalSource?: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

interface DedupResult {
  matched: boolean;
  event?: any;
  candidates?: any[];
}

export async function findOrCreateEvent(input: CreateEventInput): Promise<DedupResult> {
  // Step 1: External ID exact match
  if (input.externalSource && input.externalId) {
    const existing = await prisma.event.findUnique({
      where: {
        externalSource_externalId: {
          externalSource: input.externalSource,
          externalId: input.externalId,
        },
      },
    });
    if (existing) return { matched: true, event: existing };
  }

  // Step 2: Full-text search within ±2 days of event date
  const eventDate = new Date(input.eventDate);
  const dateMin = new Date(eventDate);
  dateMin.setDate(dateMin.getDate() - 2);
  const dateMax = new Date(eventDate);
  dateMax.setDate(dateMax.getDate() + 2);

  const candidates = await prisma.event.findMany({
    where: {
      eventDate: { gte: dateMin, lte: dateMax },
      type: input.type,
    },
  });

  // Step 3: Score each candidate
  interface ScoredCandidate {
    event: any;
    score: number;
  }

  const scored: ScoredCandidate[] = candidates.map((event: any) => {
    let score = 0;

    const candidateDate = new Date(event.eventDate);
    const dayDiff = Math.abs(candidateDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    if (dayDiff === 0) score += 40;
    else if (dayDiff <= 1) score += 20;

    if (
      input.venueName &&
      event.venueName &&
      input.venueName.toLowerCase() === event.venueName.toLowerCase()
    ) {
      score += 30;
    }

    if (input.title.toLowerCase() === event.title.toLowerCase()) {
      score += 30;
    } else if (
      event.title.toLowerCase().includes(input.title.toLowerCase()) ||
      input.title.toLowerCase().includes(event.title.toLowerCase())
    ) {
      score += 15;
    }

    return { event, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Step 4: Route based on top score
  if (scored.length > 0 && scored[0].score >= 85) {
    return { matched: true, event: scored[0].event };
  }

  if (scored.length > 0 && scored[0].score >= 50) {
    return {
      matched: false,
      candidates: scored.slice(0, 3).map(s => s.event),
    };
  }

  // Step 5: Create new Tier 3 event
  const event = await prisma.event.create({
    data: {
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      venueName: input.venueName,
      venueCity: input.venueCity,
      venueCountry: input.venueCountry,
      eventDate: eventDate,
      eventTime: input.eventTime,
      tier: 3,
      externalSource: input.externalSource,
      externalId: input.externalId,
      metadata: input.metadata || {},
    },
  });

  return { matched: false, event };
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

export async function searchEvents(query: string, limit = 20) {
  return prisma.event.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { venueName: { contains: query, mode: 'insensitive' } },
        { venueCity: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { stubCount: 'desc' },
    take: limit,
  });
}

export async function confirmEventCandidate(eventId: string) {
  return prisma.event.findUnique({ where: { id: eventId } });
}
