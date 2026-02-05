# TailorPlayed Design System Specification

## TP-FOS (Financial/Operations Dashboard) — Style Guide

> **Purpose:** This document captures the complete "Design DNA" of the TailorPlayed v3 website and
> translates it into strict, actionable rules for building the TP-FOS internal dashboard. Every
> decision below is extracted directly from the codebase (`_variables.scss`, `global.scss`,
> `_mixins.scss`, `_animations.scss`, `_accessibility.scss`, and the full component library).

---

## 1. The "Vibe" Analysis

### 1.1 Visual Language

TailorPlayed's UI communicates **"Premium Elegance"** — a dark-mode-first theme anchored in deep
purples and rich golds. It is *not* corporate or sterile. It is *not* neon-cyberpunk either. Think
**"a high-end board-game lounge at midnight"** — warm, inviting, tactile, but undeniably polished.

### 1.2 Key Adjectives

| Adjective | Evidence |
|---|---|
| **Magical** | Gold glow effects (`box-shadow: 0 0 25px rgba(252,183,0,0.25)`), gold-on-dark text, premium scrollbar styling |
| **Warm** | Fredoka font (rounded, friendly letterforms), gold/amber accent palette, relaxed line-heights |
| **Premium** | Deep purple backgrounds (#120022 → #3d006d), curated shadow scale, antialiased font rendering |
| **Playful** | Rounded corners (12–24px default), DiceLoader spinner, game-component mixins, coin/card selectors |
| **Accessible** | WCAG 2.1 AA compliance baked in, 44px minimum touch targets, 2px gold focus rings, RTL support |
| **Whimsical** | Staggered animation delays for lists, `translateY(-1px)` hover lifts, scale-in transitions |

### 1.3 Dashboard Vibe Strategy — Balancing Playfulness with Data Density

The main website is content-light and game-oriented. A financial dashboard demands density. Here is
the balancing act:

| Website Trait | Dashboard Adaptation |
|---|---|
| Large text sizes (`$text-base: 18px`) | Drop body text to `$text-sm` (16px) for tables/dense views; keep 18px for page titles & summaries |
| Generous spacing (`$space-lg: 24px` padding) | Use `$space-md` (16px) as default card padding; `$space-sm` (8px) for table cells |
| Heavy rounded corners (`$radius-lg: 16px`) | Use `$radius-md` (12px) for cards; `$radius-sm` (8px) for inline elements, inputs, badges |
| Gold glow effects on hover | Reserve glow for primary CTAs only; use subtle border-color shifts for data rows |
| Playful animations (slideUp, scaleIn) | Keep `fadeIn` for panel loads; remove bounce/slide for repetitive data elements |
| Game metaphors (dice, coins, cards) | Replace with finance metaphors — but maintain the *warmth* of color and roundedness |

**The Golden Rule:** The dashboard should feel like a *back-office extension* of TailorPlayed — same
family, different room. A user moving from the website to the dashboard should feel *at home*, not
like they switched apps.

---

## 2. Design Tokens (The Hard Rules)

### 2.1 Color Palette

#### Backgrounds (Dark-to-Light Elevation Scale)

| Token | Hex | SCSS Variable | CSS Variable | Usage |
|---|---|---|---|---|
| **BG Primary** | `#120022` | `$bg-primary` | `--color-bg-primary` | Page background, table body |
| **BG Secondary** | `#1e0038` | `$bg-secondary` | `--color-bg-secondary` | Sidebar, disabled input bg |
| **BG Tertiary** | `#2d0052` | `$bg-tertiary` | `--color-bg-tertiary` | Cards, input backgrounds, elevated surfaces |
| **BG Elevated** | `#3d006d` | `$bg-elevated` | `--color-bg-elevated` | Hover states, modals, dropdowns, table headers |

> **Dashboard Rule:** Use the elevation scale to create visual layers. Cards sit on `$bg-tertiary`,
> page background is `$bg-primary`, hover states lift to `$bg-elevated`.

#### Brand & Accent

| Token | Hex | SCSS Variable | CSS Variable | Usage |
|---|---|---|---|---|
| **Brand Purple** | `#3c0366` | `$brand-purple` | `--color-brand-purple` | Scrollbar thumb, "Concept Shared" status badge, brand identity |
| **Gold** | `#fcb700` | `$gold` | `--color-gold` | Primary CTAs, focus rings, headings, links, selected states, active icons |
| **Gold Light** | `#ffd54f` | `$gold-light` | `--color-gold-light` | Body text on dark, hover state for gold elements, secondary accent |

#### Semantic Colors

| Token | Hex | SCSS Variable | CSS Variable | Usage |
|---|---|---|---|---|
| **Success** | `#00BA7B` | `$success` | `--color-success` | Completed status, valid inputs, positive KPIs |
| **Warning** | `#FA9700` | `$warning` | `--color-warning` | Reviewing status, approaching limits, caution states |
| **Error** | `#ff4d6d` | `$error` | `--color-error` | Error borders, required badges, failed states, negative KPIs |
| **Info** | `#2A7EFF` | `$info` | `--color-info` | New status, informational badges, neutral data highlights |

#### Text Colors

| Token | Value | SCSS Variable | CSS Variable | Usage |
|---|---|---|---|---|
| **Text Primary** | `#ffd54f` (= `$gold-light`) | `$text-primary` | `--color-text-primary` | Primary body text, table cell values |
| **Text Secondary** | `rgba(255,213,79, 0.7)` | `$text-secondary` | `--color-text-secondary` | Secondary labels, table headers |
| **Text Muted** | `rgba(255,213,79, 0.5)` | `$text-muted` | `--color-text-muted` | Placeholders, disabled text, helper text, timestamps |

> **CRITICAL RULE:** Do NOT use white (`#fff`) text on dark backgrounds. The design system
> explicitly states: *"No white text on dark backgrounds — use gold, cream, or light purple."*
> All text-on-dark uses the gold scale.

#### Borders

| Token | Value | SCSS Variable | Usage |
|---|---|---|---|
| **Border Subtle** | `rgba(255,213,79, 0.2)` | `$border-subtle` / `$border-color` | Default borders for cards, inputs, table dividers |

#### Surface Aliases (For Component Code)

| Alias | Maps To | Usage |
|---|---|---|
| `$surface-dark` | `$bg-tertiary` (`#2d0052`) | Card/input backgrounds |
| `$surface-darker` | `$bg-elevated` (`#3d006d`) | Hover states, disabled states |

---

### 2.2 Typography

#### Font Family

```scss
$font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

- **Fredoka** is a variable font (weight range 400–600)
- Self-hosted as `.woff2` with subsets for Latin, Latin-Extended, and Hebrew
- `font-display: swap` for performance
- Antialiased rendering (`-webkit-font-smoothing: antialiased`)

> **Dashboard Rule:** Use Fredoka for everything — headings AND body. Do NOT introduce a second
> font for "data readability." The rounded character of Fredoka IS the brand.
>
> **Exception:** Monospace `'Courier New', Courier, monospace` is used for Order ID cells in tables
> (see `SubmissionsTable`). Use this for any code-like data (IDs, hashes, reference codes).

#### Font Size Scale

| Token | Size | SCSS | CSS Variable | Website Usage | Dashboard Usage |
|---|---|---|---|---|---|
| `$text-2xl` | 40px (2.5rem) | `$text-2xl` | `--text-2xl` | Page titles (h1) | Dashboard title, main KPI value |
| `$text-xl` | 30px (1.875rem) | `$text-xl` | `--text-xl` | Section titles (h2) | Section headings, large metric labels |
| `$text-lg` | 20px (1.25rem) | `$text-lg` | `--text-lg` | Card titles (h3), emphasis | Card titles, widget headers |
| `$text-base` | 18px (1.125rem) | `$text-base` | `--text-base` | Body text, input text | Form inputs, detail views, descriptions |
| `$text-sm` | 16px (1rem) | `$text-sm` | `--text-sm` | Helper text, captions | **Table body text**, labels, secondary info |
| `$text-xs` | 14px (0.875rem) | `$text-xs` | `--text-xs` | Badges, small labels | Badges, timestamps, chart axis labels |

> **Dashboard Density Tip:** For data tables, use `$text-sm` (16px) for cell values and `$text-xs`
> (14px) for column headers. This is denser than the website while remaining readable.

#### Font Weights

| Token | Weight | SCSS | CSS Variable | Usage |
|---|---|---|---|---|
| Regular | 400 | `$font-regular` | `--font-regular` | Body text, table cells |
| Medium | 500 | `$font-medium` | `--font-medium` | Buttons, labels, form labels, badge text |
| SemiBold | 600 | `$font-semibold` | `--font-semibold` | Headings (h1–h6), table headers, KPI values |

#### Line Heights

| Token | Value | SCSS | CSS Variable | Usage |
|---|---|---|---|---|
| Tight | 1.2 | `$leading-tight` | `--leading-tight` | Headings, badges, compact elements |
| Normal | 1.5 | `$leading-normal` | `--leading-normal` | Labels, form labels, general UI |
| Relaxed | 1.75 | `$leading-relaxed` | `--leading-relaxed` | Paragraphs, descriptions, notes |

#### Heading Rules

```scss
// From global.scss — ALL headings follow this:
h1, h2, h3, h4, h5, h6 {
  font-weight: $font-semibold;  // 600
  line-height: $leading-tight;  // 1.2
  color: $gold;                 // #fcb700 — NOT $text-primary
}
```

> **Key Insight:** Headings use `$gold` (#fcb700), while body text uses `$text-primary` / `$gold-light`
> (#ffd54f). This creates a deliberate contrast hierarchy. Maintain this in the dashboard.

---

### 2.3 Spacing Scale

| Token | Value | SCSS | CSS Variable | Usage |
|---|---|---|---|---|
| XS | 4px | `$space-xs` | `--space-xs` | Icon gaps, badge padding, tight stacking |
| SM | 8px | `$space-sm` | `--space-sm` | Input padding (block), small gaps, table cell padding (compact) |
| MD | 16px | `$space-md` | `--space-md` | Default spacing, input padding (inline), card padding (dashboard) |
| LG | 24px | `$space-lg` | `--space-lg` | Card padding (website), section padding, table cell padding (default) |
| XL | 32px | `$space-xl` | `--space-xl` | Large gaps, button padding (lg) |
| 2XL | 48px | `$space-2xl` | `--space-2xl` | Section margins, loading container padding |
| 3XL | 64px | `$space-3xl` | `--space-3xl` | Page-level section spacing |

> **Dashboard Rule:** Default card padding is `$space-md` (16px) to increase density. Use `$space-lg`
> (24px) only for summary/hero cards with large KPI numbers.

---

### 2.4 Border Radius

| Token | Value | SCSS | CSS Variable | Usage |
|---|---|---|---|---|
| SM | 8px | `$radius-sm` | `--radius-sm` | Badges, focus outlines on links, delete buttons, small controls |
| MD | 12px | `$radius-md` | `--radius-md` | **Buttons**, inputs, selects, icon buttons, tooltips, table wrapper, note cards |
| LG | 16px | `$radius-lg` | `--radius-lg` | **Cards**, modals, elevated surfaces (via `@include card-surface`) |
| XL | 24px | `$radius-xl` | `--radius-xl` | Large decorative containers (rare — use sparingly in dashboard) |
| Full | 9999px | `$radius-full` | `--radius-full` | Circular elements (avatar, round icon buttons, duration controls) |

> **Pattern:** Interactive controls = `$radius-md` (12px). Content containers = `$radius-lg` (16px).
> This creates a visual hierarchy where containers feel *softer* and controls feel *crisper*.

---

### 2.5 Shadows & Depth

| Token | Value | SCSS | CSS Variable | Usage |
|---|---|---|---|---|
| SM | `0 2px 8px rgba(0,0,0,0.35)` | `$shadow-sm` | `--shadow-sm` | Cards at rest, contact info cards |
| MD | `0 4px 20px rgba(0,0,0,0.45)` | `$shadow-md` | `--shadow-md` | Card hover states, tooltips, game option hover |
| LG | `0 8px 40px rgba(0,0,0,0.55)` | `$shadow-lg` | `--shadow-lg` | Modals, dropdowns, elevated surfaces |
| Glow | `0 0 25px rgba(252,183,0,0.25)` | `$shadow-glow` | `--shadow-glow` | Gold glow for primary button hover, selected game options, active toggle states |

**How depth is conveyed:**
- **At rest:** Cards use `$shadow-sm` — subtle, grounding.
- **On hover/interaction:** Lift to `$shadow-md` — noticeable but not dramatic.
- **Overlays (modals, dropdowns):** `$shadow-lg` — strong depth separation.
- **Special emphasis:** `$shadow-glow` — the gold glow is a SIGNATURE effect. Use on primary CTAs
  and selected/active states only. Never overuse it.

> **Dashboard Rule:** Data tables do NOT get shadows. They use `border: 1px solid $border-subtle`
> for containment. Only floating/overlay elements (dropdowns, modals, filter panels) get shadows.

---

### 2.6 Transitions & Animation

| Token | Value | SCSS | CSS Variable | Usage |
|---|---|---|---|---|
| Fast | `150ms ease` | `$transition-fast` | `--transition-fast` | Hover states, border-color, opacity, button transforms |
| Normal | `300ms ease` | `$transition-normal` | `--transition-normal` | Panel reveals, fade-in animations, smooth transitions |
| Slow | `500ms ease-out` | `$transition-slow` | `--transition-slow` | Page-level transitions, large content reveals |

#### Animation Keyframes Available

| Animation | Duration | Usage |
|---|---|---|
| `fadeIn` | 300ms | Panel/card appearance |
| `slideUp` | 300ms | Content entering from below |
| `scaleIn` | 300ms | Modal/tooltip appearance |
| `slideDown` | 150ms | Dropdown/accordion reveals |
| `pulse` | 2s infinite | Loading attention |
| `shimmer` | 1.5s infinite | Skeleton loading placeholders |
| `spin` | 1s infinite | Spinner/loader rotation |

#### Stagger Pattern for Lists

```scss
.animate-delay-1 { animation-delay: 50ms; }
.animate-delay-2 { animation-delay: 100ms; }
.animate-delay-3 { animation-delay: 150ms; }
.animate-delay-4 { animation-delay: 200ms; }
.animate-delay-5 { animation-delay: 250ms; }
```

#### Animation Tiers (Respect User Preference)

| Tier | Description | Can Be Disabled? |
|---|---|---|
| **Tier 1** | Focus rings, validation, loading spinners | NEVER — always active |
| **Tier 2** | Fade-ins, slide-ins, transforms | Yes — via `.animationsDisabled` on body |
| **Tier 3** | Game animations, complex transitions | Yes — via `.animationsDisabled` on body |

> **Dashboard Rule:** Use Tier 1 animations always. Use `fadeIn` for card loads. Skip slide/scale
> animations for repetitive data rows — only apply to initial page load.

---

## 3. Component Anatomy (Replication Instructions)

### 3.1 Buttons

The `Button` atom supports three variants, three sizes, and loading/disabled states.

#### Variants

| Variant | Background | Text Color | Border | Hover Effect | When to Use |
|---|---|---|---|---|---|
| **Primary** | `$gold` (#fcb700) | `$bg-primary` (#120022) | `$gold` | bg → `$gold-light`, + gold glow | Main CTAs: "Save", "Export", "Submit" |
| **Secondary** | `transparent` | `$gold` | `$gold` (2px solid) | bg → `rgba($gold, 0.1)`, border/text → `$gold-light` | Secondary actions: "Cancel", "Filter" |
| **Ghost** | `transparent` | `$gold-light` | `transparent` | bg → `rgba($gold, 0.1)`, text → `$gold` | Tertiary: "More", inline links, icon-text combos |

#### Sizes

| Size | Min Height | Min Width | Padding (inline) | Font Size |
|---|---|---|---|---|
| **SM** | 36px | 44px | `$space-md` (16px) | `$text-sm` (16px) |
| **MD** (default) | 44px | 44px | `$space-lg` (24px) | `$text-base` (18px) |
| **LG** | 52px | 52px | `$space-xl` (32px) | `$text-lg` (20px) |

> **44px min-width** is enforced on ALL sizes for WCAG touch target compliance.

#### Interaction States

```scss
// Base transitions applied to ALL variants:
transition: 
  background-color 150ms ease,
  border-color 150ms ease,
  opacity 150ms ease,
  transform 150ms ease,
  box-shadow 150ms ease;

// Hover (all variants):
&:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);  // Subtle lift
}

// Active (press):
&:active:not(:disabled) {
  transform: translateY(0);    // Snap back
}

// Focus (keyboard — A11Y CRITICAL):
&:focus-visible {
  outline: 2px solid $gold;
  outline-offset: 2px;
}

// Disabled:
opacity: 0.5;
cursor: not-allowed;
pointer-events: none;

// Loading:
opacity: 0.7;
pointer-events: none;
cursor: wait;
// Shows DiceLoader spinner + dimmed text
```

#### Dashboard-Specific Button Rule

For dashboard toolbars (filter bars, bulk actions), prefer the `SM` size with `secondary` or `ghost`
variants. Reserve `primary` + `MD`/`LG` for the 1–2 most important actions per page.

#### IconButton (Compact Icon-Only)

- Size MD: 40x40px, icon 20x20px
- Size SM: 36x36px, icon 18x18px
- Background: `rgba($gold-light, 0.1)`, border: `rgba($gold-light, 0.2)`
- Hover: bg opacity ↑, border opacity ↑, text → `$text-primary`
- Active/toggle state: bg → `rgba($gold, 0.3)`, border → `$gold`, glow shadow
- Active press: `transform: scale(0.95)`

#### ExpandableButton (Icon → Reveal Text on Hover)

Same styling pattern as IconButton, but label hidden by default with `max-width: 0; opacity: 0`.
On hover, animates to `max-width: 150px; opacity: 1` over 300ms. Great for toolbar actions in
dashboard where space is at a premium.

---

### 3.2 Cards / Containers

Two mixin patterns define how content is contained:

#### Standard Card (`@include card-surface`)

```scss
@mixin card-surface {
  background-color: $bg-tertiary;   // #2d0052
  border-radius: $radius-lg;         // 16px
  box-shadow: $shadow-md;            // 0 4px 20px rgba(0,0,0,0.45)
}
```

**Used for:** General content cards, game options, elevated panels.

#### ContactInfoCard Pattern (Recommended for Dashboard Cards)

```scss
.card {
  background: $bg-tertiary;           // #2d0052
  border: 1px solid $border-subtle;   // rgba(255,213,79, 0.2)
  border-radius: $radius-lg;          // 16px
  padding: $space-lg;                 // 24px
  box-shadow: $shadow-sm;             // 0 2px 8px rgba(0,0,0,0.35)
}
```

> **Dashboard Recommendation:** Use the ContactInfoCard pattern (border + lighter shadow) for
> dashboard data cards. The `card-surface` mixin with `$shadow-md` is too heavy for a page with
> 6–12 cards. Use `$shadow-sm` at rest, `$shadow-md` on hover.

#### Elevated Surface (`@include elevated-surface`)

```scss
@mixin elevated-surface {
  background-color: $bg-elevated;    // #3d006d
  border-radius: $radius-lg;         // 16px
  box-shadow: $shadow-lg;            // 0 8px 40px rgba(0,0,0,0.55)
}
```

**Used for:** Modals, dropdown menus, flyout panels.

#### NoteCard Pattern (Compact Data Row Card)

```scss
.noteCard {
  padding: $space-sm $space-md;           // 8px 16px — compact
  background: $surface-dark;              // = $bg-tertiary
  border: 1px solid $border-color;        // rgba(255,213,79, 0.2)
  border-radius: $radius-md;              // 12px — smaller than full cards
  transition: background-color 150ms, opacity 150ms, border-color 150ms;

  &:hover {
    background: $surface-darker;          // = $bg-elevated
    border-color: rgba($gold, 0.3);       // Brighter border on hover
  }
}
```

> **Dashboard Recommendation:** Use this pattern for individual items in lists — transactions,
> log entries, notifications. Compact padding with hover-to-elevate feedback.

---

### 3.3 Data Tables

The existing `SubmissionsTable` provides the canonical table pattern:

#### Table Wrapper

```scss
.tableWrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: $radius-md;                    // 12px
  border: 1px solid $border-subtle;             // Gold 20% opacity
}
```

#### Table Structure

```scss
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: $bg-primary;                      // #120022

  th, td {
    padding: $space-md $space-lg;               // 16px 24px
    text-align: start;                          // RTL-aware
    border-bottom: 1px solid $border-subtle;
  }

  th {
    font-weight: $font-semibold;                // 600
    font-size: $text-sm;                        // 16px
    color: $text-secondary;                     // Gold at 70%
    background: $bg-elevated;                   // #3d006d
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: sticky; top: 0; z-index: 1;       // Sticky headers
  }

  td {
    font-size: $text-base;                      // 18px
    color: $text-primary;                       // Gold-light
  }
}
```

#### Sortable Headers

- Cursor: pointer, user-select: none
- Hover: `background: rgba($gold, 0.05)`, sort icon → `$gold`
- Focus: `outline: 2px solid $gold; outline-offset: -2px`
- Active sort icon: `color: $gold`

#### Clickable Rows

```scss
.clickableRow {
  cursor: pointer;
  transition: background-color 200ms ease;
  &:hover { background: var(--bg-hover); }
  &:focus { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
}
```

#### Responsive Table

- Below `$md` (768px): `min-width: 700px` for horizontal scroll, reduced padding
- Below `$sm` (640px): font-size drops to `$text-sm`, padding shrinks to `$space-xs $space-sm`
- Order ID column is sticky-left on mobile

> **Dashboard Density Variant:** For the financial dashboard, consider reducing default `td` padding
> to `$space-sm $space-md` (8px 16px) and using `$text-sm` (16px) for all cell values.

---

### 3.4 Form Inputs

#### Base Input Atom

```scss
.input {
  width: 100%;
  min-height: 44px;                             // A11Y touch target
  padding: $space-sm $space-md;                 // 8px 16px
  font-family: $font-family;
  font-size: $text-base;                        // 18px
  color: $text-primary;                         // Gold-light
  background: $bg-tertiary;                     // #2d0052
  border: 1px solid $bg-elevated;               // #3d006d
  border-radius: $radius-md;                    // 12px
  transition: border-color 150ms, background-color 150ms, box-shadow 150ms;

  &::placeholder { color: $text-muted; }        // Gold at 50%

  &:hover:not(:disabled):not(:focus-visible) {
    border-color: rgba($gold, 0.5);
    background: rgba($bg-tertiary, 0.8);
  }

  &:focus-visible {
    outline: 2px solid $gold;
    outline-offset: 2px;
    border-color: $gold;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: $bg-secondary;
  }
}
```

#### Input States

| State | Border Color | Outline | Additional |
|---|---|---|---|
| **Default** | `$bg-elevated` (#3d006d) | None | — |
| **Hover** | `rgba($gold, 0.5)` | None | Background slightly transparent |
| **Focus** | `$gold` (#fcb700) | `2px solid $gold`, offset 2px | + `box-shadow: 0 0 0 3px rgba($gold, 0.15)` |
| **Error** | `$error` (#ff4d6d) | `2px solid $error` on focus | Red outline replaces gold |
| **Success** | `$success` (#00BA7B) | `2px solid $success` on focus | Green outline replaces gold |
| **Disabled** | inherited | None | opacity: 0.5, bg: `$bg-secondary` |

#### Select (Dropdown)

Same styling as Input, plus:
- `appearance: none` (hides native arrow)
- Custom arrow icon: `$text-muted` → `$gold` on hover/focus
- Right padding: 44px for arrow space (RTL-aware via `padding-inline-end`)
- Placeholder: first disabled option styled with `$text-muted`

#### Textarea (NoteInput)

Same base as Input, plus:
- `min-height: 80px; max-height: 200px`
- `resize: vertical`
- Focus uses `box-shadow: 0 0 0 2px rgba($gold, 0.2)` instead of outline

#### FormField Molecule (Label + Input + Helper/Error)

```scss
.formField {
  display: flex;
  flex-direction: column;
  gap: $space-xs;                               // 4px
  width: 100%;
  margin-bottom: $space-md;                     // 16px between fields
}

.label {
  font-size: $text-sm;                          // 16px
  font-weight: $font-medium;                    // 500
  color: $text-primary;
}

.helperText {
  font-size: $text-sm;                          // 16px
  color: $text-muted;
}

.errorText {
  font-size: $text-sm;                          // 16px
  color: $error;
  font-weight: $font-medium;
}

.charCounter {
  font-size: $text-xs;                          // 14px
  color: $text-muted;
  // Warning (90%+): color: $warning
  // Error (over limit): color: $error, weight: $font-semibold
}
```

#### SearchInput (With Icons)

- Search icon: positioned `inset-inline-start` (RTL-aware), `$text-muted`
- Clear button: 44x44px touch target, hover → `$gold` color + `rgba($gold, 0.1)` bg
- Loading spinner: `$gold` color, `spin` animation

---

### 3.5 Badges & Status Indicators

#### Base Badge

```scss
.badge {
  display: inline-flex;
  align-items: center;
  font-size: $text-xs;                          // 14px
  font-weight: $font-medium;                    // 500
  padding: $space-xs $space-sm;                 // 4px 8px
  border-radius: $radius-sm;                    // 8px
  line-height: $leading-tight;                  // 1.2
}
```

#### Badge Variants

| Variant | Background | Text Color | Usage |
|---|---|---|---|
| **Required** | `rgba($error, 0.2)` | `$error` | Required field indicator |
| **Optional** | `rgba($text-muted, 0.2)` | `$text-muted` | Optional field indicator |
| **Selected** | `rgba($gold, 0.2)` | `$gold` | Selection count, active filter |
| **Success** | `rgba($success, 0.2)` | `$success` | Completed, validated |
| **Warning** | `rgba($warning, 0.2)` | `$warning` | Needs attention |
| **Info** | `rgba($info, 0.2)` | `$info` | Informational |

#### StatusBadge (Workflow-Specific)

| Status | Background | Text Color |
|---|---|---|
| **New** | `rgba($info, 0.15)` | `$info` |
| **Reviewing** | `rgba($warning, 0.15)` | `$warning` |
| **Concept Shared** | `rgba($brand-purple, 0.15)` | `$brand-purple` |
| **In Production** | `rgba($gold, 0.15)` | `$gold` |
| **Completed** | `rgba($success, 0.15)` | `$success` |

> **Pattern:** All badge backgrounds use the semantic color at 15–20% opacity. Text uses the full
> semantic color. This creates a "pill" effect that is readable on dark backgrounds.

---

### 3.6 Tooltips

```scss
.tooltip {
  position: fixed;
  z-index: 9999;
  max-width: 280px;
  padding: $space-sm $space-md;                 // 8px 16px
  background: $bg-elevated;                     // #3d006d
  border: 1px solid rgba($gold, 0.3);
  border-radius: $radius-md;                    // 12px
  color: $text-primary;
  font-size: $text-sm;                          // 16px
  line-height: $leading-normal;                 // 1.5
  box-shadow: $shadow-md;
  animation: tooltipFadeIn 150ms ease-out;      // Scale 0.95 → 1 + fade
}
```

---

## 4. Accessibility Rules (Non-Negotiable)

These are baked into the design system. The dashboard MUST comply.

| Requirement | Implementation |
|---|---|
| **Focus Ring** | `outline: 2px solid $gold; outline-offset: 2px` on ALL interactive elements via `:focus-visible` |
| **Touch Targets** | Minimum 44x44px on ALL clickable/tappable elements (`min-width: 44px; min-height: 44px`) |
| **Color Contrast** | WCAG AA 4.5:1 minimum. Gold on dark = 11.2:1 (exceeds AAA). Never rely on color alone for meaning |
| **Reduced Motion** | `@media (prefers-reduced-motion: reduce)` disables all animations. Skeleton loaders use `.motion-essential` to stay active |
| **RTL Support** | Use CSS logical properties (`padding-inline-start`, `margin-inline-end`, `inset-inline-start`). Use `@include rtl { }` mixin for directional overrides |
| **Screen Reader** | `.sr-only` class for visually hidden labels. All form inputs have visible or sr-only labels |
| **High Contrast** | `@media (forced-colors: active)` ensures focus rings and borders remain visible in Windows High Contrast mode |
| **Keyboard Navigation** | All interactive elements reachable via Tab. Arrow key navigation for grids/lists via roving tabindex |

---

## 5. Mixins Reference (Use These)

| Mixin | Purpose | When to Use in Dashboard |
|---|---|---|
| `@include card-surface` | bg-tertiary + radius-lg + shadow-md | Summary/KPI cards |
| `@include elevated-surface` | bg-elevated + radius-lg + shadow-lg | Modals, filter dropdowns |
| `@include focus-ring` | 2px gold outline + 2px offset | Any custom interactive element |
| `@include interactive-reset` | Strip button/input defaults + add focus-ring | Custom clickable elements |
| `@include flex-center` | Flexbox center shorthand | Icon containers, empty states |
| `@include flex-column-center` | Flex column + center | Loading states, centered content |
| `@include truncate` | Ellipsis overflow | Table cells with long text |
| `@include line-clamp($lines)` | Multi-line truncate | Card descriptions |
| `@include smooth-transition($props)` | 300ms ease transition | General smooth transitions |
| `@include gold-glow` | Gold glow box-shadow | Selected/active primary elements |
| `@include visually-hidden` | SR-only hiding | Accessible labels |
| `@include motion-safe { }` | Only apply if no reduced-motion pref | Decorative animations |
| `@include md { }` | Desktop breakpoint (901px+) | Responsive dashboard layouts |
| `@include rtl { }` | RTL-specific overrides | Directional icon flips |

---

## 6. Breakpoints

| Name | Width | SCSS | Usage |
|---|---|---|---|
| **Mobile Max** | 900px | `$mobile-max` | **Primary breakpoint.** Below = mobile/tablet (touch). Above = desktop |
| SM | 640px | `$sm` | Large phones |
| MD | 768px | `$md` | Tablets (legacy compat) |
| LG | 1024px | `$lg` | Laptops |
| XL | 1280px | `$xl` | Large desktops |

> **Dashboard Rule:** The dashboard is desktop-first (internal tool). Design for `$lg` (1024px) as
> the minimum comfortable viewport. Use `$xl` (1280px) for multi-column dashboard grids. Provide
> basic responsive fallback at `$md` (768px) for tablet use, but don't optimize for phones.

---

## 7. Dashboard-Specific Component Recipes

These don't exist in the codebase yet — extrapolate from existing patterns:

### 7.1 KPI Summary Card

```scss
.kpiCard {
  background: $bg-tertiary;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  padding: $space-lg;
  box-shadow: $shadow-sm;

  .kpiLabel {
    font-size: $text-sm;
    font-weight: $font-medium;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .kpiValue {
    font-size: $text-2xl;
    font-weight: $font-semibold;
    color: $gold;
    line-height: $leading-tight;
  }

  .kpiChange {
    font-size: $text-xs;
    font-weight: $font-medium;
    // Positive: color: $success
    // Negative: color: $error
    // Neutral:  color: $text-muted
  }
}
```

### 7.2 Data Table (Dense Variant)

```scss
.denseTable {
  th, td {
    padding: $space-sm $space-md;               // 8px 16px (vs default 16px 24px)
  }

  td {
    font-size: $text-sm;                        // 16px (vs default 18px)
  }
}
```

### 7.3 Dashboard Sidebar Nav

```scss
.sidebarItem {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-md;
  border-radius: $radius-md;
  color: $text-secondary;
  font-size: $text-sm;
  font-weight: $font-medium;
  transition: background-color $transition-fast, color $transition-fast;

  &:hover {
    background: rgba($gold, 0.05);
    color: $text-primary;
  }

  &.active {
    background: rgba($gold, 0.1);
    color: $gold;
    font-weight: $font-semibold;
  }

  .icon { color: inherit; width: 20px; height: 20px; }
}
```

### 7.4 Filter Chip / Tag

```scss
.filterChip {
  display: inline-flex;
  align-items: center;
  gap: $space-xs;
  padding: $space-xs $space-sm;
  font-size: $text-xs;
  font-weight: $font-medium;
  border-radius: $radius-sm;
  border: 1px solid $border-subtle;
  color: $text-secondary;
  background: transparent;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba($gold, 0.4);
    color: $text-primary;
  }

  &.active {
    background: rgba($gold, 0.15);
    border-color: $gold;
    color: $gold;
  }

  .removeIcon {
    width: 14px; height: 14px;
    opacity: 0.6;
    &:hover { opacity: 1; color: $error; }
  }
}
```

---

## 8. Quick Reference Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  COLORS                                                         │
│  Page bg:     #120022        Heading text:    #fcb700 (gold)    │
│  Card bg:     #2d0052        Body text:       #ffd54f (gold-lt) │
│  Hover bg:    #3d006d        Muted text:      gold @ 50%        │
│  CTA bg:      #fcb700        Border:          gold @ 20%        │
│                                                                 │
│  TYPOGRAPHY                                                     │
│  Font:        Fredoka (400/500/600)                             │
│  Headings:    600 weight, 1.2 line-height, $gold color          │
│  Body:        400 weight, 1.5 line-height, $gold-light color    │
│  Labels:      500 weight, 16px, $text-primary                   │
│                                                                 │
│  RADIUS                                                         │
│  Cards:       16px    Inputs/Buttons: 12px    Badges: 8px       │
│                                                                 │
│  SHADOWS                                                        │
│  At rest:     0 2px 8px rgba(0,0,0,0.35)                       │
│  Hover:       0 4px 20px rgba(0,0,0,0.45)                      │
│  Modal:       0 8px 40px rgba(0,0,0,0.55)                      │
│  Gold glow:   0 0 25px rgba(252,183,0,0.25)   [CTAs only]      │
│                                                                 │
│  SPACING                                                        │
│  4 / 8 / 16 / 24 / 32 / 48 / 64                               │
│                                                                 │
│  TRANSITIONS                                                    │
│  Fast: 150ms ease   Normal: 300ms ease   Slow: 500ms ease-out  │
│                                                                 │
│  A11Y                                                           │
│  Focus ring:  2px solid #fcb700, offset 2px                     │
│  Touch target: 44x44px minimum                                  │
│  Text contrast: 11.2:1 (exceeds AAA)                            │
│  RTL: CSS logical properties                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

*Generated by Sally (🎨 UX Designer Agent) — extracted from TailorPlayed v3 codebase*
*Source files: `_variables.scss`, `global.scss`, `_mixins.scss`, `_animations.scss`, `_accessibility.scss`, `Button`, `Input`, `Select`, `FormField`, `Badge`, `StatusBadge`, `NoteCard`, `ContactInfoCard`, `SubmissionsTable`, `SortableHeader`, `SearchInput`, `NoteInput`, `IconButton`, `ExpandableButton`, `Tooltip`*
