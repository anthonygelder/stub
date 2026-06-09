import { prisma } from '../lib/prisma';
import { v4 as uuid } from 'uuid';

function generateEmailForwardAddress(handle: string): string {
  return `${handle}.${uuid().split('-')[0]}@stub.app`;
}

export async function findOrCreateOAuthUser(provider: 'google' | 'apple', providerId: string, profile: { email: string; displayName: string }) {
  const idField = provider === 'google' ? 'googleId' : 'appleId';
  
  // Find existing user by provider ID
  let user = await prisma.user.findFirst({ where: { [idField]: providerId } });
  if (user) return user;

  // Find by email — link accounts
  user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (user) {
    user = await prisma.user.update({ where: { id: user.id }, data: { [idField]: providerId } });
    return user;
  }

  // Create new user
  const baseHandle = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
  let handle = baseHandle;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { handle } })) {
    handle = `${baseHandle}_${suffix++}`;
  }

  user = await prisma.user.create({
    data: {
      email: profile.email,
      handle,
      displayName: profile.displayName,
      [idField]: providerId,
      emailForwardAddress: generateEmailForwardAddress(handle),
    },
  });

  return user;
}
