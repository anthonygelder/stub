import { prisma } from '../lib/prisma';

const VALID_TYPES = ['was_there', 'jealous', 'want_to_go'] as const;

export async function toggleReaction(userId: string, stubId: string, type: string) {
  if (!VALID_TYPES.includes(type as any)) {
    throw new Error('INVALID_REACTION_TYPE');
  }

  const stub = await prisma.stub.findUnique({ where: { id: stubId } });
  if (!stub) throw new Error('STUB_NOT_FOUND');

  const existing = await prisma.reaction.findUnique({
    where: { stubId_userId_type: { stubId, userId, type } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { removed: true, type };
  }

  const reaction = await prisma.reaction.create({
    data: { stubId, userId, type },
  });

  return { id: reaction.id, type, removed: false };
}

export async function getReactions(stubId: string) {
  const reactions = await prisma.reaction.findMany({
    where: { stubId },
    select: { type: true, userId: true },
  });

  const counts: Record<string, number> = { was_there: 0, jealous: 0, want_to_go: 0 };
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }

  return { counts, total: reactions.length };
}

export async function getMyReaction(userId: string, stubId: string) {
  const reaction = await prisma.reaction.findFirst({
    where: { stubId, userId },
    select: { type: true },
  });
  return reaction?.type || null;
}
