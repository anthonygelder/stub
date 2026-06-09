import { prisma } from '../lib/prisma';
import { addToFeed, getFeed } from '../lib/redis';
import { getFollowingIds } from './social.service';

export async function getFeedForUser(userId: string, cursor?: number, limit = 20) {
  const stubIds = await getFeed(userId, cursor, limit);

  if (!stubIds || stubIds.length === 0) {
    // Cache miss — query Postgres directly
    const followingIds = await getFollowingIds(userId);
    if (followingIds.length === 0) return [];

    const stubs = await prisma.stub.findMany({
      where: {
        userId: { in: followingIds },
        visibility: { in: ['public', 'followers'] },
      },
      include: { event: true, user: { select: { id: true, handle: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return stubs;
  }

  // Cache hit — hydrate stub IDs
  const stubs = await prisma.stub.findMany({
    where: { id: { in: stubIds as string[] } },
    include: { event: true, user: { select: { id: true, handle: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Sort by the Redis order
  const stubMap = new Map(stubs.map((s: { id: string }) => [s.id, s]));
  return (stubIds as string[]).map((id: string) => stubMap.get(id)).filter(Boolean);
}

export async function fanoutOnStubCreate(userId: string, stubId: string) {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    select: { followerId: true },
  });

  const timestamp = Date.now();

  // Hybrid: skip fan-out for power users (≥10k followers)
  if (followers.length >= 10000) return;

  // Fan out to all followers
  const promises = followers.map((f: { followerId: string }) => addToFeed(f.followerId, stubId, timestamp));
  await Promise.all(promises);
}
