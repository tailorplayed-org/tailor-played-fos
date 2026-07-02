# FOS v2 — Current State (verified 2026-07-02)

> What the FOS ecosystem actually is today, established by reading all four repos in full, querying
> live Firestore through fos-mcp (read-only), and reading the historical handoff docs. Every
> load-bearing claim carries an anchor. If code has changed since 2026-07-02, re-verify the anchor
> before relying on it.

## 0. Executive summary

The FOS app is further along than commonly assumed (KPIs, per-order P&L, Osek-Patur alert, forward
projection all exist) — but the intake layer is broken: **three separate email pipelines exist, two
of them touched the same mailbox in the same week, and the deployed legacy one wrote 14 duplicate
copies of a single receipt into production on 2026-05-18 — which is also the last day anything was
written to FOS at all.** The data layer is nearly empty (2 work orders, zero revenue rows ever),
which makes right now the cheapest possible moment for the vocabulary migration and data cleanup.

## 1. Component map

| Component | Where | State (2026-07-02) |
|---|---|---|
| FOS React app | this repo — Vite 7 + React 19 + TS strict + Firestore, project `tailor-played` | Built through Story 7.4; barely used; Gal has not adopted it |
| FOS-internal email functions | this repo — `functions/src/email/onEmailReceived.ts`, `functions/src/ai/processDocument.ts`, `functions/src/scheduled/retryFailedProcessing.ts` | Code exists; Pub/Sub deployment never verified; superseded in practice; **to be retired (locked decision #1)** |
| fos-mcp | Cloud Run `me-west1`, repo `fos-mcp` | LIVE. Generic Firestore wrapper: 8 tools, 8-collection allowlist, atomic audit log. Enforces NO schema/vocabulary |
| Legacy agents | repo `tailor-played-agents`, Firebase codebase `agents`, same project | Email Receipt Agent DEPLOYED 2026-05-17 (4 functions + 2 Apps Script pollers on 15-min triggers, mailboxes orders/supplies/developing/expenses); Telegram bot LIVE since 2026-05-15 |
| Dumbbell | repo `tailorplayed-dumbbell` (Claude Cowork plugin), mailbox developing@ | Built and matches its spec; extract has run over ~330 messages; **deliver is dormant by design until the vocabulary migration** |
| Rocky | claude.ai project + fos-mcp connector | Configured, read-path verified (May 2026); data-poor; returns after order is restored |

## 2. The transactions data model (this repo)

Two synchronized definitions: server `functions/src/shared/schemas.ts:54-79`, client
`src/types/transaction.ts:20-47`. Key fields: `vendorName`, `amountAgora` (int, minor units),
`currency` (ILS/USD/EUR), `date` (single date — the two-date model does not exist yet), `category`,
`workOrderId`, `status` (`pending_review`/`approved`/`rejected` — no `expected`), `aiConfidence`,
`source` (`manual`/`ai`), `sourceEmailRef`, suggestion + reasoning fields, and currency-conversion
integrity fields (`conversionRate`, `conversionRateDate`, `isEstimatedConversion`,
`conversionRateStale`).

**The category enum is the OLD one** — `src/types/transaction.ts:3-11` (identical server copy):
`DirectCost, InventoryRestock, Overhead, Revenue, Personal, OwnerContribution, OwnerWithdrawal`
(the two Owner values were added in PR #1, 2026-05-15). The NEW locked vocabulary (see
`06-external-contracts.md`) has NOT been migrated.

**Where the old enum bites (the migration trap):** on approval, a Cloud Function trigger increments
work-order rollups keyed on the category STRING — `WO_FIELD_MAP` in
`functions/src/triggers/onTransactionApproved.ts:9-13` (`DirectCost→directCostAgora`,
`Revenue→revenueTotalAgora`, `InventoryRestock→inventoryCostAgora`). A row with an unknown category
(e.g. `production`) is silently ignored — the cost↔order link dies without an error. The old enum
is also baked into the Gemini prompt (`geminiClient.ts`), i18n label maps, dropdown UIs, and into
the legacy repo's synced copy (`tailor-played-agents/functions/src/shared/types.ts:7-15` + both AI
prompts there).

Other enums: work-order statuses (`Lead/Design/Production/Shipped`), email statuses, overhead
categories/recurrence, inventory log actions, `system_config` (taxMethod, currencyRates,
osPaturThresholdAgora). Collections (Firestore rules allowlist, `firestore.rules:38-45`):
`transactions, work_orders, inventory, inventory_log, overhead, email_log, audit_log,
system_config` (+ the co-tenant submission app's collections — this Firebase project is SHARED;
`firestore.rules` is the source of truth for both apps).

## 3. What the app already does (keep and integrate — locked decision #20)

- **Dashboard** (`src/features/dashboard/hooks/useDashboardData.ts`): monthly Net Profit + deltas,
  Tax-Jar reserve, Active Projects, monthly overhead burn, pending-review counts, Pipeline Revenue,
  Osek-Patur threshold banner (`:141-146`).
- **Per-order P&L**: NutritionLabel (`src/features/work-orders/components/NutritionLabel.tsx`) —
  revenue, direct costs, inventory costs, overhead allocation, buffer, margin health.
- **Forward projection** (`ForwardProjection.tsx` + `src/lib/projection.ts`): "what if I spend X" →
  buffer, months of coverage, recovery.
- **Review queue** (`/review`): Ghost-Text editing (category + work order only), approve/reject,
  batch-approve for `aiConfidence ≥ 85` (`useBatchApproval.ts:26-82`), mobile variant, keyboard
  shortcuts.
- **Inventory** with WAC recalc, scoop/waste, audit log. **Overhead** page with burn summary.
- i18n Hebrew/English, RTL. No charting library exists. **No search UI anywhere** (a `SearchInput`
  component exists but is wired to nothing). No delete capability in the client.

## 4. Live-data findings (read via fos-mcp, 2026-07-02)

1. **The 14-duplicate incident:** the 14 most recent `transactions` are all "Anthropic, PBC",
   $200 (20000 agora USD), category `Overhead`, receipt-date 2026-02-06, each from a DIFFERENT
   Gmail messageId (mailbox `developing`), all created 2026-05-18 within ~3.5 hours, all still
   `pending_review`. Per-messageId idempotency held; **no content-level dedup exists** — one
   historical receipt duplicated across email messages became 14 rows.
2. **Staleness:** nothing written to `transactions` since 2026-05-18/19.
3. **work_orders: 2 docs** — one real (client אילנית גרין, Shipped, directCost ₪154.18,
   **revenueTotal 0 — revenue has NEVER entered FOS**) and one test row ("hyfghfgh", Lead).
4. **A TEST row sits `approved` in prod** ("TEST — Owner Contribution (Ben)", category `Personal`,
   note says "Schema migration pending… Sweep when done").
5. **Mixed `createdAt` types** in prod (string vs Timestamp) — breaks orderBy semantics.
6. All AI rows carry the hardcoded fallback FX (`conversionRate 3.5`, `conversionRateStale true`) —
   `system_config` rates were not usable at intake time.

## 5. The intake collision map

| Pipeline | Mailboxes | Writes | Status |
|---|---|---|---|
| Legacy email agent + Apps Script pollers (`tailor-played-agents`) | orders@, supplies@, developing@, expenses@ | `email_log` + `transactions` (OLD enum), forwards to Paperless | Deployed 2026-05-17; wrote the May-18 duplicates; pollers were never consciously turned off |
| FOS-internal functions (this repo) | orders@ (default) | `email_log`-triggered → `transactions` | Probably never wired (Pub/Sub unverified); still deployable by accident |
| Dumbbell (Cowork) | developing@ | Gmail labels now; `transactions` later via fos-mcp (NEW vocabulary) — deliver dormant | extract ran ~330 msgs |
| Telegram bot (`tailor-played-agents`) | — | `pending_receipts` + `transactions` (OLD enum) on confirm | Live since 2026-05-15 |

Dedup guards are intra-pipeline only (legacy: `email_log` messageId + `sourceEmailRef`; Dumbbell:
Gmail labels + messageId key; fos-mcp: caller-supplied `idempotency_key` looked up in `audit_log`).
**Nothing prevents cross-pipeline double-writes or double Paperless forwards.**

## 6. Security & hygiene findings

1. Plaintext secrets on Ben's Desktop: `TailorPlayed\FOS\v2-rocky\fos-mcp-key.json` (service-account
   key) and `fos-mcp-bearer.txt` (the fos-mcp Bearer). Rotate + move to a secret store.
2. A live Telegram bot token is committed in `tailor-played-agents/TELEGRAM-DATA.txt`. Rotate+purge.
3. fos-mcp auth = ONE shared static Bearer behind an OAuth facade; `actor` is self-declared; OAuth
   client store is in-memory (lost on redeploy).
4. Auth divergence in this repo: client whitelists 2 hardcoded UIDs (`src/services/auth.ts:16-18`)
   while Firestore rules accept any `@tailorplayed.com` email or `dartaryan@gmail.com`
   (`firestore.rules:6-10`). Align to one policy.
5. `firebase.json` has NO hosting block — the SPA's deploy target is not defined in-repo.
