import { prisma } from '../lib/prisma';

export async function followUser(followerId: string, handle: string) {
  const target = await prisma.user.findUnique({ where: { handle } });
  if (!target) throw new SocialError('User not found', 404, 'USER_NOT_FOUND');
  if (target.id === followerId) throw new SocialError('Cannot follow yourself', 400, 'SELF_FOLLOW');

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });
  if (existing) throw new SocialError('Already following', 409, 'ALREADY_FOLLOWING');

  await prisma.follow.create({
    data: { followerId, followingId: target.id },
  });

  return { following: { id: target.id, handle: target.handle, displayName: target.displayName } };
}

export async function unfollowUser(followerId: string, handle: string) {
  const target = await prisma.user.findUnique({ where: { handle } });
  if (!target) throw new SocialError('User not found', 404, 'USER_NOT_FOUND');

  await prisma.follow.deleteMany({
    where: { followerId, followingId: target.id },
  });

  return { unfollowed: handle };
}

export async function getFollowing(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, handle: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return follows.map(f => f.following);
}

export async function getFollowers(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: { id: true, handle: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return follows.map(f => f.follower);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return follows.map(f => f.followingId);
}

export async function getFollowStats(handle: string) {
  const user = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
  if (!user) throw new SocialError('User not found', 404, 'USER_NOT_FOUND');

  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);
  return { followers, following };
}

export class SocialError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message);
  }
}
