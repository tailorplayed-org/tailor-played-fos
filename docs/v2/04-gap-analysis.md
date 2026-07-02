# FOS v2 — Gap Analysis (the PRD seed)

> What FOS is missing today to become the approved target (`03-target-vision.md`), as 9 gaps in 4
> build waves. Each gap: what's missing · where it lives · dependencies · effort (S = a focused
> session, M = a few sessions, L = a project) + main risk.
> **Ordering law: build it right — nothing writes the new vocabulary before Gap 1 lands.**

## Gap 1 — Vocabulary migration + production-data cleanup ⟵ THE prerequisite

- **Missing:** FOS speaks the OLD enum; the target is the locked vocabulary
  (`revenue, production, materials, developing, expenses, owner-*` — see `06-external-contracts.md`).
- **Where:** this repo — `src/types/transaction.ts:3-11`, `functions/src/shared/schemas.ts:39-47`,
  **`WO_FIELD_MAP` in `functions/src/triggers/onTransactionApproved.ts:9-13`**, the Gemini prompt
  (`geminiClient.ts`), i18n maps, dropdown UIs; PLUS the synced copy + AI prompts in
  `tailor-played-agents` (or their deletion via Gap 2).
- **Mapping:** `DirectCost→production`, `InventoryRestock→materials`, `Personal→owner-personal`,
  `Revenue→revenue`, Owner values 1:1 kebab-case; **`Overhead` splits per-row into
  `developing`/`expenses`** (human judgment; only ~dozens of rows exist).
- **Cleanup in the same wave (prod is nearly empty — cheapest moment ever):** the 14 duplicate
  Anthropic rows (2026-05-18), the approved TEST row, the "hyfghfgh" work order, mixed `createdAt`
  types.
- **Depends on:** nothing. Everything depends on it.
- **Effort/risk:** **M**. Risk: missing one consumer of the old strings — mitigate with a
  repo-wide grep checklist per string (both repos).

## Gap 2 — Legacy decommission: one pipe only

- **Missing:** intake singularity. The deployed legacy email agent + 2 Apps Script pollers still
  exist (they wrote the May-18 duplicates and were never consciously turned off); the FOS-internal
  email functions are a second dormant copy; Dumbbell is the approved sole pipe.
- **Where:** `tailor-played-agents` (disable Apps Script triggers in both Workspace accounts;
  un-deploy `emailIntake`, `processEmailDocument`, `retryEmailProcessing`, `emailIntakeHeartbeat` +
  their Cloud Scheduler jobs); this repo (retire `functions/src/email/*` + `processDocument` export
  from `functions/src/index.ts`). **Telegram bot stays live** — patch its enum with Gap 1 or freeze
  until then.
- **Depends on:** decision only; runs parallel to Gap 1.
- **Effort/risk:** **S**. Risk: something undocumented still posts to the legacy intake URL —
  verify by `email_log` silence after disable.

## Gap 3 — Schema extensions: domain, two dates, expected

- **Missing:** the three pillars of the approved model — `domain` field, `eventDate`/`valueDate`,
  and `expected` as a first-class state.
- **Where:** this repo (types, Zod schemas, review UI, all dashboard hooks — today everything keys
  on a single `date`; month-rule aggregation replaces the single-date month buckets in
  `useDashboardData.ts`), the Dumbbell contract (domain emission), fos-mcp hydration defaults
  (`normalize.ts`).
- **Depends on:** Gap 1 (same schema surface — one migration wave, categories first).
- **Effort/risk:** **M**. Risk: month-rule double-count at credit-settlement rows — the bank feed
  must mark card-settlement debits as transfers (Gap 6 reconciliation rule).

## Gap 4 — Dumbbell amendments + deliver activation

- **Missing:** (a) archive rule per Ben's inbox-zero decision (today only `triage/duplicate`
  archives; Tier-1 has no archive instruction); (b) domain emission; (c) **content-fingerprint
  dedup** (vendor+amount+date → `triage/duplicate`) — the May-18 incident proves messageId alone is
  insufficient; (d) then create the weekly `dumbbell-deliver` scheduled task (its own gate — "not
  until the FOS vocabulary migration lands" — is satisfied after Gap 1); (e) **absorb the frozen
  Secretary finance rules** into Dumbbell's classification guidance — Secretary (the mail-transport
  agent) froze 7 vendor rules under its constitution, marked `migrated: pending`, whose logic now
  belongs to Dumbbell: Shiptanbul → `production`; hebrew-ai (Stripe), TTD (Stripe), Anthropic
  receipts, ElevenLabs (Stripe) → `developing`. When they are encoded in Dumbbell, notify Secretary
  to flip them to `migrated: done` (they live in its `state/rules/vendor-rules.json`); (f) resolve
  the 3 duplicate receipt pairs quarantined under `triage/duplicate` in developing@ (Anthropic
  #2819, #2948, Google Cloud 01F7E0) — Dumbbell's to decide, per the ratified territory split.
- **Where:** repo `tailorplayed-dumbbell` — `knowledge/vocabulary-contract.md`, the three SKILL.md
  files, the Cowork scheduled task. Also: investigate why classify's daily summaries never landed
  in the runtime `output/` folder despite ~330 scratch files.
- **Depends on:** Gaps 1+3 hard; (a)+(c) can land earlier (they don't write to FOS).
- **Effort/risk:** **S–M**. Risk: first weekly run meets the historical backlog — supervise it.

## Gap 5 — SUMIT income feed

- **Missing:** revenue reality — FOS has NEVER held a revenue row (the one real work order shows
  revenueTotal 0). SUMIT knows executed charges AND expected payments.
- **Where:** new component (SUMIT webhook → small Cloud Function → fos-mcp; or a scheduled agent on
  the SUMIT API/MCP surface). Emits `revenue` rows (+`expected`) with domain.
- **Depends on:** Gaps 1+3.
- **Effort/risk:** **M**. Risk: SUMIT-document → domain mapping (TP vs Benefits) needs a rule —
  start with a manual-confirm queue.

## Gap 6 — Bank/card live feed (One Zero + Isracard 9576 only)

- **Missing:** actual account movements, touch-free.
- **Where:** new component. Recommended shape: **moneyman** (maintained wrapper of
  israeli-bank-scrapers; runs on GitHub Actions/Docker schedules) → its Web-Post exporter → Cloud
  Function → fos-mcp; a reconciliation pass matches receipts/SUMIT rows to movements
  (amount+date proximity) and marks card-settlement debits as transfers. Credentials in GCP Secret
  Manager; One Zero OTP via long-term token or Telegram prompt; failure alerting.
- **Depends on:** Gaps 1+3; reconciliation benefits from Gap 5 live.
- **Effort/risk:** **M** to stand up, **ongoing maintenance** after. Risks: scraper breakage every
  few weeks ecosystem-wide; Cloudflare bot-blocking on Isracard (active 2026 — fallback: manual XLS
  import while blocked); credential custody; One Zero marked "experimental" in the library.

## Gap 7 — The five screens + full-app UI restyle + charts

- **Missing:** (a) the approved surface — תזרים (daily running balance + expected overlay + month
  rule), חודש-מול-חודש (P&L per domain), Review on new vocabulary + domain chip, צפויים manager,
  דומיינים incl. shared-services view — all mocked in `mockup/fos-mockup.html`; (b) **restyle of
  ALL existing screens** to the mockup's dense design language (locked decision #18 — current UI:
  oversized fonts/components, clunky); (c) **charts area** (pie by category, income by domain,
  monthly trend — `05-ui-spec.md` §Charts); (d) transaction search + date-range filter (none exists
  today).
- **Where:** this repo — new routes + rework of `DashboardPage`; restyle pass over Work Orders,
  Inventory, Review, shell/nav; keep existing mechanics (Ghost-Text, batch-approve, NutritionLabel,
  projection) per locked decision #20.
- **Depends on:** Gap 3 for real data; the shell/restyle can start against the mockup's contracts.
- **Effort/risk:** **L** (largest block). Risk: scope creep — **the mockup is the spec**.

## Gap 8 — Rocky re-commissioning

- **Missing:** the conversational layer over ordered data (gated writes: expected items,
  corrections).
- **Where:** the Rocky claude.ai project — rewrite all knowledge files (new vocabulary, domain
  model, two-date rule, new pipeline map, fix the long-known Gal-pronoun errors).
- **Depends on:** Gaps 1–5 (there must be truth to talk about).
- **Effort/risk:** **S**. Risk: patching stale knowledge instead of rewriting — rewrite.

## Gap 9 — Security & hygiene (parallel track, start anytime)

1. Plaintext secrets on Desktop (`fos-mcp` SA key + Bearer) → secret store, rotate both.
2. Live Telegram bot token committed in `tailor-played-agents/TELEGRAM-DATA.txt` → rotate, purge.
3. fos-mcp single shared Bearer / self-declared `actor` → per-agent tokens at minimum.
4. Client-UID whitelist vs rules-email-domain divergence in this repo → one policy.
- **Effort/risk:** **S** each. These are the keys to the money data.

## Build sequence

```
Wave 1 (foundations):  Gap 1 ← Gap 2 (parallel) ← Gap 9 (parallel, anytime)
Wave 2 (schema):       Gap 3 ← Gap 4 (deliver goes live at its end — the email loop closes)
Wave 3 (real data):    Gap 5 ← Gap 6 (FOS becomes a true single source of truth)
Wave 4 (experience):   Gap 7 ← Gap 8 (FOS becomes the approved RiseUp-of-the-business)
```

Each wave is independently valuable. Parked items: see `01-locked-decisions.md` §Parked.
