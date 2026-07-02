# FOS v2 — The Complete System Map

> One page that holds the whole ecosystem: every component, its role, its status today, and how
> money-data flows end to end. Details per component: `02-current-state.md` (today) and
> `06-external-contracts.md` (binding contracts). Status column reflects 2026-07-02.

## The flow

```
        Ben's source mailboxes (ben.akiva@, benakiva1991@, dartaryan@ ...)
                               │
                    [ SECRETARY — transport ]
        every receipt reaches developing@ · Money/* tags on source boxes
        transport ledger blocks duplicate forwards (fingerprint dedup)
                               │
                               ▼
              developing@tailorplayed.com  ◄── vendor/SUMIT receipts arriving directly
                               │
                    [ DUMBBELL — classification ]
          extract → classify (Gmail label IS the state, sole authority here)
          deliver: weekly, DORMANT until the vocabulary migration (Gap 1)
                     │                        │
        expense receipts, once each          │ transactions (new vocabulary)
                     ▼                        ▼
          Accountant (Paperless)     [ FOS-MCP — Cloud Run bridge ]
                                      8 tools · collection allowlist ·
                                      atomic audit log · idempotency
                                              │
                                              ▼
                                 Firestore (project `tailor-played`)
                                              ▲
              ┌───────────────┬───────────────┼───────────────┐
        [ SUMIT feed ]  [ Bank/card feed ]  [ Telegram bot ]  [ Rocky / manual ]
        income: actual   One Zero + 9576     receipt photos    conversation layer:
        + expected       movements           (live today,      expected items +
        (planned, G5)    (planned, G6)       OLD enum — G2)    corrections (G8)
                                              │
                                              ▼
                                   [ FOS app — THIS repo ]
                    תזרים · חודש מול חודש · Review · צפויים · דומיינים · הזמנות · מלאי
                                   Ben + Gal — the reviewers
```

## Components & status

| Component | Role | Lives in | Today (2026-07-02) | Target |
|---|---|---|---|---|
| **Secretary** | Email TRANSPORT + order on source boxes. Never classifies finance, never writes FOS | `projects\seeker-fix\secretary` (Claude Code) | **Live, constitution v1.0 executed**: developing@ read-only for it, transport ledger active, register-mode universal | Unchanged — it is done; interfaces via developing@ only |
| **Dumbbell** | SOLE classifier inside developing@; the only email→FOS writer; accountant forwarding | repo `tailorplayed-dumbbell` (Cowork plugin) | Built; daily extract/classify ran ~330 msgs; **deliver dormant by design** | Gap 4: archive rule, domain emission, content dedup, absorb Secretary's frozen rules → weekly deliver LIVE |
| **fos-mcp** | The one bridge agents write through (allowlist, audit, idempotency) | repo `fos-mcp`, Cloud Run `me-west1` | **Live** (enforces NO vocabulary — caller discipline) | Unchanged in v2 core; candidate: server-side vocabulary validation; Gap 9: per-agent auth |
| **FOS app + functions** | The display + review surface, rollups, this repo | repo `tailor-played-fos` | Built to Story 7.4, OLD enum, single-date model, barely used, data stale since 2026-05-18 | Gaps 1+3+7: new vocabulary, domain + two dates + expected, five views, full restyle, charts |
| **Legacy agents** | Old email intake (4 CFs + 2 Apps Script pollers) + Telegram bot | repo `tailor-played-agents` | Email agent **deployed and never consciously turned off** (wrote the May-18 duplicates); Telegram bot live | Gap 2: email side DECOMMISSIONED. Telegram stays (enum patched with Gap 1); unification parked |
| **SUMIT feed** | Income truth: executed + expected | new component | Does not exist (revenue has NEVER entered FOS) | Gap 5 |
| **Bank/card feed** | "What really happened": One Zero + Isracard 9576 | new component (moneyman-class) | Does not exist | Gap 6 |
| **Rocky** | Conversational layer over the ordered data | claude.ai project + fos-mcp connector | Configured, data-poor, knowledge stale | Gap 8: rewritten knowledge, gated writes (expected, corrections) |
| **Ben + Gal** | The reviewers (equally); Ben also: expected items, owner transfers, taxonomy approvals | — | — | — |
| **Accountant** | Receives each expense receipt exactly once (Paperless) | external | Receives nothing (deliver dormant) | Weekly, from Dumbbell only |

## Write-path law (one writer per source, all through fos-mcp)

| Writer | Writes | Idempotency key convention |
|---|---|---|
| Dumbbell | email-sourced transactions | Gmail `messageId` |
| SUMIT feed (G5) | revenue rows (actual + expected) | SUMIT document id |
| Bank/card feed (G6) | account movements | provider transaction identifier + account |
| Rocky (G8) | expected items, corrections | its own dated convention, `actor:"rocky"` |
| Ben/Gal via app | manual rows, review verdicts | n/a (interactive) |

Cross-source reconciliation (bank movement = anchor; receipt = documentation; SUMIT = income
explanation) + content-fingerprint dedup is the Gap 3/6 layer on top.

## Open cross-system loops (do not lose these)

1. **Frozen Secretary finance rules → Gap 4e.** 7 rules sit `migrated: pending` in Secretary's
   `state/rules/vendor-rules.json`; after their logic is encoded in Dumbbell, tell Secretary to
   flip them to `done`.
2. **3 quarantined duplicate pairs** in developing@ (`triage/duplicate`) → Gap 4f, Dumbbell decides.
3. **Telegram bot enum** must be patched or frozen at Gap 1 time (it writes OLD-enum rows today).
4. **Dumbbell guard labels on developing@** (`dumbbell-processed/-forwarded/-delivered`) are
   registered at Secretary as foreign labels — no other system may touch them.
