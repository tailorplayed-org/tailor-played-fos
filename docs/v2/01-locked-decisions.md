# FOS v2 — Locked Decisions (Ben, 2026-07-02)

> These are Ben's binding decisions from the v2 definition sessions. Treat every item as a
> constraint, not a suggestion. Changing any of them requires Ben's explicit re-approval, recorded
> here with a date.

## Intake & pipelines

1. **Dumbbell is the ONLY email intake.** The legacy agents (`tailor-played-agents` email functions
   + the two Apps Script pollers) get decommissioned. The FOS-internal email functions
   (`functions/src/email/`, `functions/src/ai/processDocument.ts` + exports in
   `functions/src/index.ts`) are retired — Ben: "better off without them".
2. **developing@tailorplayed.com is the single receipts mailbox.** expenses@ is out of use; every
   receipt from every mailbox is transported to developing@ (that transport is owned by a separate
   agent — see `06-external-contracts.md` §Secretary).
3. **Inbox-zero always.** Ben never works from the inbox. Every processed email is archived after
   labeling; "needs attention" is expressed as clear labels (a register), never inbox presence.
4. **Telegram receipt bot stays live for now**; its long-term fate is unification into the mailbox
   flow (it emails the shared mailbox instead of writing Firestore directly) — ships last. Until
   the vocabulary migration lands it must not write new-vocabulary rows; patch its enum together
   with Gap 1 or freeze it.

## Scope & data model

5. **Both businesses.** All income enters FOS — TailorPlayed AND Benefits — for full transparency
   on what brings money in and where money goes.
6. **Domain tag on every transaction:** `TailorPlayed` | `Benefits` | `משותף` (shared — serves both
   businesses, e.g. AI subscriptions) | `בעלים` (owner). Visibility first; budgets-per-domain later.
7. **Truly-private spend stays OUT of FOS** (electricity, food, home). Personal finances live in
   RiseUp-the-app. Only owner flows enter FOS: self-transfers for living costs
   (`owner-withdrawal`, will start when needed — not yet), equity in (`owner-contribution`), and
   personal spend that leaked onto business accounts (`owner-personal`).
8. **Truth hierarchy:** bank/credit movements = what actually happened; SUMIT = income truth
   (executed + expected); email receipts = documentation that classifies and feeds the accountant.
9. **Two dates per transaction:** `eventDate` (when the expense was made / charge happened) and
   `valueDate` (when money actually moved in the account). The credit-card billing cycle lives in
   the gap between them.
10. **Expected is a first-class state.** Expected income/expense rows carry dates and convert to
    actual when the money physically lands (matched via bank/SUMIT). Entered manually in-app or
    conversationally via Rocky. Expected is ALWAYS shown as forecast, never counted as balance.
11. **The month rule (RiseUp-style):** an expense belongs to the month it was MADE (eventDate),
    even if not yet charged; income belongs to the month it physically ARRIVED (valueDate). Never
    build on money that isn't there. Each month stands alone: income-in vs expenses-made → monthly
    remainder.
12. **Vocabulary migration + data cleanup approved** as the first implementation step: FOS adopts
    the new locked vocabulary; existing prod rows are translated (Overhead splits per-row into
    developing/expenses); cleanup of the 14 duplicate Anthropic rows, the approved TEST row, and
    the "hyfghfgh" work order.
13. **Automated entry first, manual correction after.** The system fills itself; humans fix.

## Feeds

14. **Live bank/card feed approved — business accounts only:** One Zero (business bank) + Isracard
    9576 (business card). Ben explicitly prefers touch-free over manual monthly imports ("I'll
    forget, and it won't be current"). Personal accounts stay out.
15. **SUMIT feed approved:** executed charges + expected payments Ben issued.

## Surface & roles

16. **Everything as screens inside the FOS app.** Desktop-first, some mobile.
17. **Review is Ben AND Gal equally.** UI copy must not address Gal specifically — address "the
    reviewer".
18. **Full-app UI restyle to the dense design language of `mockup/fos-mockup.html`.** Ben on the
    current UI: texts and components are huge, it feels clunky. This is NOT only about new screens —
    the existing screens (Dashboard, Work Orders, Inventory, Overhead, Review) are restyled to the
    mockup's density and look. See `05-ui-spec.md`.
19. **Charts area.** Pie charts and similar visualizations (expenses by category, income by domain,
    monthly trend), integrated with the data views. See `05-ui-spec.md` §Charts.
20. **Existing features survive and integrate.** KPI cards, NutritionLabel per-order P&L, inventory
    + WAC, forward projection, Ghost-Text review mechanics, batch-approve ≥85 — all keep living,
    restyled and woven into the new information architecture (see `03-target-vision.md` §IA).
21. **Rocky returns** as the conversational layer over the ordered data (read + gated writes:
    expected items, corrections) — after the data layer is trustworthy.

## Parked (future phases — out of v2 scope unless Ben reopens)

Taxes & Tax-Jar prominence · Osek-Patur ceiling tracking · profit-distillation rules ·
budgets-as-alerts (visibility ships first) · inventory/WAC changes · full personal finances ·
Telegram-bot unification into the mailbox · break-even / 10%-buffer planning views.
