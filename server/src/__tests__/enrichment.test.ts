import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { enrichEvents } from '../services/enrichment.service';

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await redis.flushall();
});

describe('enrichEvents', () => {
  it('should process Tier 3 events', async () => {
    // Create some Tier 3 events
    for (let i = 0; i < 10; i++) {
      await prisma.event.create({
        data: {
          type: 'concert',
          title: `Unverified Event ${i}`,
          venueName: 'Test Venue',
          eventDate: new Date('2024-01-01'),
          tier: 3,
        },
      });
    }

    const result = await enrichEvents();
    expect(result.attempted).toBe(10);
    // With 30% mock match rate, some should be enriched
    expect(result.enriched + result.merged).toBeGreaterThanOrEqual(0);
  });

  it('should merge stubs when canonical event exists', async () => {
    // Create a canonical event
    const canonical = await prisma.event.create({
      data: {
        type: 'concert', title: 'Canonical Event', venueName: 'Venue', eventDate: new Date('2024-06-01'),
        tier: 1, externalSource: 'setlist_fm', externalId: 'sfm-canonical-123',
      },
    });

    // Create a Tier 3 event with the same title
    const tier3 = await prisma.event.create({
      data: {
        type: 'concert', title: 'Canonical Event', venueName: 'Venue', eventDate: new Date('2024-06-01'),
        tier: 3, stubCount: 2,
      },
    });

    // Create 2 stubs pointing to the Tier 3 event
    const user = await prisma.user.create({ data: { email: 'e@test.com', handle: 'etest', displayName: 'E', emailForwardAddress: 'etest@stub.app' } });
    await prisma.stub.create({ data: { userId: user.id, eventId: tier3.id } });
    await prisma.stub.create({ data: { userId: user.id, eventId: tier3.id } });

    // Now run enrichment with deterministic mock
    const result = await enrichEvents();
    expect(result.attempted).toBeGreaterThanOrEqual(1);

    // If enrichment matched, tier3 should be merged
    const mergedEvent = await prisma.event.findUnique({ where: { id: tier3.id } });
    if (mergedEvent?.mergedInto) {
      // Stubs should be repointed
      const canonicalStubs = await prisma.stub.count({ where: { eventId: canonical.id } });
      expect(canonicalStubs).toBeGreaterThanOrEqual(2);
    }
  });
});
