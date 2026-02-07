# Story 4.1: Gmail API Integration & Email Detection

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want to detect new emails in designated mailboxes and download their contents,
So that financial documents are captured automatically without manual forwarding.

## Acceptance Criteria

1. **Pub/Sub Topic & Gmail Watch Configuration**: A Pub/Sub topic (`tp-fos-email-ingestion`) receives push notifications when new emails arrive in the connected Gmail account. OAuth 2.0 credentials stored in Cloud Functions environment config (never client-side).

2. **Email Detection & Download**: When a new email arrives at `orders@tailorplayed.com`, `supplies@`, `developing@`, or `expenses@` and the Pub/Sub notification triggers `onEmailReceived` Cloud Function, the function identifies which designated mailbox received the email, downloads email metadata (from, subject, date, body), and downloads all attachments (PDF, JPG, PNG) and HTML body content.

3. **Firebase Storage Upload**: Each attachment is stored in Firebase Storage under `documents/{emailId}/{filename}`. Storage paths are recorded for later AI processing.

4. **Firestore email_log Document**: A document is created in Firestore `email_log` collection with: `messageId` (Gmail message ID), `mailbox` (which designated address), `receivedAt` (timestamp), `status: 'received'`, `attachmentUrls` (array of Storage paths), `subject`, `from`. The email_log document ID triggers downstream processing.

5. **EmailLog Type & Zod Schema**: `emailLogSchema` validates: `id`, `messageId`, `mailbox` (enum), `receivedAt`, `status` (enum: received | processing | processed | unprocessed | failed), `attachmentUrls`, `transactionId` (optional, set after AI processing), `errorMessage` (optional). Defined in both `src/types/email.ts` and `functions/src/shared/schemas.ts`.

6. **Zero Email Loss**: Every email entering the system is tracked in `email_log` regardless of processing outcome — zero emails silently dropped. The `status` field always reflects current processing state.

7. **Gmail API Wrapper**: `functions/src/email/gmailClient.ts` exports: `getEmailById(messageId)`, `getAttachments(messageId)`, `markAsRead(messageId)`. All calls use service account or OAuth credentials from Cloud Functions config. Errors are caught and logged, never silently swallowed.

## Tasks / Subtasks

- [x] Task 1: Define EmailLog type + Zod schema in `src/types/email.ts` (AC: #5)
  - [x] Replace empty placeholder with full schema
  - [x] Define `EMAIL_STATUSES` and `DESIGNATED_MAILBOXES` const arrays
  - [x] Export `EmailLog` type via `z.infer`
  - [x] Verify barrel export in `src/types/index.ts` (already exports `./email`)

- [x] Task 2: Copy EmailLog schema to `functions/src/shared/schemas.ts` (AC: #5)
  - [x] Add Zod dependency to `functions/package.json`
  - [x] Define emailLogSchema in functions shared schemas (manual copy, not symlink)
  - [x] Define shared EmailLog type in `functions/src/shared/types.ts`

- [x] Task 3: Set up `functions/src/config.ts` — environment config access (AC: #1)
  - [x] Define config accessor for Gmail OAuth credentials
  - [x] Define config accessor for Google Cloud project ID
  - [x] Define config accessor for Pub/Sub topic name
  - [x] Use `defineString` / `defineSecret` from `firebase-functions/params` for secrets

- [x] Task 4: Implement `functions/src/email/gmailClient.ts` — Gmail API wrapper (AC: #7)
  - [x] Install `googleapis` npm package in `functions/`
  - [x] Create Gmail API client initialization with OAuth credentials from config
  - [x] Implement `getEmailById(messageId)` — fetch full email message
  - [x] Implement `getAttachments(messageId)` — download all attachments
  - [x] Implement `markAsRead(messageId)` — mark email as read after processing
  - [x] All errors caught, logged, re-thrown with context

- [x] Task 5: Implement `functions/src/email/onEmailReceived.ts` — Pub/Sub trigger (AC: #2, #3, #4, #6)
  - [x] Use `onMessagePublished` from `firebase-functions/pubsub` for topic `tp-fos-email-ingestion`
  - [x] Decode Pub/Sub message to extract Gmail notification (historyId, emailAddress)
  - [x] Call Gmail API to list new messages since last historyId
  - [x] For each new message: download metadata + attachments via gmailClient
  - [x] Upload attachments to Firebase Storage `documents/{emailId}/{filename}`
  - [x] Create `email_log` document in Firestore with all required fields
  - [x] Handle errors: create email_log with error status, never drop emails

- [x] Task 6: Update `functions/src/index.ts` — export Cloud Function (AC: all)
  - [x] Import and re-export `onEmailReceived`
  - [x] Initialize Firebase Admin SDK

- [x] Task 7: Tests (AC: all)
  - [x] Create `functions/tests/email.test.ts` — test onEmailReceived function
  - [x] Test gmailClient wrapper functions (mocked googleapis)
  - [x] Test email_log document creation with correct schema
  - [x] Test error handling paths (Gmail API failure, Storage upload failure)
  - [x] Create `src/types/email.test.ts` — client-side schema validation tests

- [x] Task 8: Build Verification (AC: all)
  - [x] `cd functions && npx tsc --noEmit` — zero TypeScript errors in functions
  - [x] `npm run test` — all client-side tests pass, zero regressions
  - [x] Verify Cloud Functions build: `cd functions && npm run build`

## Dev Notes

### Architecture Compliance

- **Cloud Functions 2nd Gen**: This project uses `firebase-functions@^6.3.2` which is the 2nd gen API. Use `onMessagePublished` from `firebase-functions/pubsub`, NOT the deprecated 1st gen `functions.pubsub.topic().onPublish()`. [Source: architecture.md#Cloud-Functions-Inventory]
- **Firestore triggers for downstream**: `processDocument` (Story 4.3) will use `onDocumentCreated` from `firebase-functions/firestore` to trigger when `email_log` documents are created. This story just creates the email_log document — downstream processing is NOT part of this story. [Source: architecture.md#Cloud-Functions-Inventory]
- **Firebase Admin SDK**: Initialize with `initializeApp()` from `firebase-admin/app`. Use `getFirestore()` from `firebase-admin/firestore` and `getStorage()` from `firebase-admin/storage` for server-side operations. [Source: architecture.md#Cloud-Functions-Boundary]
- **Separate npm package**: `functions/` has its own `package.json` and `tsconfig.json`. No shared runtime with client. Zod schemas are shared via manual copy. [Source: architecture.md#Cloud-Functions-Boundary]
- **Path aliases**: The functions package does NOT use `@/` path aliases. Use relative imports (`../shared/schemas.js`). Note the `.js` extension required for NodeNext module resolution in tsconfig. [Source: functions/tsconfig.json]
- **Naming conventions**: Cloud Functions use camelCase, verb-first: `onEmailReceived`, `processDocument`. Firestore collections use `snake_case`: `email_log`. Document fields use `camelCase`: `messageId`, `receivedAt`, `attachmentUrls`. [Source: architecture.md#Naming-Patterns]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. On the client side, `email_log` data will eventually be consumed via `useFirestoreCollection` hook pattern. [Source: architecture.md#Data-Flow-Patterns]
- **Integer currency**: All monetary amounts in agora/cents (integer). The `email_log` itself does not store amounts — amounts are on the `transactions` document created by Story 4.3. [Source: architecture.md#Data-Integrity]
- **Co-located tests**: Functions tests go in `functions/tests/` directory. Client-side type tests go next to the source file: `src/types/email.test.ts`. [Source: architecture.md#Testing-Standards]
- **Security**: Gmail OAuth credentials and API keys are stored in Cloud Functions environment config via `firebase functions:config:set` or `defineSecret`. NEVER in client-side code. NEVER committed to git. [Source: architecture.md#Authentication-Security]
- **CI/CD**: Cloud Functions deploy via `firebase deploy --only functions` triggered by GitHub Action on changes to `/functions` directory. [Source: architecture.md#CI-CD]

### Critical Technical Constraints

- **Packages already installed in `functions/`:**
  - `firebase-admin@^13.4.0` — Firestore, Storage, Auth admin SDK
  - `firebase-functions@^6.3.2` — 2nd gen Cloud Functions API
  - `typescript@~5.9.3` — TypeScript compiler

- **NEW npm dependencies needed in `functions/`:**
  - `googleapis` (latest) — Gmail API client. Use `@googleapis/gmail` scoped package OR the full `googleapis` package. The scoped `@googleapis/gmail@^16.1.1` is smaller and preferred.
  - `zod` (latest, matching client version) — Schema validation. Client uses `zod@^4.3.6`. Install matching version in functions.

- **NO new npm dependencies needed in client `package.json`** — this story only adds server-side functionality. Client changes are limited to the EmailLog type definition.

- **Existing `functions/` files to MODIFY:**
  - `functions/src/index.ts` — replace empty export with function exports + Admin SDK init
  - `functions/src/config.ts` — replace empty export with environment config accessors
  - `functions/src/shared/schemas.ts` — add emailLogSchema
  - `functions/src/shared/types.ts` — add EmailLog type and related types
  - `functions/package.json` — add `googleapis` and `zod` dependencies

- **Existing client files to MODIFY:**
  - `src/types/email.ts` — replace empty placeholder with EmailLog schema

- **Files to CREATE:**
  - `functions/src/email/onEmailReceived.ts` — Pub/Sub trigger Cloud Function
  - `functions/src/email/gmailClient.ts` — Gmail API wrapper
  - `functions/tests/email.test.ts` — Cloud Functions tests
  - `src/types/email.test.ts` — client-side schema tests

- **Files NOT to modify:**
  - `src/services/firebase.ts` — client-side Firebase init, complete
  - `src/services/storage.ts` — client-side storage re-export, complete
  - `src/types/transaction.ts` — already has `originalFileUrl`, `source: 'ai'`, `aiConfidence` fields needed for downstream stories
  - `src/types/index.ts` — already exports `./email`
  - Any client-side components, hooks, stores, pages — this is a server-side story
  - `functions/tsconfig.json` — current config is correct for NodeNext module resolution

### EmailLog Type & Schema Design

```typescript
// src/types/email.ts (client-side)
import { z } from 'zod';

export const DESIGNATED_MAILBOXES = [
  'orders',
  'supplies',
  'developing',
  'expenses',
] as const;
export type DesignatedMailbox = (typeof DESIGNATED_MAILBOXES)[number];

export const EMAIL_STATUSES = [
  'received',
  'processing',
  'processed',
  'unprocessed',
  'failed',
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

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
});

export type EmailLog = z.infer<typeof emailLogSchema>;
```

**CRITICAL**: The `functions/src/shared/schemas.ts` version must define the SAME schema but using `z.date()` replaced with `z.any()` or Firestore Timestamp handling, since Cloud Functions receive Firestore Timestamps, not JS Dates. Alternatively, the functions version can use `z.coerce.date()` or accept Timestamp objects. Be consistent with how the client `useFirestoreCollection` hook converts Timestamps (via `convertTimestamps` utility).

### Cloud Functions Config Design

```typescript
// functions/src/config.ts
import { defineSecret, defineString } from 'firebase-functions/params';

// Gmail OAuth credentials — stored as Firebase secrets
export const gmailClientId = defineSecret('GMAIL_CLIENT_ID');
export const gmailClientSecret = defineSecret('GMAIL_CLIENT_SECRET');
export const gmailRefreshToken = defineSecret('GMAIL_REFRESH_TOKEN');

// Google Cloud project config
export const gcpProjectId = defineString('GCP_PROJECT_ID');
export const pubsubTopic = defineString('PUBSUB_TOPIC', {
  default: 'tp-fos-email-ingestion',
});

// Email config
export const gmailUserEmail = defineString('GMAIL_USER_EMAIL', {
  default: 'orders@tailorplayed.com',
});
```

**IMPORTANT**: Use `defineSecret` (not `defineString`) for OAuth credentials. Secrets are encrypted at rest and only available to functions that declare them. The `onEmailReceived` function must declare `runWith({ secrets: [...] })` or pass secrets in the options parameter.

### Gmail API Client Design

```typescript
// functions/src/email/gmailClient.ts
import { gmail_v1, google } from 'googleapis';
import { gmailClientId, gmailClientSecret, gmailRefreshToken } from '../config.js';

function getGmailClient(): gmail_v1.Gmail {
  const oauth2Client = new google.auth.OAuth2(
    gmailClientId.value(),
    gmailClientSecret.value(),
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: gmailRefreshToken.value(),
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function getEmailById(messageId: string): Promise<gmail_v1.Schema$Message> {
  const gmail = getGmailClient();
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return response.data;
}

export async function getAttachments(
  messageId: string
): Promise<Array<{ filename: string; data: Buffer; mimeType: string }>> {
  const gmail = getGmailClient();
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const attachments: Array<{ filename: string; data: Buffer; mimeType: string }> = [];
  const parts = message.data.payload?.parts ?? [];

  for (const part of parts) {
    if (part.filename && part.body?.attachmentId) {
      const attachment = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: part.body.attachmentId,
      });
      if (attachment.data.data) {
        attachments.push({
          filename: part.filename,
          data: Buffer.from(attachment.data.data, 'base64'),
          mimeType: part.mimeType ?? 'application/octet-stream',
        });
      }
    }
  }
  return attachments;
}

export async function markAsRead(messageId: string): Promise<void> {
  const gmail = getGmailClient();
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}
```

**CRITICAL NOTES:**
- Import paths in functions must use `.js` extension for NodeNext module resolution: `../config.js`, `../shared/schemas.js`
- The `getGmailClient` function creates a new OAuth2 client each time. This is intentional — Cloud Functions may be cold-started and secrets are only available at execution time.
- `userId: 'me'` refers to the authenticated user (the service account or OAuth user).
- Attachments are base64url-encoded by Gmail API. `Buffer.from(data, 'base64')` handles the decoding.

### onEmailReceived Cloud Function Design

```typescript
// functions/src/email/onEmailReceived.ts
import { onMessagePublished } from 'firebase-functions/pubsub';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';
import { getEmailById, getAttachments, markAsRead } from './gmailClient.js';
import { gmailClientId, gmailClientSecret, gmailRefreshToken } from '../config.js';

interface GmailPubSubNotification {
  emailAddress: string;
  historyId: number;
}

export const onEmailReceived = onMessagePublished(
  {
    topic: 'tp-fos-email-ingestion',
    secrets: [gmailClientId, gmailClientSecret, gmailRefreshToken],
  },
  async (event) => {
    const db = getFirestore();
    const storage = getStorage();

    try {
      // 1. Decode Pub/Sub message
      const notification: GmailPubSubNotification = event.data.message.json;
      logger.info('Gmail notification received', {
        emailAddress: notification.emailAddress,
        historyId: notification.historyId,
      });

      // 2. Use Gmail API history.list to get new message IDs
      // (Implementation note: Gmail push sends historyId, use it to
      //  list messages added since last known historyId)
      // For MVP: Use messages.list with q:"is:unread" as simpler approach

      // 3. For each new message:
      //    a. Download full message via getEmailById
      //    b. Determine which designated mailbox (from To: header)
      //    c. Download attachments via getAttachments
      //    d. Upload to Firebase Storage: documents/{emailId}/{filename}
      //    e. Create email_log document in Firestore
      //    f. Mark email as read

      // See full implementation details in acceptance criteria

    } catch (error) {
      logger.error('onEmailReceived failed', { error });
      // Even on error, try to create an email_log entry to prevent silent loss
      throw error; // Cloud Functions will retry on uncaught errors
    }
  }
);
```

**CRITICAL IMPLEMENTATION NOTES:**

1. **Pub/Sub message format**: Gmail sends a JSON payload with `emailAddress` and `historyId`. The `historyId` is used with `users.history.list` to find which messages were added. For the initial implementation, a simpler approach is `users.messages.list` with `q: 'is:unread'` to find unread messages, then process and mark as read.

2. **Mailbox detection**: The `To:` header of the email determines which designated mailbox received it. Parse headers from the Gmail message payload: `message.payload.headers.find(h => h.name === 'To')`.

3. **Firebase Storage upload**: Use `firebase-admin/storage` to upload:
   ```typescript
   const bucket = storage.bucket();
   const file = bucket.file(`documents/${emailId}/${filename}`);
   await file.save(buffer, { contentType: mimeType });
   const [url] = await file.getSignedUrl({ action: 'read', expires: '2030-01-01' });
   ```
   Note: For the URL stored in `attachmentUrls`, use the Firebase Storage path (not signed URL) since signed URLs expire. Use the format: `documents/{emailId}/{filename}`. The client retrieves via `getDownloadURL()` from the client SDK.

4. **Idempotency**: Gmail Pub/Sub may deliver duplicate notifications. Check if `email_log` document with the same `messageId` already exists before processing. If it does, skip (idempotent).

5. **email_log document creation**:
   ```typescript
   await db.collection('email_log').add({
     messageId: gmailMessageId,
     mailbox: detectedMailbox,
     receivedAt: FieldValue.serverTimestamp(),
     status: 'received',
     attachmentUrls: uploadedPaths,
     subject: emailSubject,
     from: emailFrom,
     transactionId: null,
     errorMessage: null,
   });
   ```

6. **Error handling pattern**: If Gmail API fails, still create an email_log entry with `status: 'received'` and `errorMessage` describing the failure. The retry function (Story 4.5) will pick it up. NEVER let an email be silently dropped.

### Functions Index Entry Point

```typescript
// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (must be first)
initializeApp();

// Export Cloud Functions
export { onEmailReceived } from './email/onEmailReceived.js';
```

**CRITICAL**: `initializeApp()` must be called BEFORE any function imports that use Firestore/Storage. The simplest pattern is to call it at the top of `index.ts` before the exports.

### Functions Shared Schemas (Copy from Client)

```typescript
// functions/src/shared/schemas.ts
import { z } from 'zod';

export const DESIGNATED_MAILBOXES = [
  'orders',
  'supplies',
  'developing',
  'expenses',
] as const;

export const EMAIL_STATUSES = [
  'received',
  'processing',
  'processed',
  'unprocessed',
  'failed',
] as const;

// Server-side schema: uses z.any() for Firestore Timestamps
// (Firestore Admin SDK returns Timestamp objects, not JS Dates)
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
});

export type EmailLog = z.infer<typeof emailLogSchema>;
```

### Pub/Sub & Gmail Watch Setup (Infrastructure — NOT Code)

The following infrastructure must be configured in Google Cloud Console (not via code in this story):

1. **Google Cloud Project**: Ensure `tp-fos` project has Gmail API enabled
2. **Pub/Sub Topic**: Create topic `tp-fos-email-ingestion`
3. **Grant publish rights**: Add `gmail-api-push@system.gserviceaccount.com` as Publisher on the topic
4. **Gmail Watch**: Call `users.watch()` to register push notifications:
   ```
   POST https://www.googleapis.com/gmail/v1/users/me/watch
   {
     "topicName": "projects/tp-fos/topics/tp-fos-email-ingestion",
     "labelIds": ["INBOX"]
   }
   ```
   **NOTE**: `users.watch` must be renewed every 7 days. A scheduled Cloud Function or cron job should call this. This renewal mechanism is deferred to Story 4.5 (Error Handling & Pipeline Resilience).

5. **OAuth Consent Screen**: Configure for internal use (single domain)
6. **OAuth Credentials**: Create OAuth 2.0 client ID, generate refresh token via OAuth Playground
7. **Set secrets**: `firebase functions:secrets:set GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`

**This infrastructure setup should be documented in the story but is NOT automatable via code. Dev should document the setup steps they follow.**

### Project Structure Notes

**Files to CREATE:**

| File | Purpose |
|---|---|
| `functions/src/email/onEmailReceived.ts` | Pub/Sub trigger: Gmail push notification handler |
| `functions/src/email/gmailClient.ts` | Gmail API wrapper (getEmailById, getAttachments, markAsRead) |
| `functions/tests/email.test.ts` | Cloud Functions unit tests |
| `src/types/email.test.ts` | Client-side EmailLog schema tests |

**Files to MODIFY:**

| File | Change |
|---|---|
| `src/types/email.ts` | Replace empty placeholder with EmailLog schema |
| `functions/src/index.ts` | Add Admin SDK init + export onEmailReceived |
| `functions/src/config.ts` | Add Gmail OAuth + GCP config params |
| `functions/src/shared/schemas.ts` | Add emailLogSchema (server-side version) |
| `functions/src/shared/types.ts` | Add EmailLog + related types |
| `functions/package.json` | Add `googleapis` and `zod` dependencies |

**Files NOT to modify:**

- `functions/tsconfig.json` — NodeNext config is correct
- `src/types/index.ts` — already exports `./email`
- `src/types/transaction.ts` — already has AI-related fields
- `src/services/firebase.ts` — client Firebase init complete
- `src/services/storage.ts` — client storage re-export complete
- Any client-side components, hooks, stores, or pages
- `src/lib/currency.ts` — no changes needed

### Previous Story Intelligence (Story 3.3)

**Key patterns and learnings from Stories 1.1–3.3:**

- **Zod 4 `.default()` creates input/output type divergence** — DO NOT use `.default()` on schemas for type inference. Define all fields explicitly.
- **603 tests currently passing across ~46 test files** — zero regressions required.
- **SCSS**: `$bp-sm` (640px), `$bp-md` (768px), `$bp-lg` (1024px) — NOT `$breakpoint-sm`. Not relevant to this story but noted for consistency.
- **Phosphor icon dynamic imports in jsdom cause slow module loading** — use `vi.mock` for all icons in tests.
- **React 19 + Zustand v5 `useSyncExternalStore` infinite loop** — derive filtered data via `useMemo` from raw arrays. Not directly relevant to this server-side story.
- **`serverTimestamps: 'estimate'` in `doc.data()` calls** — prevents null timestamps during writes. The client-side `useFirestoreCollection` hook uses this pattern.
- **`convertTimestamps` utility** — exists in `useFirestoreCollection.ts`, converts Firestore Timestamps to JS Dates. The EmailLog schema on the client side expects `z.date()` — the `convertTimestamps` utility handles the conversion before Zod validation.

**From Story 3.3 specifically:**
- `useSystemConfigStore` pattern: `config: T | null`, `loading`, `error`, setters
- `useFirestoreDoc` hook created for single document listeners
- All existing stores use the SAFER pattern (single useStore() call, derive via useMemo)
- `sass-embedded` dispatcher race condition on `npm run build` is pre-existing — not a regression

### Git Intelligence

**Recent commits (most recent first):**
- `7db541a` — Implement Story 3.3: Real-Time Dashboard Data Layer with code review fixes
- `519844a` — Implement Story 3.2: Project Health Table with code review fixes
- `dee3ef6` — Implement Story 3.1: Hero Stat & KPI Cards with code review fixes
- `bf63da3` — Fix Firestore documents dropped due to null server timestamps
- `2bd0e12` — Implement Story 2.5: Work Order Detail Page with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- `vi.mock` pattern for external dependencies in tests
- `useMemo` for all derived data in hooks
- `callbacksRef` pattern to avoid listener resubscription
- Barrel exports with `index.ts` for every directory

### Latest Technical Information

**firebase-functions v6.3.2 (2nd gen Cloud Functions):**
- `onMessagePublished(topicOrOptions, handler)` — Pub/Sub trigger for 2nd gen
- `onDocumentCreated(pathOrOptions, handler)` — Firestore onCreate for 2nd gen
- Secrets: use `defineSecret('SECRET_NAME')` from `firebase-functions/params`, pass in function options `{ secrets: [secretRef] }`
- Logger: use `import * as logger from 'firebase-functions/logger'` (NOT `console.log`)

**firebase-admin v13.4.0:**
- `initializeApp()` from `firebase-admin/app` — no args needed when running in Cloud Functions environment
- `getFirestore()` from `firebase-admin/firestore` — returns Firestore instance
- `getStorage()` from `firebase-admin/storage` — returns Storage instance
- `FieldValue.serverTimestamp()` from `firebase-admin/firestore` — server-generated timestamp

**googleapis / @googleapis/gmail v16.1.1:**
- `google.auth.OAuth2(clientId, clientSecret, redirectUri)` — create OAuth2 client
- `oauth2Client.setCredentials({ refresh_token })` — set refresh token
- `google.gmail({ version: 'v1', auth: oauth2Client })` — create Gmail client
- `gmail.users.messages.get({ userId: 'me', id, format: 'full' })` — fetch email
- `gmail.users.messages.attachments.get({ userId: 'me', messageId, id })` — fetch attachment
- `gmail.users.messages.modify({ userId: 'me', id, requestBody: { removeLabelIds: ['UNREAD'] } })` — mark as read
- Gmail Pub/Sub notification payload: `{ emailAddress: string, historyId: number }`
- `gmail.users.history.list({ userId: 'me', startHistoryId, historyTypes: ['messageAdded'] })` — list changes since historyId

**NodeNext Module Resolution (functions/tsconfig.json):**
- All relative imports MUST include `.js` extension: `import { foo } from './bar.js'`
- This is required even for `.ts` source files — TypeScript resolves `.js` to `.ts` at compile time
- Applies to: `../config.js`, `../shared/schemas.js`, `./gmailClient.js`

### Potential Pitfalls to Avoid

1. **DO NOT forget `.js` extensions** in function imports. The `tsconfig.json` uses `"module": "NodeNext"` which requires explicit extensions. Without them, runtime will fail with `ERR_MODULE_NOT_FOUND`.

2. **DO NOT use `console.log`** in Cloud Functions. Use `firebase-functions/logger` for structured logging that integrates with Cloud Logging.

3. **DO NOT store signed URLs** in `attachmentUrls`. Signed URLs expire. Store the Firebase Storage path (e.g., `documents/{emailId}/invoice.pdf`) and generate download URLs on-demand from the client using `getDownloadURL()`.

4. **DO NOT call `initializeApp()` inside function handlers**. Call it once at the top of `index.ts` before any exports. Calling it multiple times throws an error.

5. **DO NOT modify client-side components or stores**. This is a purely server-side story. Client-side changes are limited to the `src/types/email.ts` type definition.

6. **DO NOT use 1st gen Cloud Functions API**. The project uses firebase-functions v6 which is 2nd gen. Use `onMessagePublished` not `functions.pubsub.topic().onPublish()`.

7. **Handle duplicate Pub/Sub deliveries**. Gmail Pub/Sub provides at-least-once delivery. Check if `email_log` with the same `messageId` already exists before processing. Skip if already exists (idempotent).

8. **Gmail Watch expires every 7 days**. The initial `users.watch()` call must be renewed. For this story, document that a scheduled renewal function is needed (Story 4.5 handles this). Do NOT implement the renewal in this story.

9. **Gmail history.list approach vs messages.list**: Gmail push notifications only tell you SOMETHING changed (via `historyId`). You must call `history.list` with `startHistoryId` to discover WHAT changed. For a simpler MVP approach, `messages.list` with `q: 'is:unread'` + `markAsRead` achieves the same result without tracking historyId state. Choose one approach and document the trade-off.

10. **Zod version alignment**: The client uses `zod@^4.3.6`. Install the same major version in `functions/package.json`. Do NOT mix Zod 3 and Zod 4 — the APIs differ.

11. **Firebase Storage bucket**: `getStorage().bucket()` returns the default bucket. Ensure the Firebase project has Storage enabled. The bucket name will be `tp-fos.appspot.com` or `tp-fos.firebasestorage.app` depending on project creation date.

12. **Test infrastructure for functions**: The `functions/` directory does NOT have Vitest or any test runner configured yet. For this story, you may need to add a test runner to `functions/package.json`. Use `vitest` for consistency with the client-side test setup, or use `jest` (more common for Node.js Cloud Functions). Document the choice.

13. **OAuth Playground redirect URI**: When creating the OAuth2 client, use `'https://developers.google.com/oauthplayground'` as the redirect URI if the refresh token was generated via OAuth Playground. This is standard for server-to-server Gmail API usage.

14. **Gmail API scopes**: The OAuth token needs `gmail.readonly` scope at minimum. If marking as read, also needs `gmail.modify`. Scope: `https://www.googleapis.com/auth/gmail.modify`.

### Cross-Story Context

This is **Story 4.1 — the first story in Epic 4** (Email Ingestion & AI Document Processing):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (DONE): Dashboard, KPI cards, project health table, real-time data layer
- **Epic 4** (STARTING):
  - **Story 4.1 (this)**: Gmail API Integration & Email Detection — Pub/Sub trigger, email download, Storage upload, email_log creation
  - Story 4.2: Paperless Auto-Forward — Gmail filter configuration (mostly infrastructure, minimal code)
  - Story 4.3: AI Document Processing with Gemini — processDocument Cloud Function, Gemini API integration
  - Story 4.4: Transaction Classification & Confidence Scoring — extended Gemini prompt, category/confidence fields
  - Story 4.5: Error Handling, Retry & Pipeline Resilience — retryFailedProcessing scheduled function, error recovery

**This story creates the foundation for the entire email-to-transaction pipeline.** Stories 4.3–4.5 build directly on the email_log documents and attachment storage paths created here. The `email_log.status` field drives the entire pipeline state machine.

**Downstream dependencies on this story:**
- Story 4.3 triggers on `email_log` creation via `onDocumentCreated` — needs the document structure defined here
- Story 4.5 queries `email_log` by `status: 'unprocessed' | 'failed'` — needs the status field defined here
- Story 5.x (Review Queue) reads `transactions` created by Story 4.3 — indirect dependency via the pipeline this story initiates

### References

- [Source: planning-artifacts/epics.md#Story-4.1] — Full acceptance criteria with BDD scenarios
- [Source: planning-artifacts/epics.md#Epic-4] — Epic context and all 5 stories in the pipeline
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Inventory] — onEmailReceived function spec
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Boundary] — Separate npm package, shared schemas
- [Source: planning-artifacts/architecture.md#Firestore-Collections] — email_log collection schema
- [Source: planning-artifacts/architecture.md#Authentication-Security] — OAuth, API key protection
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — camelCase functions, snake_case collections
- [Source: planning-artifacts/architecture.md#Data-Flow-Patterns] — Firestore → Zod → Zustand → React
- [Source: planning-artifacts/architecture.md#Error-Handling] — Cloud Functions error patterns
- [Source: planning-artifacts/architecture.md#CI-CD] — Functions deploy via GitHub Actions
- [Source: planning-artifacts/architecture.md#Environment-Config] — Vite .env (client) + Functions config (server)
- [Source: planning-artifacts/architecture.md#External-Integration-Points] — Gmail API, Firebase Storage
- [Source: implementation-artifacts/3-3-real-time-dashboard-data-layer.md] — Previous story learnings, test patterns
- [Source: functions/package.json] — firebase-admin ^13.4.0, firebase-functions ^6.3.2
- [Source: functions/tsconfig.json] — NodeNext module resolution (requires .js extensions)
- [Source: src/types/transaction.ts] — Transaction schema with AI fields
- [Source: src/lib/currency.ts] — Currency type definition
- [Source: https://firebase.google.com/docs/functions/pubsub-events] — Pub/Sub triggers 2nd gen
- [Source: https://developers.google.com/workspace/gmail/api/guides/push] — Gmail push notifications
- [Source: https://firebase.google.com/docs/firestore/extend-with-functions-2nd-gen] — Firestore triggers 2nd gen

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor IDE)

### Debug Log References

- Fixed OAuth2 mock in tests: `vi.fn().mockImplementation()` arrow functions are not constructors — used `class MockOAuth2` instead.
- `getAttachments` makes its own `messages.get` call, requiring double mock setup in tests.

### Completion Notes List

- **Task 1**: Defined `emailLogSchema` with Zod 4 in `src/types/email.ts` — `DESIGNATED_MAILBOXES`, `EMAIL_STATUSES` const arrays, `EmailLog` type via `z.infer`. 16 passing tests.
- **Task 2**: Server-side schema in `functions/src/shared/schemas.ts` uses `z.any()` for `receivedAt` (Firestore Timestamps). Shared types in `types.ts` with `GmailPubSubNotification` and `ParsedEmailData` interfaces. Zod `^4.3.6` installed in functions.
- **Task 3**: Config uses `defineSecret` for OAuth credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) and `defineString` for GCP_PROJECT_ID, PUBSUB_TOPIC, GMAIL_USER_EMAIL.
- **Task 4**: Gmail API wrapper with `getEmailById`, `getAttachments`, `markAsRead`, `listUnreadMessages`. All errors caught, logged with context, re-thrown. `googleapis` installed.
- **Task 5**: `onEmailReceived` Pub/Sub trigger with MVP approach (list unread messages instead of history.list). Idempotency check via `email_log` messageId query. Zero email loss: error path still creates email_log entry. Attachment upload to `documents/{emailId}/{filename}` in Firebase Storage.
- **Task 6**: `initializeApp()` called at top of `functions/src/index.ts` before exports.
- **Task 7**: 21 functions tests + 16 client-side tests = 37 new tests. All 625 client-side tests pass. All 21 functions tests pass.
- **Task 8**: Zero TypeScript errors. Functions build succeeds.
- **Design decision**: Used MVP approach (`messages.list` with `q:'is:unread'` + `markAsRead`) instead of tracking `historyId` across invocations. Simpler, avoids state management. Trade-off documented in code comments.

### Change Log

- 2026-02-07: Story 4.1 implementation complete — Gmail API integration, email detection, Pub/Sub trigger, Firebase Storage upload, Firestore email_log creation. 37 new tests, zero regressions.

### File List

**New files:**
- `functions/src/email/gmailClient.ts` — Gmail API wrapper (getEmailById, getAttachments, markAsRead, listUnreadMessages)
- `functions/src/email/onEmailReceived.ts` — Pub/Sub trigger Cloud Function
- `functions/tests/email.test.ts` — 21 Cloud Functions tests
- `functions/vitest.config.ts` — Vitest config for functions tests
- `src/types/email.test.ts` — 16 client-side EmailLog schema tests

**Modified files:**
- `src/types/email.ts` — EmailLog schema, DESIGNATED_MAILBOXES, EMAIL_STATUSES
- `functions/src/index.ts` — Firebase Admin init + onEmailReceived export
- `functions/src/config.ts` — Gmail OAuth secrets + GCP config params
- `functions/src/shared/schemas.ts` — Server-side emailLogSchema
- `functions/src/shared/types.ts` — EmailLog, DesignatedMailbox, EmailStatus, GmailPubSubNotification, ParsedEmailData
- `functions/package.json` — Added googleapis, zod, vitest; test scripts
- `functions/package-lock.json` — Updated lock file
