# FOS v2 — External Contracts (DO NOT BREAK)

> FOS is one node in an agent ecosystem. The contracts below live OUTSIDE this repo, are already
> ratified by Ben, and constrain v2 design. Breaking any of them silently corrupts another system.

## 1. The locked category vocabulary (owner: Dumbbell)

Source of truth: `tailorplayed-dumbbell/knowledge/vocabulary-contract.md` (header: LOCKED).
Law: **one string everywhere — Gmail label === FOS `category` === the contract. No mapping tables.**

| category | role | who assigns |
|---|---|---|
| `revenue` | income rollup per work order | deterministic (SUMIT sender filter); written to FOS, **never forwarded to the accountant** |
| `production` | per-work-order direct production cost — **the cost↔order link** | Dumbbell content judgment |
| `materials` | operational expense; future inventory/WAC bearer | Dumbbell content judgment |
| `developing` | operational expense (software / online services) | Dumbbell content judgment |
| `expenses` | operational expense (general) | Dumbbell content judgment |
| `owner-contribution` / `owner-withdrawal` / `owner-personal` | owner equity in / out / personal-on-business | **manual only — Dumbbell never emits** |

Triage states (`triage/urgent, missing-document, needs-decision, unclassified, duplicate, junk,
unsubscribe`) and source markers (`source/telegram`, extensible) are Gmail-side only — they never
become FOS rows. v2 additions to the contract (domain field, archive-everything rule,
content-fingerprint dedup) are Gap-4 amendments made IN the Dumbbell repo, with Ben's approval —
not ad-hoc in FOS.

## 2. Dumbbell → FOS write contract (activates after the migration)

From `tailorplayed-dumbbell/skills/dumbbell-deliver/SKILL.md`:

- Tool: fos-mcp `create_document`, `collection: "transactions"`, `actor: "dumbbell"`.
- **`idempotency_key` = the Gmail `messageId`** (convention — the server does not derive it).
- Payload: vendorName, amountAgora (int agora), currency, ISO-8601 noon-UTC date, category verbatim
  from the vocabulary, suggestedWorkOrderId, currency-conversion block, `status: "pending_review"`,
  `source: "ai"`, notes containing `gmail:{messageId}` + `thread:{threadId}`.
- **Never writes `email_log`.** FOS historically had its own processor watching `email_log` that
  would create a SECOND transaction. Even after the internal functions are retired (Gap 2), this
  prohibition stands.
- Forwards expense receipts to the accountant (Paperless) exactly once (`dumbbell-forwarded`
  guard); `revenue` is never forwarded.
- The weekly deliver task is dormant BY DESIGN until the vocabulary migration (Gap 1) lands.

## 3. fos-mcp (the bridge all agents write through)

Repo `fos-mcp`, Cloud Run `me-west1`. 8 tools (`list_collections, get_document, query_collection,
create_document, update_document, delete_document, commit_batch, run_transaction`); collection
allowlist: `transactions, work_orders, inventory, inventory_log, overhead, email_log, audit_log,
system_config`; every write requires `actor` + `idempotency_key` and lands atomically with an
`audit_log` entry (which doubles as the idempotency store).

**Critical caveats for v2 design:**
- It enforces **NO schema and NO vocabulary** — document bodies are free-form JSON. Category and
  domain correctness is entirely the writers' discipline. (Consider server-side vocabulary
  validation as a v2 improvement — but that is a change in the fos-mcp repo, coordinated, after
  Gap 1.)
- `update_document` upserts silently (merge-set, no existence check); `run_transaction` applies
  writes unconditionally (no compare-and-set) — caller-side care required.
- Only ISO-8601 datetime strings WITH time+zone are coerced to Timestamps; date-only strings stay
  strings — a date-integrity trap.
- Auth today: one shared static Bearer; `actor` is self-declared (see Gap 9).

## 4. Secretary (email transport agent — Ben's mail-triage system)

Constitution ratified 2026-07-02. Division of territory:

- **Secretary owns TRANSPORT**: getting every receipt from every mailbox TO developing@ (filters +
  manual-forward flags + transport-time fingerprint dedup) and tagging `Money/*` on source boxes.
- **Dumbbell is the sole classification authority inside developing@.** Secretary never coins or
  applies the finance vocabulary; its historical finance vendor-rules are frozen pending migration
  into the finance pipeline's authority.
- **Register-mode everywhere**: every handled mail archives; `Action/*` labels are the worklist;
  inbox = true zero (this is the same Ben decision that adds the archive rule to Dumbbell in Gap 4).
- Secretary never extracts amounts, never writes to FOS, never forwards to the accountant.

## 5. Rocky (conversational layer — returns in Wave 4)

A claude.ai project connected through fos-mcp. After re-commissioning (Gap 8): read access +
gated writes limited to expected items and corrections, `actor: "rocky"`, its own idempotency-key
convention. Its knowledge files must be REWRITTEN (not patched) to the v2 world: new vocabulary,
domain model, two-date month rule, Dumbbell-only intake. Known stale defect to fix in the rewrite:
Gal is Ben's male partner (old files use wrong pronouns).

## 6. Shared Firebase project

This repo deploys into Firebase project `tailor-played`, which is SHARED with the public
submission app (collections `submissions, counters, progress_saves, rate_limits`) and with the
legacy agents codebase (`codebase: "agents"`). `firestore.rules` in THIS repo is the single source
of truth for the whole project — deploy rules only from here, and never touch the submission app's
rules blocks.
