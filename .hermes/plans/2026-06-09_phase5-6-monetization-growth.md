# Stub — Phase 5+6: Monetization + Growth Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Monetize with Stub+ subscriptions and physical prints. Go viral with PWA, animations, collections, and milestones.

**Architecture additions:** Stripe for billing, Printful for physical prints, Workbox for PWA service worker, Framer Motion for animations.

---

## Phase 5: Monetization

### Task 1: Subscription Model — Plan Tiers + Stripe Integration

**Objective:** Stripe checkout + webhook, plan tier enforcement, premium template gating.

**Files:**
- Create: `server/src/services/billing.service.ts`
- Create: `server/src/routes/billing.routes.ts`
- Create: `server/src/__tests__/billing.test.ts`
- Modify: `server/src/middleware/auth.ts` — add `requirePlan()` middleware
- Modify: `server/src/app.ts`

**API endpoints:**
```
POST /api/billing/create-checkout   — create Stripe Checkout session
POST /api/billing/webhook           — Stripe webhook handler (plan updates)
GET  /api/billing/portal            — Stripe Customer Portal link
```

Note: Stripe requires real API keys. Build with mockable client that works without keys for tests.

### Task 2: Premium Templates — Vintage, Foil, Holographic

**Objective:** Add 3 premium templates gated behind Stub+.

**Files:**
- Create: `server/src/templates/premium/vintage.template.ts`
- Create: `server/src/templates/premium/foil.template.ts`
- Create: `server/src/templates/premium/holographic.template.ts`
- Modify: `server/src/templates/index.ts` — add premium registry
- Modify: `server/src/services/render.service.ts` — plan check before premium render

Vintage: sepia tones, serif fonts, distressed border
Foil: metallic gradient overlay, gold/silver shimmer effect
Holographic: rainbow gradient background, iridescent border

### Task 3: Year in Review

**Objective:** Generate a "Year in Review" summary image — stats, top events, milestones.

**Files:**
- Create: `server/src/services/year-in-review.service.ts`
- Create: `server/src/routes/year-in-review.routes.ts`
- Create: `server/src/__tests__/year-in-review.test.ts`

**Endpoint:** `GET /api/year-in-review/:year` — returns rendered image. Free users get watermarked version, Stub+ gets clean.

### Task 4: Physical Prints

**Objective:** Print-on-demand — order any stub or collection as physical cardstock via Printful.

**Files:**
- Create: `server/src/services/print.service.ts`
- Create: `server/src/routes/print.routes.ts`

Note: Printful requires API key. Scaffold the service with mockable client.

---

## Phase 6: Growth

### Task 5: PWA — Installable + Offline

**Objective:** Add PWA manifest, service worker, offline caching.

**Files:**
- Create: `client/public/manifest.json`
- Create: `client/public/stub.svg` (icon)
- Create: `client/src/sw.ts` (service worker with Workbox)
- Modify: `client/index.html` — add manifest link, meta tags
- Modify: `client/vite.config.ts` — add PWA plugin

### Task 6: Collections + Milestones

**Objective:** User-curated stub collections. Milestone badges for hitting counts.

**Files:**
- Create: `server/src/services/collection.service.ts`
- Create: `server/src/routes/collection.routes.ts`
- Create: `server/src/services/milestone.service.ts`
- Create: `server/src/__tests__/collection.test.ts`
- Create: `client/src/pages/CollectionsPage.tsx`
- Create: `client/src/components/MilestoneBadge.tsx`

**API endpoints:**
```
POST   /api/collections              — create collection
GET    /api/collections              — list my collections
PUT    /api/collections/:id          — update (add/remove stubs)
DELETE /api/collections/:id          — delete
GET    /api/users/:handle/collections — public collections
GET    /api/milestones/:handle       — milestone badges
```

### Task 7: Animated Sharing + Client Polish

**Objective:** Add Framer Motion animations for stub reveal and collection wall transitions.

**Files:**
- Modify: `client/src/components/StubCard.tsx` — entrance animation
- Modify: `client/src/pages/ProfilePage.tsx` — staggered grid animation
- Create: `client/src/components/ShareButton.tsx` — copy link / share flow
- Modify: `client/src/App.tsx` — nav bar update

### Task 8: E2E + Polish + Deploy

**Objective:** Full test suite, README update, final deploy.

Update README with all Phase 5+6 features. Run full test suites. Commit and push.
