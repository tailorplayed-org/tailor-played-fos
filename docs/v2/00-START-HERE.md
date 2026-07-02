# FOS v2 — START HERE

> Planning package for the FOS v2 rebuild. Prepared 2026-07-02 from a full-system investigation
> (all four repos + live Firestore reads + Ben's decision sessions). Approved by Ben in full.
> **This folder is the single source of truth and the single management surface for v2** — every
> update, problem, decision, or improvement gets recorded HERE, in these files, and nowhere else.

## The essence

**FOS becomes the "RiseUp of Ben's self-employment":** one place, fed automatically, that holds
every business shekel across BOTH businesses (TailorPlayed + Benefits), organized by month, honest
about timing, always answering three questions — **what came in this month, what went out this
month, what is left.** Taxes, the Osek-Patur ceiling, and profit-distillation rules are
deliberately parked for a later phase; order first.

## Reading order

| # | File | What it gives you |
|---|---|---|
| 1 | `01-locked-decisions.md` | Ben's binding decisions. Not suggestions — constraints. |
| 2 | `02-current-state.md` | What exists today, verified in code and live data, with file:line anchors. |
| 3 | `03-target-vision.md` | The approved target system + information architecture. |
| 4 | `04-gap-analysis.md` | The 9 gaps in 4 build waves — the seed for the v2 PRD/epics. |
| 5 | `05-ui-spec.md` | The design language, tokens, per-view spec, charts spec. |
| 6 | `06-external-contracts.md` | Contracts outside this repo that v2 MUST NOT break. |
| 7 | `mockup/fos-mockup.html` | The approved visual reference — open it in a browser. It is the UI spec made tangible. |

## Governing rules (non-negotiable)

1. **Build it right, no build-then-fix.** Ben's explicit philosophy. Prefer a delayed, correct
   build over ship-break-patch. Parts may sit inactive until their prerequisites land.
2. **Nothing writes the NEW category vocabulary into Firestore before the vocabulary migration
   (Gap 1) is complete.** The cost↔order rollup is keyed on category strings
   (`functions/src/triggers/onTransactionApproved.ts` `WO_FIELD_MAP`) and dies silently on unknown
   strings. This is the trap the whole sequencing exists to avoid.
3. **On any conflict, this `docs/v2/` package supersedes the `_bmad-output/` v1 artifacts** (PRD,
   architecture, stories). v1 docs describe the OLD category enum and a TailorPlayed-only scope as
   truth — for v2 they are history and background, not requirements.
4. **Never fabricate financial data.** Sample data in mockups/tests is clearly fake; real figures
   always trace to their source (transaction → source document/feed).
5. **Scope discipline.** Parked items (see `01-locked-decisions.md` §Parked) are out of scope for
   v2 unless Ben explicitly reopens them.

## Provenance

Prepared by Silver (Ben's financial-organization agent) as the handoff from the FOS analysis
mission. The investigation evidence (five recon reports, live Firestore queries) is summarized in
`02-current-state.md`; where the summary is not enough, the anchors point into the actual code.
