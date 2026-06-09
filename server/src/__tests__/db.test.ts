import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

describe('Database', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    expect(result).toBeDefined();
  });

  it('should have User table after migration', async () => {
    const count = await prisma.user.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should have Event table after migration', async () => {
    const count = await prisma.event.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should have Stub table after migration', async () => {
    const count = await prisma.stub.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
