import { prisma } from '../lib/prisma';
import { incrementCorroborationCount, getCorroborationCount } from '../lib/redis';

export async function checkCorroboration(eventId: string) {
  // Increment Redis counter
  const count = await incrementCorroborationCount(eventId);

  // Check if threshold met (≥3)
  if (count >= 3) {
    // Verify with actual DB count (anti-spam)
    const actualUsers = await prisma.stub.findMany({
      where: { eventId },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (actualUsers.length >= 3) {
      // Promote event to tier 2
      await prisma.event.update({
        where: { id: eventId },
        data: { tier: 2 },
      });

      // Record corroboration
      await prisma.corroboration.upsert({
        where: { eventId },
        create: {
          eventId,
          userIds: actualUsers.map((u: { userId: string }) => u.userId),
        },
        update: {
          userIds: actualUsers.map((u: { userId: string }) => u.userId),
        },
      });
    }
  }
}

export async function getCorroborationStatus(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { tier: true },
  });
  const corroboration = await prisma.corroboration.findUnique({
    where: { eventId },
  });
  const count = await getCorroborationCount(eventId);
  return { tier: event?.tier || 3, userCount: count, isCorroborated: event?.tier === 2, corroboration };
}
