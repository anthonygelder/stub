# Stub — Phase 2: Social Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add the social layer — follow graph, home feed with Redis fan-out, reactions, corroboration detection, and discovery queries.

**Architecture:** Redis for feed cache (sorted sets), Server-Sent Events (SSE) for real-time feed updates, hybrid fan-out strategy. All models already exist in Prisma schema from Phase 1.

**Tech Stack additions:** ioredis (already installed), BullMQ (job queue for fan-out worker)

---

## Task 1: Redis Client Setup

**Objective:** Create a Redis client module, verify connectivity, add to app context.

**Files:**
- Create: `server/src/lib/redis.ts`
- Create: `server/src/__tests__/redis.test.ts`
- Modify: `server/vitest.config.ts` (add setup/teardown for Redis)

**Step 1: Write failing test** — test Redis ping

**Step 2: Create `server/src/lib/redis.ts`**:
```typescript
import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.warn('Redis connection error:', err.message);
});

export async function connectRedis() {
  await redis.connect();
  await redis.ping();
}

// Sorted set helpers for feed
export async function addToFeed(userId: string, stubId: string, timestamp: number) {
  const key = `feed:${userId}`;
  await redis.zadd(key, timestamp, stubId);
  // Trim to last 500
  await redis.zremrangebyrank(key, 0, -501);
}

export async function getFeed(userId: string, cursor?: number, limit = 20) {
  const key = `feed:${userId}`;
  if (cursor) {
    return redis.zrevrangebyscore(key, cursor - 1, '-inf', 'LIMIT', 0, limit);
  }
  return redis.zrevrange(key, 0, limit - 1);
}

export async function cacheEvent(eventId: string, data: any, ttl = 3600) {
  await redis.setex(`event:${eventId}`, ttl, JSON.stringify(data));
}

export async function getCachedEvent(eventId: string) {
  const raw = await redis.get(`event:${eventId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function incrementCorroborationCount(eventId: string) {
  return redis.incr(`corroboration:${eventId}`);
}

export async function getCorroborationCount(eventId: string) {
  const count = await redis.get(`corroboration:${eventId}`);
  return count ? parseInt(count) : 0;
}
```

**Step 3: Update `server/src/index.ts`** — connect Redis on startup

**Step 4: Run tests — verify pass**

---

## Task 2: Follow Service — Follow/Unfollow/List

**Objective:** Implement follow/unfollow with the existing Follow model.

**Files:**
- Create: `server/src/services/social.service.ts`
- Create: `server/src/routes/social.routes.ts`
- Create: `server/src/__tests__/social.test.ts`
- Modify: `server/src/app.ts` (mount routes)

**TDD Flow:**
1. Write tests: POST /api/social/follow, POST /api/social/unfollow, GET /api/social/following, GET /api/social/followers
2. Implement service: followUser, unfollowUser, getFollowing, getFollowers, getFollowingIds
3. Mount routes at /api/social

**Key API endpoints:**

```
POST /api/social/follow     { handle: "username" }
POST /api/social/unfollow   { handle: "username" }
GET  /api/social/following  — who I follow
GET  /api/social/followers  — who follows me
GET  /api/social/:handle/follow-stats — follower/following counts
```

---

## Task 3: Reactions Service

**Objective:** Allow users to react to stubs with was_there, jealous, want_to_go.

**Files:**
- Create: `server/src/services/reaction.service.ts`
- Create: `server/src/routes/reaction.routes.ts`
- Create: `server/src/__tests__/reaction.test.ts`
- Modify: `server/src/app.ts`

**TDD Flow:**
1. Write tests: POST react, DELETE un-react, GET reactions for stub, GET my reaction
2. Implement service: toggleReaction, removeReaction, getStubReactions (with counts by type)

**API endpoints:**
```
POST   /api/stubs/:id/reactions     { type: "was_there" | "jealous" | "want_to_go" }
DELETE /api/stubs/:id/reactions     — remove my reaction
GET    /api/stubs/:id/reactions     — all reactions with counts
```

---

## Task 4: Feed Service — Fan-out on Write + Redis Sorted Sets

**Objective:** Implement hybrid fan-out feed. When a user creates a stub, push it to all followers' Redis sorted sets.

**Files:**
- Create: `server/src/services/feed.service.ts`
- Create: `server/src/routes/feed.routes.ts`
- Create: `server/src/__tests__/feed.test.ts`
- Modify: `server/src/routes/stub.routes.ts` (trigger fan-out on create)
- Modify: `server/src/app.ts`

**TDD Flow:**
1. Write tests: GET /api/feed returns stubs from followed users, ordered by recency
2. Implement feed service: getFeedForUser (reads Redis sorted set, falls back to Postgres)
3. Modify stub creation to trigger fan-out

**Fan-out logic:**
- On stub create: get all follower IDs, ZADD stub_id into each follower's feed:{userId} sorted set
- For power users (≥10k followers): skip fan-out, their stubs are pulled on read
- Feed read: ZREVRANGE feed:{userId} → hydrate stub IDs from Postgres in batch

**API endpoint:**
```
GET /api/feed?cursor=<timestamp>&limit=20
```

---

## Task 5: Corroboration Detection

**Objective:** Detect when 3+ independent users log the same event and trigger notifications.

**Files:**
- Modify: `server/src/services/stub.service.ts` (add corroboration check on create)
- Create: `server/src/services/corroboration.service.ts`
- Create: `server/src/__tests__/corroboration.test.ts`

**TDD Flow:**
1. Write tests: 3 users stub same event → event promoted to tier 2, Corroboration record created
2. Implement: checkCorroboration(eventId) — count distinct users, promote if ≥3
3. Integrate into stub creation flow

---

## Task 6: Discovery Queries

**Objective:** Add curated discovery endpoints — trending events, shared experiences.

**Files:**
- Create: `server/src/services/discovery.service.ts`
- Create: `server/src/routes/discovery.routes.ts`
- Create: `server/src/__tests__/discovery.test.ts`
- Modify: `server/src/app.ts`

**API endpoints:**
```
GET /api/discover/trending     — most-stubbed events in last 7 days
GET /api/discover/shared/:handle — events we both attended
GET /api/discover/from/:eventId — who else was at this event
```

---

## Task 7: Client — Social Pages

**Objective:** Build the client-side pages for the social features.

**Files:**
- Create: `client/src/pages/FeedPage.tsx`
- Create: `client/src/components/FollowButton.tsx`
- Modify: `client/src/pages/ProfilePage.tsx` (add follow button, follow stats)
- Modify: `client/src/components/StubCard.tsx` (add reaction buttons)
- Modify: `client/src/App.tsx` (add routes)
- Create: `client/src/__tests__/FeedPage.test.tsx`

**Key UI:**
- FeedPage: main feed with stub cards from followed users
- FollowButton: toggle follow/unfollow
- ProfilePage: follower/following counts, follow button
- StubCard: reaction buttons (was_there, jealous, want_to_go) with counts

---

## Task 8: E2E Social Test

**Objective:** End-to-end test of the full social loop.

**Test flow:**
1. Create 3 users
2. User A follows User B and User C
3. User B and User C each log a stub
4. User A's feed shows both stubs in order
5. User B and User C both stub the same event — corroboration triggers
6. User A reacts to User B's stub
7. Discovery shows the trending event

---

## Task 9: Full Test Suite + Polish

Same as Phase 1 — run all tests, verify no regressions, commit.
