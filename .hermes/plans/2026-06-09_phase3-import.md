# Stub — Phase 3: Import System Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Zero-friction onboarding — users can import stubs from wallet passes and email confirmations. Draft review flow. Background catalog enrichment.

**Architecture:** New imports module on the server. Draft stubs extend the existing Stub model with an importSource field. Enrichment worker as a standalone script. Email parsing with template-based extraction + LLM fallback scaffold.

**Constraints:** External APIs (PassKit, Google Wallet, Setlist.fm, Ticketmaster, SES) require credentials we don't have. Build the full service logic with mockable API clients so real keys can be dropped in later.

---

## Task 1: Draft Stubs — Model + Migration

**Objective:** Add import support to the Stub model — importSource, isDraft, importData fields.

**Files:**
- Modify: `server/prisma/schema.prisma` — add fields to Stub
- Run: `npx prisma migrate dev --name add-import-fields`
- Update all test cleanup to handle new fields

**Schema changes to Stub model:**
```prisma
model Stub {
  // ... existing fields ...
  importSource      String?  @map("import_source")   // "wallet_apple" | "wallet_google" | "email" | "manual"
  isDraft           Boolean  @default(false) @map("is_draft")
  importData        Json?    @map("import_data")      // raw import payload
}
```

---

## Task 2: Import Service — Core Logic

**Objective:** Build the import pipeline — accept raw event data, normalize it, run through dedup, create draft stubs.

**Files:**
- Create: `server/src/services/import.service.ts`
- Create: `server/src/routes/import.routes.ts`
- Create: `server/src/__tests__/import.test.ts`
- Modify: `server/src/app.ts`

**Key functions:**
- `importEvents(userId, items: RawImportItem[])` — batch import with dedup
- `publishStub(userId, stubId)` — promote draft → published
- `rejectStub(userId, stubId)` — delete draft
- `getDraftStubs(userId)` — list drafts for review
- `getImportStats(userId)` — counts by source

**API endpoints:**
```
POST   /api/import/batch       { items: RawImportItem[] }  — batch import, returns draft stubs
GET    /api/import/drafts      — list user's draft stubs
POST   /api/import/:stubId/publish  — publish a draft
DELETE /api/import/:stubId/reject   — reject/discard draft
GET    /api/import/stats       — import stats by source
```

---

## Task 3: Wallet Pass Parser

**Objective:** Parse Apple Wallet (.pkpass) and Google Wallet pass data into RawImportItem format.

**Files:**
- Create: `server/src/services/wallet-parser.service.ts`
- Create: `server/src/__tests__/wallet-parser.test.ts`

**Key functions:**
- `parseApplePass(passData: any): RawImportItem` — extract event from pkpass JSON
- `parseGooglePass(passData: any): RawImportItem` — extract from Google Wallet pass
- `detectPassType(data: any): 'apple' | 'google' | null`

**Mock data for testing:**
```typescript
const SAMPLE_APPLE_PASS = {
  passTypeIdentifier: "pass.com.ticketmaster.event",
  serialNumber: "abc123",
  relevantDate: "2024-08-15T19:00:00Z",
  eventTicket: {
    primaryFields: [
      { key: "event", label: "Event", value: "Taylor Swift Eras Tour" },
      { key: "venue", label: "Venue", value: "SoFi Stadium" }
    ],
    secondaryFields: [
      { key: "date", label: "Date", value: "August 15, 2024" },
      { key: "seat", label: "Seat", value: "Section 104, Row J, Seat 7" }
    ]
  }
};

const SAMPLE_GOOGLE_PASS = {
  classId: "flight",
  eventName: { defaultValue: { language: "en", value: "JFK → LHR" } },
  flightHeader: { carrier: { carrierIataCode: "DL" }, flightNumber: "1234" },
  origin: { airportIataCode: "JFK" },
  destination: { airportIataCode: "LHR" },
  startDate: "2024-07-04T10:00:00Z"
};
```

---

## Task 4: Email Parser Service

**Objective:** Parse forwarded ticket confirmation emails into RawImportItem format using template matching + LLM fallback scaffold.

**Files:**
- Create: `server/src/services/email-parser.service.ts`
- Create: `server/src/__tests__/email-parser.test.ts`

**Key functions:**
- `parseEmail(rawEmail: string): RawImportItem | null` — try known sender templates, fall back to LLM
- `extractByTemplate(senderDomain: string, body: string): RawImportItem | null`
- `extractByLLM(body: string): Promise<RawImportItem | null>` — scaffold, calls Anthropic if API key present

**Sender templates** (regex-based extraction):
- `ticketmaster.com` — extract event name, date, venue, seat from confirmation email
- `stubhub.com` — similar extraction
- `delta.com` / `united.com` — flight itineraries
- `mlb.com` — game tickets

**Mock emails for testing:**
```typescript
const TICKETMASTER_EMAIL = `
Subject: Your Ticketmaster Order Confirmation
From: customer-support@ticketmaster.com

Event: Taylor Swift | The Eras Tour
Venue: SoFi Stadium, Inglewood, CA
Date: August 5, 2024 at 7:00 PM
Seat: Section 104, Row J, Seat 7
Order #: 12-34567/LAX
`;
```

---

## Task 5: Bulk Import Review — Client

**Objective:** Build the import review UI — users can review, publish, or discard imported draft stubs.

**Files:**
- Create: `client/src/pages/ImportReviewPage.tsx`
- Create: `client/src/components/DraftStubCard.tsx`
- Create: `client/src/__tests__/ImportReviewPage.test.tsx`
- Modify: `client/src/App.tsx` — add route

**UI flow:**
1. User triggers import (wallet connect or email forward — for now, manual upload)
2. Import service processes items → creates draft stubs
3. Redirect to `/import/review` — shows all drafts with event details
4. User can publish all, publish individually, or discard individually
5. Published stubs trigger fan-out + render as normal

---

## Task 6: Catalog Enrichment Worker

**Objective:** Background script that periodically attempts to match Tier 3 events to canonical sources (Setlist.fm, Ticketmaster).

**Files:**
- Create: `server/src/workers/enrichment.worker.ts`
- Create: `server/src/services/enrichment.service.ts`
- Create: `server/src/__tests__/enrichment.test.ts`

**Key functions:**
- `enrichEvents()` — find Tier 3 events without externalId, attempt API lookups
- `matchToSetlistFm(event: Event): Promise<ExternalMatch | null>`
- `matchToTicketmaster(event: Event): Promise<ExternalMatch | null>`
- `mergeEvents(tier3Id: string, canonicalData: ExternalMatch)` — promote Tier 3 → Tier 1, merge stubs

**Run:** `npx tsx src/workers/enrichment.worker.ts` (standalone, can be cron'd)

---

## Task 7: E2E Import Test + Polish

**Objective:** End-to-end test of the import flow, update README, run full test suite.

**E2E flow:**
1. Register user
2. Post batch import with 3 raw items (wallet pass data)
3. Verify 3 draft stubs created
4. Publish 2, reject 1
5. Verify profile has 2 stubs (1 from the published ones)
6. Verify import stats show correct counts
7. Run enrichment on the created events

**Final:**
- Update README with Phase 3 features
- Run full test suite (server + client)
- Commit and push
