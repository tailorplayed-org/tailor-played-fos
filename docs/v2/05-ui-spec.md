# FOS v2 — UI Spec (the mockup is the spec)

> `mockup/fos-mockup.html` is the approved visual reference — open it in a browser before reading
> further. This document extracts its rules so they can be applied to the WHOLE app (locked
> decision #18: full-app restyle; Ben on the current UI: "texts and components are huge, feels
> clunky"). Hebrew, RTL, desktop-first with mobile support.

## 1. Design tokens (from the mockup — adopt as CSS custom properties / SCSS tokens)

```css
--bg:#f6f7f9;            /* app background */
--surface:#ffffff;       /* cards, panels */
--border:#ececec;        /* hairline borders */
--border-strong:#dfe3e8; /* table header rules, controls */
--text:#1d1d1f;  --text-2:#5f6570;  --text-3:#9aa0a8;
--accent:#0e9f9a;        /* single teal accent */
--accent-soft:#e6f5f4;   --accent-border:#bfe6e4;
--income:#1e8e5a;  --income-soft:#e9f6ef;   /* semantic green */
--expense:#b4552d; --expense-soft:#faf0ea;  /* semantic clay — NOT alarm-red */
--owner:#6b5bd2;   --owner-soft:#efedfa;
--ghost:#8b93a0;         /* expected/forecast */
--radius:10px;
--shadow:0 1px 2px rgba(20,24,32,.05), 0 4px 14px rgba(20,24,32,.04);
```

Domain chip colors: TailorPlayed `#f3ecfd`/`#5b2ea6` · Benefits `#fff6e0`/`#8a6400` ·
משותף = accent-soft/accent · בעלים = owner-soft/owner. Channel chips: bank `#eef2f6`/`#44505e`,
credit `#fdeef3`/`#a53963`.

Note: the current app uses the Fredoka brand font (`public/fonts/`). The mockup uses Rubik. Either
is acceptable — **density is the requirement, not the typeface**; if Fredoka stays, apply the size
ramp below unchanged.

## 2. Density rules (the heart of the restyle)

- Base font **13px**; body line-height 1.45. Page titles ~17px. KPI values ~19px. Table text
  12.5px; table headers **11px** medium, muted. Chips 10.5px. NO text above 20px anywhere except
  possibly one hero number.
- Paddings: cards 11–14px; table cells **6px 12px**; buttons 4px 12px. Radius 10px. Shadows
  ultra-subtle (see token).
- Tables: hairline row borders (`--border`), header row on `#fbfbfc`, **tabular numerals**
  (`font-variant-numeric: tabular-nums`), amounts LTR-directioned inside RTL layout.
- Color discipline: ONE accent (teal). Green/clay are semantic (income/expense) only. No gradients,
  no decorative color.
- Chips everywhere instead of long text: domain, channel, category (category chips in monospace
  10px), status, confidence.
- Expected/forecast rows: ghost treatment — muted color + subtle diagonal-stripe background +
  dashed chip border; projected balances prefixed `~`.
- Icons: inline SVG (Phosphor already in the project), 14–16px, never emoji.

## 3. Per-view spec (behavioral contract; visuals per the mockup)

### תזרים (home)
- Summary strip (5 KPI cards): נכנס החודש (landed) · יצא החודש (made) · נשאר החודש · יתרה נוכחית ·
  צפי סוף חודש (`~`, includes expected — clearly labeled forecast).
- Daily register table: תאריך · פרטים · דומיין+קטגוריה chips · ערוץ (בנק/אשראי) · תקבול · תשלום ·
  יתרה. Running balance on actual rows only; expected rows show `~` projected balance and never
  affect the actual balance. Month selector (‹ ›). Footnote states the month rule.
- Credit rows are visually distinct (channel chip). Card-settlement bank debits appear as transfers
  (muted, excluded from expense totals).

### חודש מול חודש
- P&L table, months as columns (default: last 3): הכנסה (נחתה בחשבון) → עלות המכר
  (production+materials) → **רווח גולמי** → הוצאות תפעול (developing+expenses) → העברות בעלים
  (owner-*) → **נשאר החודש**. Domain filter chips: הכל / TailorPlayed / Benefits / משותף / בעלים.
- Osek-Patur variant: no VAT rows.

### Review
- Keep existing mechanics (`src/features/review/*`): Ghost-Text editing, reject dialog,
  batch-approve ≥85, mobile variant, keyboard shortcuts. Restyle to density rules.
- Add: **domain select** next to the category select; confidence chip (green ≥85, amber below);
  copy addressed to "the reviewer" — never to Gal specifically.

### צפויים
- Table: תיאור · דומיין · סוג (הכנסה/הוצאה) · תאריך צפוי · סכום · מצב (`צפוי` dashed chip /
  `נחת ✓` green chip). Add/edit inline. Landed rows link to the matched actual transaction.

### דומיינים
- Card per domain: הכנסות / הוצאות / נטו + a thin income-vs-expense bar.
- Shared-services table: service · category chip · monthly cost · serves (TP+Benefits chips).
- Hosts the charts area (below).

## 4. Charts area (locked decision #19)

- **Pie/donut — expenses by category** (current month, domain-filterable).
- **Pie/donut — income by domain**.
- **Bar or line — monthly trend**: income vs expenses vs remainder, trailing 6–12 months.
- Implementation: lightweight. Options: hand-rolled SVG (the project already renders CSS/SVG
  meters), or a small library (e.g. Recharts) — implementer decides; avoid heavy charting suites.
- Rules: semantic colors only (income green, expense clay, domains use their chip colors); tooltips
  on hover; legends in Hebrew; tabular numbers; every chart must also be readable as a number
  (value labels or an adjacent table) — charts illustrate, they never replace figures.

## 5. Existing components → new language (mapping)

| Existing | Fate |
|---|---|
| `PageShell` + nav | Restyle: light surface, denser nav, new IA (`03-target-vision.md` §5) |
| `DashboardPage` KPI cards | Fold into תזרים summary strip; density ramp |
| `OsPaturBanner` | Keep code, demote prominence (parked feature) — small muted indicator |
| `NutritionLabel` | Keep, restyle (13px ramp, hairline tables) |
| `ForwardProjection` | Keep, relocate (תזרים or דומיינים), restyle |
| Ghost-Text review cards | Keep mechanics, restyle + domain select |
| Inventory / Work-order pages & dialogs | Keep flows, restyle tables/forms to density rules |
| Overhead page | Absorbed into ledger views + charts (see `03-target-vision.md` §5) |
| `SearchInput` (orphaned) | Wire it: vendor free-text + date-range filter over the ledger |
| Lottie dice animations | Remove from data screens — decoration fights density |

## 6. Acceptance sanity (for any restyled screen)

1. Base text 13px; nothing over 20px except at most one hero number per screen.
2. A 1440px viewport shows a full month register (~25 rows) without scrolling inside the card.
3. RTL correct: Hebrew flows right; amounts and dates render LTR within cells (`direction:ltr`).
4. Expected/forecast data is visually unmistakable (ghost) and excluded from actual totals.
5. Income green / expense clay used semantically and consistently; single teal accent elsewhere.
