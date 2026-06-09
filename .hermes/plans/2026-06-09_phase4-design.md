# Stub — Phase 4: Design System Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Real stub templates with a deterministic design system. Server-side PNG rendering. Template variants by event type. Open Graph image generation for social sharing.

**Architecture:** Node-canvas rendering engine on the server. Templates defined as TypeScript modules with type-specific layouts. Stub images cached in the filesystem (S3-ready). OG images generated on-the-fly.

**Tech additions:** canvas (node-canvas), sharp, @resvg/resvg-js (SVG → PNG)

---

## Task 1: Template System — Design Definitions

**Objective:** Define the template data structures and create one base template + per-type variants.

**Files:**
- Create: `server/src/templates/types.ts` — type definitions
- Create: `server/src/templates/base.template.ts` — base stub layout
- Create: `server/src/templates/concert.template.ts`
- Create: `server/src/templates/sports.template.ts`
- Create: `server/src/templates/flight.template.ts`
- Create: `server/src/templates/comedy.template.ts`
- Create: `server/src/templates/theater.template.ts`
- Create: `server/src/templates/custom.template.ts`
- Create: `server/src/templates/index.ts` — registry

**Template structure:**
```typescript
interface StubTemplate {
  id: string;
  name: string;
  eventType: string;
  tier: 'standard' | 'premium'; // premium = Stub+
  width: number;  // 1200
  height: number; // 630 (OG-friendly)
  colors: {
    background: string;
    accent: string;
    text: string;
    secondary: string;
    border: string;
  };
  render(ctx: CanvasRenderingContext2D, data: RenderData): void;
}

interface RenderData {
  eventTitle: string;
  eventType: string;
  venueName?: string;
  venueCity?: string;
  eventDate: string;
  eventTime?: string;
  seat?: string;
  companions?: string;
  userName: string;
  userHandle: string;
  stubNumber: number; // user's nth stub
}
```

**Color palettes by type:**
- Concert: deep purple (#2d1b69) + gold (#f5a623)
- Sports: dark green (#1a3a1a) + neon green (#22c55e)
- Flight: navy (#1a1a3a) + sky blue (#60a5fa)
- Comedy: dark red (#3a1a1a) + warm yellow (#fbbf24)
- Theater: dark burgundy (#3a1a2a) + rose (#f43f5e)
- Custom: dark gray (#1a1a1a) + white (#ffffff)

---

## Task 2: Render Engine — Server-Side PNG Generation

**Objective:** Build the server-side rendering engine that takes a template + stub data and produces a PNG.

**Files:**
- Create: `server/src/services/render.service.ts`
- Create: `server/src/__tests__/render.test.ts`

**Key functions:**
- `renderStub(stubData, templateId?): Promise<Buffer>` — renders a PNG
- `renderOGImage(stubData): Promise<Buffer>` — renders OG-optimized version (1200×630)
- `saveStubImage(stubId, buffer): Promise<string>` — saves to disk, returns path

**Render pipeline:**
1. Load template by ID or auto-select by event type
2. Create canvas (1200×630)
3. Draw background, borders, typography, decorative elements
4. Return PNG buffer

**Dependencies:** `npm install canvas` (node-canvas for server-side rendering)

---

## Task 3: Stub Render Worker — Async + Queue

**Objective:** Wire rendering into the stub creation flow. When a stub is created or published from draft, queue a render job.

**Files:**
- Create: `server/src/workers/render.worker.ts`
- Modify: `server/src/services/stub.service.ts` — trigger render on create
- Modify: `server/src/services/import.service.ts` — trigger render on publish

**Flow:**
1. Stub created → render service called async (fire-and-forget)
2. Render generates PNG → saves to `server/data/images/{stubId}.png`
3. Stub record updated with `generatedImageUrl` pointing to the image path

**Worker:** `npx tsx src/workers/render.worker.ts` — processes pending render jobs (finds stubs without generatedImageUrl)

---

## Task 4: OG Image Endpoint

**Objective:** Serve Open Graph images for social sharing — renders on-the-fly with caching.

**Files:**
- Create: `server/src/routes/og.routes.ts`
- Modify: `server/src/app.ts`

**Endpoint:** `GET /og/:stubId` — dynamically generates and serves a stub OG image

Returns the rendered PNG with `Content-Type: image/png`. Caches to disk for 24 hours. Falls back to a default Stub logo if stub not found.

---

## Task 5: Client — Template Preview + Stub Card Upgrade

**Objective:** Show stub template preview when creating a stub. Upgrade StubCard to show a thumbnail of the rendered image.

**Files:**
- Modify: `client/src/pages/NewStubPage.tsx` — add template selector
- Modify: `client/src/components/StubCard.tsx` — show image thumbnail if available
- Create: `client/src/components/TemplatePreview.tsx` — live preview of template selection

**Template selector:** Dropdown or button group showing template names/icons per event type. Shows a small preview of what the stub will look like.

---

## Task 6: E2E Render Test + Polish

**Objective:** End-to-end test of the rendering pipeline, update README, run full suite.

**E2E flow:**
1. Create a stub → verify render is triggered
2. Wait for render → verify generatedImageUrl is set
3. Fetch OG image → verify PNG is returned
4. Create stubs of each event type → verify different templates used

**Final:**
- Update README with Phase 4 features
- Run full test suite (server + client)
- Commit and push
