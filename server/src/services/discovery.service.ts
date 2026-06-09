import { prisma } from '../lib/prisma';

export async function getTrendingEvents(limit = 20) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return prisma.event.findMany({
    where: {
      stubs: { some: { createdAt: { gte: sevenDaysAgo } } },
    },
    orderBy: { stubCount: 'desc' },
    take: limit,
  });
}

export async function getSharedEvents(userHandle: string, otherHandle: string) {
  const user = await prisma.user.findUnique({ where: { handle: userHandle }, select: { id: true } });
  const other = await prisma.user.findUnique({ where: { handle: otherHandle }, select: { id: true } });
  if (!user || !other) throw new Error('USER_NOT_FOUND');

  const userEventIds = await prisma.stub.findMany({
    where: { userId: user.id },
    select: { eventId: true },
  });

  const sharedEventIds = userEventIds.map((s: { eventId: string }) => s.eventId);

  return prisma.stub.findMany({
    where: {
      userId: other.id,
      eventId: { in: sharedEventIds },
    },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWhoElseWasThere(eventId: string) {
  const stubs = await prisma.stub.findMany({
    where: { eventId, visibility: 'public' },
    include: { user: { select: { id: true, handle: true, displayName: true } } },
    take: 50,
  });

  return { eventId, attendees: stubs.map((s: { user: { id: string; handle: string; displayName: string } }) => s.user), count: stubs.length };
}
