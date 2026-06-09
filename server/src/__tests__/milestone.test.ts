import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';
import { getMilestones } from '../services/milestone.service';

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

describe('getMilestones', () => {
  it('should return milestones for a user with stubs', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'miles@test.com', handle: 'milestone', displayName: 'Miles',
        emailForwardAddress: 'miles@stub.app',
      },
    });

    const event = await prisma.event.create({
      data: { type: 'concert', title: 'Test', eventDate: new Date('2024-01-01') },
    });

    // Create 10 stubs
    for (let i = 0; i < 10; i++) {
      await prisma.stub.create({
        data: { userId: user.id, eventId: event.id },
      });
    }

    const result = await getMilestones('milestone');
    expect(result.totalStubs).toBe(10);
    expect(result.milestones.length).toBeGreaterThanOrEqual(2); // First Stub + Collector
    expect(result.milestones[0].name).toBe('First Stub');
    expect(result.milestones[1].name).toBe('Collector');
    expect(result.nextMilestone).toBeDefined();
    expect(result.nextMilestone!.count).toBe(25);
  });

  it('should return zeroes for user with no stubs', async () => {
    await prisma.user.create({
      data: {
        email: 'empty@test.com', handle: 'empty', displayName: 'Empty',
        emailForwardAddress: 'empty@stub.app',
      },
    });

    const result = await getMilestones('empty');
    expect(result.totalStubs).toBe(0);
    expect(result.milestones).toEqual([]);
    expect(result.nextMilestone).toBeDefined();
  });

  it('should throw for non-existent user', async () => {
    await expect(getMilestones('nobody')).rejects.toThrow('USER_NOT_FOUND');
  });

  it('should count unique cities', async () => {
    const user = await prisma.user.create({
      data: { email: 'cities@test.com', handle: 'cities', displayName: 'Cities', emailForwardAddress: 'cities@stub.app' },
    });

    const ev1 = await prisma.event.create({ data: { type: 'concert', title: 'T1', venueCity: 'New York', eventDate: new Date() } });
    const ev2 = await prisma.event.create({ data: { type: 'sports', title: 'T2', venueCity: 'London', eventDate: new Date() } });
    const ev3 = await prisma.event.create({ data: { type: 'flight', title: 'T3', venueCity: 'New York', eventDate: new Date() } });

    await prisma.stub.create({ data: { userId: user.id, eventId: ev1.id } });
    await prisma.stub.create({ data: { userId: user.id, eventId: ev2.id } });
    await prisma.stub.create({ data: { userId: user.id, eventId: ev3.id } });

    const result = await getMilestones('cities');
    expect(result.cities).toBe(2); // New York + London (NY counted once)
    expect(result.uniqueEvents).toBe(3);
  });
});
