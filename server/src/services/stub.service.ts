import { prisma } from '../lib/prisma';
import { findOrCreateEvent } from './event.service';
import { checkCorroboration } from './corroboration.service';
import { renderAndSaveStub } from './render.service';

interface CreateStubInput {
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
  personalData?: Record<string, any>;
  visibility?: string;
  designTemplateId?: string;
}

export async function createStub(userId: string, input: CreateStubInput) {
  const dedupResult = await findOrCreateEvent({
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    venueName: input.venueName,
    venueCity: input.venueCity,
    venueCountry: input.venueCountry,
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    externalSource: input.externalSource,
    externalId: input.externalId,
    metadata: input.metadata,
  });

  let eventId: string;

  if (dedupResult.matched) {
    eventId = dedupResult.event!.id;
  } else if (dedupResult.candidates) {
    throw new Error('EVENT_CANDIDATES');
  } else {
    eventId = dedupResult.event!.id;
  }

  const stub = await prisma.stub.create({
    data: {
      userId,
      eventId,
      personalData: input.personalData || {},
      visibility: input.visibility || 'public',
      designTemplateId: input.designTemplateId || 'default',
    },
    include: {
      event: true,
    },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { stubCount: { increment: 1 } },
  });

  // Trigger corroboration check
  await checkCorroboration(eventId);

  // Fire-and-forget render
  renderAndSaveStub(stub.id, {
    eventTitle: stub.event.title,
    eventType: stub.event.type,
    venueName: stub.event.venueName || undefined,
    venueCity: stub.event.venueCity || undefined,
    eventDate: stub.event.eventDate.toISOString(),
    seat: (input.personalData as any)?.seat,
    companions: (input.personalData as any)?.companions,
    userName: 'User',
    userHandle: 'user',
    stubNumber: 0,
  }).then(path => {
    prisma.stub.update({ where: { id: stub.id }, data: { generatedImageUrl: path } }).catch(() => {});
  }).catch(err => console.error('Render failed:', err));

  return stub;
}

export async function getUserStubs(userId: string, limit = 50) {
  return prisma.stub.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getPublicStubsByHandle(handle: string, limit = 50) {
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) throw new Error('USER_NOT_FOUND');

  return prisma.stub.findMany({
    where: {
      userId: user.id,
      visibility: 'public',
    },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getStubById(stubId: string) {
  const stub = await prisma.stub.findUnique({
    where: { id: stubId },
    include: { event: true, user: { select: { id: true, handle: true, displayName: true } } },
  });
  if (!stub) throw new Error('STUB_NOT_FOUND');
  return stub;
}
