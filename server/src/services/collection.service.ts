import { prisma } from '../lib/prisma';

export async function createCollection(userId: string, title: string, description?: string) {
  return prisma.collection.create({ data: { userId, title, description } });
}

export async function getMyCollections(userId: string) {
  return prisma.collection.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function getPublicCollections(handle: string) {
  const user = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
  if (!user) throw new Error('USER_NOT_FOUND');
  return prisma.collection.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
}

export async function updateCollection(userId: string, collectionId: string, data: { title?: string; description?: string }) {
  const col = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
  if (!col) throw new Error('NOT_FOUND');
  return prisma.collection.update({ where: { id: collectionId }, data });
}

export async function deleteCollection(userId: string, collectionId: string) {
  const col = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
  if (!col) throw new Error('NOT_FOUND');
  await prisma.collection.delete({ where: { id: collectionId } });
}
