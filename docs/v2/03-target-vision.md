# FOS v2 — Target Vision (approved by Ben, 2026-07-02)

> The system v2 builds toward. Approved verbatim; parked items are future phases, not omissions.
> The visual reference for everything here: `mockup/fos-mockup.html` (open in a browser).

## 1. Essence

**FOS = the RiseUp of Ben's self-employment.** One place, fed automatically, that holds every
business shekel of BOTH businesses (TailorPlayed + Benefits), organized by month, honest about
timing, always answering: what came in this month, what went out, what is left.

## 2. Intake — four feeds, one writer each, all through fos-mcp

| Feed | Carries | Nature |
|---|---|---|
| **SUMIT** | Income — executed charges AND expected payments issued | The income truth; expected→actual conversion when money lands |
| **Bank/card live feed** (One Zero + Isracard 9576 ONLY) | Actual account movements | The "what really happened" truth; scheduled scraper (moneyman-class), Secret Manager credentials, OTP fallback via Telegram |
| **Dumbbell** (email receipts, developing@ only) | Receipts/invoices as documentation | Classification + accountant forwarding + doc↔movement linking. THE only email pipe |
| **Manual / Rocky** | Expected items, corrections, owner transfers | Ben types it, or tells Rocky conversationally |

**Reconciliation principle:** a bank movement is the anchor; a receipt documents and classifies it;
a SUMIT record explains income. Content-fingerprint dedup (vendor+amount+date) on top of per-source
idempotency. Card-settlement debits in the bank feed are transfers, not expenses (the individual
credit transactions already carry the expense).

## 3. Data model target

Every transaction carries:

- **category** — the NEW locked vocabulary (`revenue, production, materials, developing, expenses,
  owner-contribution, owner-withdrawal, owner-personal`) after migration.
- **domain** — `TailorPlayed | Benefits | משותף | בעלים` (new field; answers "who earns, who costs").
- **two dates** — `eventDate` (when made/charged) and `valueDate` (when money moved). Credit-card
  billing cycle lives in the gap.
- **state** — `expected → pending_review → approved` (expected is first-class; converts on
  bank/SUMIT confirmation).
- source, confidence, reasoning, currency (dollars stay dollars: original amount + currency
  preserved alongside conversion metadata), work-order link where relevant (TailorPlayed
  production costs keep the cost↔order rollup).

## 4. The month rule (Ben's law)

- An expense belongs to the month it was **MADE** (eventDate), even if not yet charged.
- Income belongs to the month it **physically ARRIVED** (valueDate).
- Expected is shown as forecast — never counted as balance. Never build on money that isn't there.
- Each month stands alone: income-in vs expenses-made → the monthly remainder.

## 5. Information architecture — merging new views with the existing app

Proposed navigation (desktop-first sidebar or top-tabs; BMAD decides the shell):

| Nav item | Content | Relation to existing code |
|---|---|---|
| **תזרים** (home) | Daily register with running balance, bank/credit distinction, expected overlay (ghost rows + projected balance), month selector, summary strip (in / out / remainder / balance / end-of-month forecast) | NEW view. Replaces DashboardPage as home; existing KPI cards fold into its summary strip + the charts area |
| **חודש מול חודש** | Monthly P&L (income → cost of sales → gross → operating → remainder), 3 months side-by-side, domain filter | NEW view (course-workbook structure; Osek-Patur variant — no VAT rows) |
| **Review** | The existing Ghost-Text queue, restyled; + domain chip per row; new vocabulary; addressed to "the reviewer" (Ben and Gal equally) | KEEP `src/features/review/*` mechanics: editing, reject dialog, batch-approve ≥85, mobile, keyboard |
| **צפויים** | Expected income/expense manager: add/edit, dates, expected→landed status | NEW view |
| **דומיינים** | Per-domain cards (income/expense/net) + shared-services table + charts area | NEW view |
| **הזמנות** | Work orders list + detail incl. NutritionLabel P&L | KEEP `src/features/work-orders/*`, restyled |
| **מלאי** | Inventory + WAC + scoop/waste + audit panel | KEEP `src/features/inventory/*`, restyled |
| **Overhead** | Absorbed: overhead entries become regular transactions (category `developing`/`expenses`) in the ledger views; the burn-rate summary moves into חודש-מול-חודש / charts. The `overhead` collection's fate is a migration-wave decision | REWORK of `src/features/overhead/*` |
| (utility) | Forward projection ("what if I spend X") | KEEP `ForwardProjection` + `src/lib/projection.ts`, relocated (e.g., inside תזרים or דומיינים) |

**Charts area** (locked decision #19): pie — expenses by category; pie/donut — income by domain;
bar/line — monthly income vs expenses trend. Placement: a charts strip inside דומיינים and/or
חודש-מול-חודש. Spec in `05-ui-spec.md` §Charts.

**Search** (gap in current app): at minimum, free-text vendor search + date-range filter over the
transaction ledger. The orphaned `src/components/Input/SearchInput.tsx` finally gets a job.

## 6. Roles

- **Ben + Gal:** equal reviewers; Ben also manages expected items and owner transfers.
- **Agents:** Dumbbell writes email-sourced transactions (weekly deliver); SUMIT + bank feeds write
  their own; Rocky = conversational layer (read + gated writes: expected items, corrections).
  All writes via fos-mcp with per-source idempotency keys.

## 7. Parked (future phases)

Taxes & Tax-Jar prominence · Osek-Patur ceiling tracking · profit-distillation rules ·
budgets-as-alerts · inventory/WAC changes · full personal finances · Telegram-bot unification ·
break-even / buffer planning views (inspiration preserved from Ben's business-course workbooks:
daily running-balance register; monthly P&L skeleton; owner salary as a planned fixed expense).
