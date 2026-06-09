import { prisma } from '../lib/prisma';

const MILESTONES = [
  { count: 1, name: 'First Stub', emoji: '🎟️' },
  { count: 10, name: 'Collector', emoji: '📚' },
  { count: 25, name: 'Enthusiast', emoji: '🔥' },
  { count: 50, name: 'Veteran', emoji: '🏆' },
  { count: 100, name: 'Legend', emoji: '👑' },
  { count: 250, name: 'Museum', emoji: '🏛️' },
];

export async function getMilestones(handle: string) {
  const user = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const total = await prisma.stub.count({ where: { userId: user.id, isDraft: false } });
  const eventTypes = await prisma.stub.groupBy({
    by: ['eventId'], where: { userId: user.id, isDraft: false },
  });
  const uniqueEvents = eventTypes.length;
  const cities = await prisma.stub.findMany({
    where: { userId: user.id, isDraft: false },
    select: { event: { select: { venueCity: true } } },
  });
  const uniqueCities = new Set(cities.map((s: { event: { venueCity: string | null } }) => s.event.venueCity).filter(Boolean)).size;

  const earned = MILESTONES.filter(m => total >= m.count);
  const next = MILESTONES.find(m => total < m.count);

  return {
    totalStubs: total,
    uniqueEvents,
    cities: uniqueCities,
    milestones: earned,
    nextMilestone: next || null,
  };
}
