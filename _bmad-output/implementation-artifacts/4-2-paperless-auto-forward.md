# Story 4.2: Paperless Auto-Forward (Accountant Integration)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **the system**,
I want original, untouched documents to be auto-forwarded to Paperless independently of FOS processing,
So that the accountant always receives documents even if FOS is down.

## Acceptance Criteria

1. **Gmail Filter Configuration**: Gmail filters are configured so that emails arriving at `orders@`, `supplies@`, `developing@`, and `expenses@` are auto-forwarded to the Paperless accountant email address. Forwarding uses Gmail's native filter/forwarding feature (not FOS code). The original email and attachments are forwarded untouched — no AI modification, no compression, no format conversion (FR42).

2. **Independent Parallel Operation**: When FOS is operational and a new email arrives, Gmail filter forwards the original to Paperless AND Pub/Sub triggers FOS processing independently — neither blocks the other. When FOS is down or Cloud Functions are unavailable, Gmail filter still forwards the original to Paperless (FR43). The email remains in Gmail for FOS to process when it recovers, and Pub/Sub notifications are retained and delivered when the function becomes available.

3. **Forwarding Status Tracking in email_log**: When FOS processes an email via `onEmailReceived`, the `email_log` document includes `paperlessForwarded: true` to track that the email was also forwarded to Paperless. Forwarding status is derived from Gmail filter configuration, not FOS runtime logic — FOS trusts that Gmail filters are configured correctly.

4. **EmailLog Schema Update**: Both `src/types/email.ts` (client) and `functions/src/shared/schemas.ts` (server) include the `paperlessForwarded` boolean field in the `emailLogSchema`. The field is `z.boolean()` (no `.default()` — Zod 4 rule).

5. **Audit Trail Completeness (FR44)**: The `email_log` collection provides a complete audit trail for verifying which documents were forwarded to Paperless. Each document includes: email subject, sender (`from`), received date (`receivedAt`), designated mailbox, and forwarding status (`paperlessForwarded`). Gal can query/filter this collection to verify forwarding.

6. **Paperless Configuration**: The accountant's Paperless email address is stored as a Cloud Functions environment config parameter (`PAPERLESS_EMAIL`) via `defineString` for documentation and future reference. FOS does not use this parameter for actual email sending — Gmail filters handle forwarding independently.

## Tasks / Subtasks

- [x] Task 1: Update client-side EmailLog schema (AC: #4)
  - [x] Add `paperlessForwarded: z.boolean()` field to `emailLogSchema` in `src/types/email.ts`
  - [x] Verify `EmailLog` type correctly infers the new field via `z.infer`

- [x] Task 2: Update server-side EmailLog schema (AC: #4)
  - [x] Add `paperlessForwarded: z.boolean()` field to `emailLogSchema` in `functions/src/shared/schemas.ts`

- [x] Task 3: Update `onEmailReceived` to include `paperlessForwarded` (AC: #3)
  - [x] Add `paperlessForwarded: true` to the success-path email_log document creation in `functions/src/email/onEmailReceived.ts`
  - [x] Add `paperlessForwarded: true` to the error-path email_log document creation (Gmail filter still forwards even if FOS processing fails)

- [x] Task 4: Add Paperless config parameter (AC: #6)
  - [x] Add `paperlessEmail` string parameter in `functions/src/config.ts` using `defineString`

- [x] Task 5: Update tests (AC: all)
  - [x] Update `src/types/email.test.ts` — add tests for `paperlessForwarded` boolean field validation
  - [x] Update `functions/tests/email.test.ts` — verify `paperlessForwarded: true` appears in email_log documents (both success and error paths)
  - [x] Ensure all existing mocks/fixtures that create EmailLog objects include the new `paperlessForwarded` field

- [x] Task 6: Build verification (AC: all)
  - [x] `cd functions && npx tsc --noEmit` — zero TypeScript errors in functions
  - [x] `npm run test` — all client-side tests pass, zero regressions
  - [x] `cd functions && npm run test` — all functions tests pass

## Dev Notes

### Architecture Compliance

- **Parallel Fork Pattern (FR42, FR43)**: This is the foundational integration pattern for TP-FOS. Gmail filters handle the actual forwarding to Paperless — FOS never touches, modifies, or forwards any emails. FOS is a parallel consumer, never a gatekeeper. If FOS is completely down, Paperless still receives documents. [Source: architecture.md#External-Integration-Points, prd.md#Integration-Architecture]
- **Zero direct integration with Paperless**: There is NO code in FOS that connects to, sends to, or communicates with Paperless in any way. No API calls, no webhooks, no shared database, no email sending. Paperless forwarding is entirely Gmail-level infrastructure. [Source: architecture.md#Accountant-Integration]
- **FOS trusts Gmail filters**: The `paperlessForwarded: true` field is set unconditionally on every email_log document because FOS assumes Gmail filters are correctly configured. FOS cannot verify Gmail filter execution at runtime — this is a design decision, not a limitation. [Source: epics.md#Story-4.2, AC criterion: "forwarding status is derived from Gmail filter configuration, not FOS logic"]
- **Cloud Functions 2nd Gen**: Project uses `firebase-functions@^6.3.2`. The `onEmailReceived` function already uses `onMessagePublished` from `firebase-functions/pubsub`. No trigger changes needed. [Source: architecture.md#Cloud-Functions-Inventory]
- **Naming conventions**: `paperlessForwarded` follows `camelCase` for Firestore document fields. Boolean naming matches the acceptance criteria verbatim from the epics file. [Source: architecture.md#Naming-Patterns]
- **Co-located tests**: Update existing co-located test files. No new test files needed. [Source: architecture.md#Testing-Standards]
- **NodeNext module resolution**: All relative imports in `functions/` must use `.js` extensions. No new imports are needed for this story, but any added imports must follow this pattern. [Source: functions/tsconfig.json]

### Critical Technical Constraints

- **This is primarily an infrastructure story**: The majority of work is Gmail filter configuration (manual, not code). Code changes are minimal — adding a single boolean field to schemas and two document creation points.

- **NO new npm dependencies needed**: Neither client `package.json` nor `functions/package.json` need any new packages.

- **NO new files to create**: All changes are modifications to existing files.

- **Existing files to MODIFY:**

  | File | Change |
  |---|---|
  | `src/types/email.ts` | Add `paperlessForwarded: z.boolean()` to emailLogSchema |
  | `functions/src/shared/schemas.ts` | Add `paperlessForwarded: z.boolean()` to server emailLogSchema |
  | `functions/src/email/onEmailReceived.ts` | Add `paperlessForwarded: true` to both email_log creation points |
  | `functions/src/config.ts` | Add `paperlessEmail` string parameter via `defineString` |
  | `src/types/email.test.ts` | Add tests for `paperlessForwarded` field |
  | `functions/tests/email.test.ts` | Add verification for `paperlessForwarded: true` in email_log docs |

- **Files NOT to modify:**
  - `functions/src/email/gmailClient.ts` — Gmail API wrapper has no changes
  - `functions/src/index.ts` — no new function exports
  - `functions/src/shared/types.ts` — `EmailLog` type auto-inferred from Zod schema; `ParsedEmailData` interface doesn't need paperless field
  - `functions/package.json` — no new dependencies
  - Any client-side components, hooks, stores, or pages — this story has zero UI impact
  - `src/types/index.ts` — already exports `./email`

### Schema Change Details

**Client-side (`src/types/email.ts`) — add one field:**
```typescript
export const emailLogSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  mailbox: z.enum(DESIGNATED_MAILBOXES),
  receivedAt: z.date(),
  status: z.enum(EMAIL_STATUSES),
  attachmentUrls: z.array(z.string()),
  subject: z.string(),
  from: z.string(),
  transactionId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paperlessForwarded: z.boolean(), // Tracks Paperless forwarding status (FR44)
});
```

**Server-side (`functions/src/shared/schemas.ts`) — add one field:**
```typescript
export const emailLogSchema = z.object({
  messageId: z.string(),
  mailbox: z.enum(DESIGNATED_MAILBOXES),
  receivedAt: z.any(), // Firestore Timestamp
  status: z.enum(EMAIL_STATUSES),
  attachmentUrls: z.array(z.string()),
  subject: z.string(),
  from: z.string(),
  transactionId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paperlessForwarded: z.boolean(), // Tracks Paperless forwarding status (FR44)
});
```

### onEmailReceived Update Details

In `functions/src/email/onEmailReceived.ts`, add `paperlessForwarded: true` to BOTH email_log document creation points:

**Success path (~line 119):**
```typescript
// Create email_log document with status 'received'
await db.collection('email_log').add({
  messageId,
  mailbox,
  receivedAt: FieldValue.serverTimestamp(),
  status: 'received',
  attachmentUrls: attachmentPaths,
  subject,
  from,
  transactionId: null,
  errorMessage: null,
  paperlessForwarded: true, // Gmail filter forwards to Paperless independently (FR42)
});
```

**Error path (~line 144):**
```typescript
await db.collection('email_log').add({
  messageId,
  mailbox,
  receivedAt: FieldValue.serverTimestamp(),
  status: 'failed',
  attachmentUrls: attachmentPaths,
  subject,
  from,
  transactionId: null,
  errorMessage: error instanceof Error ? error.message : String(error),
  paperlessForwarded: true, // Gmail filter still forwards even when FOS fails (FR43)
});
```

**CRITICAL**: `paperlessForwarded` is `true` even in the error path because Gmail filter forwarding is completely independent of FOS processing. If FOS fails to process the email, Gmail has already forwarded the original to Paperless.

### Config Update Details

In `functions/src/config.ts`, add after existing parameters:
```typescript
// Paperless accountant email address
// Actual forwarding handled by Gmail filters — this parameter is for documentation/reference
export const paperlessEmail = defineString('PAPERLESS_EMAIL', {
  default: '',
});
```

### Gmail Filter Setup Guide (Infrastructure — NOT Code)

The following must be configured manually in Gmail settings. This is infrastructure work, not automatable via code.

**Prerequisites:**
- Access to the Gmail account that receives emails at `orders@`, `supplies@`, `developing@`, `expenses@`
- The accountant's Paperless email address

**Step 1: Add Forwarding Address**
1. Open Gmail → Settings (gear icon) → See all settings
2. Navigate to "Forwarding and POP/IMAP" tab
3. Click "Add a forwarding address"
4. Enter the Paperless accountant email address
5. Click "Next" → "Proceed" → Gmail sends a verification email
6. Accountant must click the verification link in the email
7. Confirm the forwarding address appears as verified

**Step 2: Create Gmail Filters (4 total)**

For each designated mailbox, create a filter:

| Filter # | "To" Condition | Forward To | Additional |
|---|---|---|---|
| 1 | `orders@tailorplayed.com` | `<paperless-email>` | Keep Gmail's copy in Inbox |
| 2 | `supplies@tailorplayed.com` | `<paperless-email>` | Keep Gmail's copy in Inbox |
| 3 | `developing@tailorplayed.com` | `<paperless-email>` | Keep Gmail's copy in Inbox |
| 4 | `expenses@tailorplayed.com` | `<paperless-email>` | Keep Gmail's copy in Inbox |

**For each filter:**
1. Gmail → Settings → Filters and Blocked Addresses → Create a new filter
2. In "To" field, enter the designated address (e.g., `orders@tailorplayed.com`)
3. Click "Create filter"
4. Check: "Forward it to" → select the Paperless email address
5. **CRITICAL**: Ensure "Delete it" is NOT checked — the email must remain in the inbox for FOS Pub/Sub to detect it
6. Click "Create filter"
7. Optionally check "Also apply filter to matching conversations" for any existing emails

**Step 3: Set Cloud Functions Config**
```bash
firebase functions:config:set PAPERLESS_EMAIL=<accountant-paperless-email>
```

**Step 4: Verification**

Send a test email to each designated address and verify:
- [ ] Original email arrives in accountant's Paperless inbox (untouched — same subject, same attachments, same body)
- [ ] Email remains in the Gmail inbox (not deleted by filter)
- [ ] FOS Pub/Sub triggers `onEmailReceived` Cloud Function
- [ ] `email_log` document created in Firestore with `paperlessForwarded: true`
- [ ] Both forwarding and FOS processing happen independently — neither blocks the other

**Failure Mode Test**: Stop/disable the `onEmailReceived` Cloud Function, send a test email. Verify:
- [ ] Accountant still receives the forwarded email in Paperless
- [ ] Email remains in Gmail inbox for FOS to process when re-enabled

### Previous Story Intelligence (Story 4.1)

**Key patterns and learnings from Story 4.1:**

- **onEmailReceived structure**: Uses MVP approach (`listUnreadMessages` + `markAsRead`). Don't change this — Story 4.2 is purely additive (one new field).
- **Zero email loss pattern**: Both success and error paths create `email_log` documents. The `paperlessForwarded: true` field MUST be included in BOTH paths. This is the most critical code detail.
- **Idempotency**: `processMessage()` checks for existing `email_log` with same `messageId` before processing. No change needed.
- **`getAttachments(messageId, message)` signature**: Takes both messageId AND already-fetched message to avoid double API call. Do NOT modify.
- **Import paths**: All `.js` extensions. No new imports needed for this story.
- **Test patterns**: `vi.mock` for external dependencies. `MockFirestore` and `MockStorage` patterns established. 21 functions tests + 16 client schema tests currently.
- **Zod 4 `.default()` creates type divergence**: DO NOT use `z.boolean().default(true)`. Use `z.boolean()` and explicitly set `true` in document creation.
- **Test fixture pattern**: Email test fixtures create full EmailLog objects — all existing fixtures must be updated to include `paperlessForwarded` field.
- **`convertTimestamps` utility**: Client-side `useFirestoreCollection` hook converts Firestore Timestamps to JS Dates before Zod validation. The new boolean field needs no special conversion.

**From Story 4.1 Dev Agent Record:**
- OAuth2 mock: `vi.fn().mockImplementation()` arrow functions are not constructors — `class MockOAuth2` pattern used instead
- `getAttachments` makes its own `messages.get` call — requires double mock setup in tests
- 625 client-side tests + 21 functions tests = 646 tests total currently passing

### Git Intelligence

**Most recent commits:**
- `95177a4` — Implement Story 4.1: Gmail API Integration & Email Detection with code review fixes
- `7db541a` — Implement Story 3.3: Real-Time Dashboard Data Layer with code review fixes
- `519844a` — Implement Story 3.2: Project Health Table with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- `vi.mock` for external dependencies in tests
- Test structure: `describe` blocks by function/component, individual `it`/`test` cases for success/error paths
- Barrel exports with `index.ts` for every directory

**Files modified in Story 4.1 that this story ALSO modifies:**
- `src/types/email.ts` — adding `paperlessForwarded` field
- `functions/src/shared/schemas.ts` — adding `paperlessForwarded` field
- `functions/src/email/onEmailReceived.ts` — adding field to email_log document creation
- `functions/src/config.ts` — adding `paperlessEmail` parameter
- `src/types/email.test.ts` — updating schema tests
- `functions/tests/email.test.ts` — updating function tests

### Potential Pitfalls to Avoid

1. **DO NOT implement actual email forwarding in FOS code**. The Parallel Fork Pattern means Gmail handles all forwarding. FOS only TRACKS that it happened. If you write code that sends emails to Paperless, you're violating the architecture. There should be ZERO email-sending code in this story.

2. **DO NOT use `z.boolean().default(true)`** on the Zod schema. Zod 4 `.default()` creates input/output type divergence. Use `z.boolean()` and explicitly set `true` when creating email_log documents in `onEmailReceived`.

3. **DO NOT forget to add `paperlessForwarded: true` to the ERROR path** in `onEmailReceived`. Gmail forwarding happens independently of FOS processing — even if FOS fails, Paperless received the original. This is the entire point of the Parallel Fork Pattern.

4. **DO NOT modify `functions/src/email/gmailClient.ts`**. The Gmail API wrapper has zero changes for this story.

5. **DO NOT create new files**. All changes are modifications to existing files. There are no new components, hooks, functions, or test files.

6. **DO NOT modify any client-side UI components, hooks, stores, or pages**. This story has zero UI impact. The only client-side change is the schema type definition in `src/types/email.ts`.

7. **DO NOT modify `functions/src/shared/types.ts`**. The `EmailLog` type is auto-inferred from `z.infer<typeof emailLogSchema>` — it will automatically include `paperlessForwarded` after the schema is updated. The `ParsedEmailData` interface doesn't need the paperless field (it represents raw email data before Firestore storage).

8. **Test fixture updates**: When updating test files, ensure ALL existing mock email_log objects, test fixtures, and factory functions include the new `paperlessForwarded` field. Missing it from even one mock will cause test failures because Zod validation will reject documents without the required boolean field.

9. **Existing Firestore documents**: If there are existing `email_log` documents from Story 4.1 development/testing that lack the `paperlessForwarded` field, the client-side Zod schema will reject them. This is expected in development. In production, all documents will have the field because `onEmailReceived` sets it. For existing dev data, either clean up manually or handle in the `useFirestoreCollection` hook's data transformation layer.

10. **Gmail filter "Keep copy" is critical**: If Gmail filters are configured to forward AND delete, FOS won't see the emails via Pub/Sub. The "Keep Gmail's copy in Inbox" option MUST be enabled on all 4 filters.

### Cross-Story Context

This is **Story 4.2** — the second story in Epic 4 (Email Ingestion & AI Document Processing):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (DONE): Dashboard, KPI cards, project health table, real-time data layer
- **Epic 4** (IN PROGRESS):
  - Story 4.1 (REVIEW): Gmail API Integration & Email Detection — pipeline foundation
  - **Story 4.2 (this)**: Paperless Auto-Forward — infrastructure + audit tracking
  - Story 4.3 (BACKLOG): AI Document Processing with Gemini — `processDocument` Cloud Function
  - Story 4.4 (BACKLOG): Transaction Classification & Confidence Scoring
  - Story 4.5 (BACKLOG): Error Handling, Retry & Pipeline Resilience

**This story is intentionally lightweight on code.** The value is in:
1. Establishing the Gmail filter infrastructure for the Parallel Fork Pattern
2. Adding audit tracking (`paperlessForwarded`) to the existing pipeline
3. Documenting the complete setup and verification process

**Downstream dependencies on this story:**
- Story 4.3 triggers on `email_log` creation — the `paperlessForwarded` field will be present on all new documents
- Story 4.5 queries `email_log` by status — may include `paperlessForwarded` in retry/error reporting
- Story 5.x (Review Queue) may display forwarding status for audit purposes

### References

- [Source: planning-artifacts/epics.md#Story-4.2] — Full acceptance criteria with BDD scenarios
- [Source: planning-artifacts/epics.md#Epic-4] — Epic context for email ingestion pipeline
- [Source: planning-artifacts/architecture.md#External-Integration-Points] — Gmail API, Paperless zero integration
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — camelCase for document fields
- [Source: planning-artifacts/architecture.md#Firestore-Collections] — email_log collection schema
- [Source: planning-artifacts/prd.md#Accountant-Integration] — FR42, FR43, FR44
- [Source: planning-artifacts/prd.md#Integration-Architecture] — Parallel Fork Pattern description
- [Source: planning-artifacts/prd.md#Data-Boundary] — Financial data never leaves Firebase except Paperless forwarding
- [Source: planning-artifacts/ux-design-specification.md#Journey-5] — Accountant passive flow (zero UI)
- [Source: implementation-artifacts/4-1-gmail-api-integration-email-detection.md] — Previous story: code patterns, test infrastructure, dev learnings
- [Source: functions/src/email/onEmailReceived.ts] — Current email_log document creation (2 locations to modify)
- [Source: src/types/email.ts] — Current client emailLogSchema
- [Source: functions/src/shared/schemas.ts] — Current server emailLogSchema
- [Source: functions/src/config.ts] — Current config parameters (defineSecret/defineString)
- [Source: functions/tests/email.test.ts] — Current functions test file (21 tests)
- [Source: src/types/email.test.ts] — Current client schema tests (16 tests)

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

No debug issues encountered. All implementations were straightforward single-field additions.

### Completion Notes List

- **Task 1**: Added `paperlessForwarded: z.boolean()` to client `emailLogSchema` in `src/types/email.ts`. `EmailLog` type auto-infers the new field via `z.infer`.
- **Task 2**: Added `paperlessForwarded: z.boolean()` to server `emailLogSchema` in `functions/src/shared/schemas.ts`.
- **Task 3**: Added `paperlessForwarded: true` to BOTH email_log document creation points in `onEmailReceived.ts` — success path (line ~130, FR42) and error path (line ~155, FR43). Gmail filter forwards independently of FOS processing.
- **Task 4**: Added `paperlessEmail` defineString parameter in `functions/src/config.ts` with empty default. For documentation/reference only — Gmail filters handle actual forwarding.
- **Task 5**: Added 4 new client-side tests (boolean true/false, non-boolean rejection, missing field rejection) and 3 new functions tests (schema validation, FR42 success-path, FR43 error-path). Updated all existing test fixtures to include `paperlessForwarded` field.
- **Task 6**: Verified: `tsc --noEmit` 0 errors, 629 client tests passed (was 625), 25 functions tests passed (was 22). Zero regressions.
- **Design decision**: `paperlessForwarded` set to `true` unconditionally (including error path) because Gmail filter forwarding is completely independent of FOS — the Parallel Fork Pattern (FR42/FR43).

### Change Log

- 2026-02-07: Implemented Story 4.2 — Paperless Auto-Forward. Added `paperlessForwarded` boolean field to client/server schemas, onEmailReceived success+error paths, Paperless config parameter, and comprehensive tests. 629 client + 25 functions = 654 total tests passing.
- 2026-02-07: Code review completed. Fixed: (M1) corrected functions test baseline count in completion notes (was 22, not 21; 3 new tests, not 4), (L1) updated FR comments on schema fields to reference FR42/FR43/FR44, (L2) added Story 4.2 reference to config comment. No HIGH issues found. All ACs verified against implementation.

### File List

- `src/types/email.ts` — Added `paperlessForwarded: z.boolean()` to emailLogSchema
- `functions/src/shared/schemas.ts` — Added `paperlessForwarded: z.boolean()` to server emailLogSchema
- `functions/src/email/onEmailReceived.ts` — Added `paperlessForwarded: true` to both success and error email_log creation paths
- `functions/src/config.ts` — Added `paperlessEmail` defineString parameter
- `src/types/email.test.ts` — Added 4 tests for paperlessForwarded validation, updated fixtures
- `functions/tests/email.test.ts` — Added 4 tests for paperlessForwarded (schema + FR42/FR43), updated all fixtures
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status: ready-for-dev → in-progress → review
