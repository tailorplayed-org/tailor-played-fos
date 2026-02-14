# Story 7.3: Tax Jar Configuration & Osek Patur Alert

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to configure how the Tax Jar is calculated and be alerted when approaching the Osek Patur threshold,
so that I can set aside the right amount for taxes and plan for regulatory changes.

## Acceptance Criteria

1. **Given** `src/types/config.ts`, **When** the SystemConfig type is reviewed, **Then** it already includes: `taxMethod` (enum: flat | bracket), `flatRate` (number, default 0.35), `osPaturThresholdAgora` (integer, default 12000000 agora = ₪120,000), `currencyRates` (object: { ILS: number, USD: number, EUR: number }) **And** a new field `osPaturAlertPercent` (number, default 0.80) is added to make the alert threshold configurable.

2. **Given** the Firestore `system_config` collection, **When** accessed, **Then** a single document `'app'` holds all configuration **And** it is readable by authenticated users and writable by admin UIDs.

3. **Given** a settings section accessible from the Overhead page via a Phosphor GearSix icon, **When** Gal opens Tax Jar configuration, **Then** she sees: current method (flat / bracket) with toggle, flat rate input (default 35%, editable), and a preview showing "Current Tax Jar: ₪X,XXX" based on the selected method.

4. **Given** the flat tax method is selected, **When** Tax Jar is calculated, **Then** Tax Jar = Net Profit (current period) × flat rate **And** the calculation uses `calculateTaxReserve` from `src/lib/taxJar.ts` (already implemented).

5. **Given** the bracket tax method is selected, **When** Tax Jar is calculated, **Then** Israeli 2026 progressive brackets are applied: 10% (up to ₪86,220), 14% (₪86,221–₪123,740), 20% (₪123,741–₪198,640), 31% (₪198,641–₪276,010), 35% (₪276,011–₪574,290), 47% (₪574,291–₪739,600), 50% (above ₪739,600) **And** the bracket breakdown is shown to Gal for transparency.

6. **Given** Gal changes the tax method or rate, **When** she saves the configuration, **Then** the `system_config/app` document updates in Firestore **And** the Dashboard Tax Jar KPI recalculates immediately (real-time listener) **And** a success toast confirms: "Tax Jar settings updated".

7. **Given** annual revenue tracking, **When** total approved Revenue transactions for the current calendar year approach 80% of ₪120,000 (FR8), **Then** a persistent warning banner appears on the Dashboard: "Annual revenue at X% of Osek Patur threshold (₪120,000). Consider consulting your accountant about transitioning to Osek Murshe." **And** the warning uses `$warning` amber styling — informative, not alarming (per emotional design principles) **And** the banner is dismissible but reappears on next login if still above threshold.

8. **Given** annual revenue is below 80% of threshold, **When** the Dashboard loads, **Then** no Osek Patur warning is shown.

## Tasks / Subtasks

- [ ] Task 1: Extend SystemConfig schema + add calculateTaxBreakdown utility (AC: #1, #4, #5)
  - [ ] 1.1 Add `osPaturAlertPercent` field to `systemConfigSchema` in `src/types/config.ts` with default 0.80
  - [ ] 1.2 Add `calculateTaxBreakdown()` function to `src/lib/taxJar.ts` for bracket transparency display
  - [ ] 1.3 Add tests for `calculateTaxBreakdown` in `src/lib/taxJar.test.ts`
  - [ ] 1.4 Update `useDashboardData.ts` to use `osPaturAlertPercent` from config instead of hardcoded 0.8

- [ ] Task 2: Create TaxJarSettings component (AC: #3, #4, #5, #6)
  - [ ] 2.1 Create `src/features/overhead/components/TaxJarSettings.tsx` — method toggle, flat rate input, preview, bracket breakdown
  - [ ] 2.2 Create `src/features/overhead/components/TaxJarSettings.module.scss` — settings panel styles
  - [ ] 2.3 Create `src/features/overhead/components/TaxJarSettings.test.tsx` — component tests
  - [ ] 2.4 Update `src/features/overhead/components/index.ts` barrel export

- [ ] Task 3: Integrate TaxJarSettings into OverheadPage (AC: #3)
  - [ ] 3.1 Update `src/features/overhead/OverheadPage.tsx` — add GearSix icon toggle + TaxJarSettings section
  - [ ] 3.2 Update `src/features/overhead/OverheadPage.module.scss` — settings trigger icon styles
  - [ ] 3.3 Update `src/features/overhead/OverheadPage.test.tsx` — settings trigger tests

- [ ] Task 4: Create Osek Patur warning banner on Dashboard (AC: #7, #8)
  - [ ] 4.1 Create `src/features/dashboard/components/OsPaturBanner.tsx` — dismissible amber warning banner
  - [ ] 4.2 Create `src/features/dashboard/components/OsPaturBanner.module.scss` — banner styles
  - [ ] 4.3 Create `src/features/dashboard/components/OsPaturBanner.test.tsx` — banner tests
  - [ ] 4.4 Update `src/features/dashboard/DashboardPage.tsx` — render OsPaturBanner
  - [ ] 4.5 Update `src/features/dashboard/DashboardPage.test.tsx` — banner integration tests
  - [ ] 4.6 Update `src/features/dashboard/components/index.ts` barrel export

- [ ] Task 5: Add i18n keys (AC: #3, #6, #7)
  - [ ] 5.1 Add `settings.taxJar.*` + `dashboard.osPatur.*` keys to `src/i18n/en.json`
  - [ ] 5.2 Add Hebrew translations to `src/i18n/he.json`

## Dev Notes

### CRITICAL: What Already Exists — DO NOT RECREATE

Story 7.3 has **significant existing infrastructure** from previous epics. The developer MUST use these existing pieces and NOT recreate them:

| Component | Location | Status | Notes |
|---|---|---|---|
| `SystemConfig` type | `src/types/config.ts` | EXISTS | Has `taxMethod`, `flatRate`, `currencyRates`, `osPaturThresholdAgora` |
| `systemConfigSchema` | `src/types/config.ts` | EXISTS | Zod schema — only ADD `osPaturAlertPercent`, do NOT rewrite |
| `calculateTaxReserve()` | `src/lib/taxJar.ts` | EXISTS | Supports flat + bracket modes with Israeli 2026 brackets |
| `ISRAELI_TAX_BRACKETS` | `src/lib/taxJar.ts` | EXISTS | Array of bracket definitions (already 2026 CPI-adjusted) |
| `useSystemConfigStore` | `src/stores/useSystemConfigStore.ts` | EXISTS | Zustand store with `config`, `loading`, `error`, setters |
| `useFirestoreDoc` | `src/hooks/useFirestoreDoc.ts` | EXISTS | Real-time single document listener |
| `useFirestoreCollection` | `src/hooks/useFirestoreCollection.ts` | EXISTS | Real-time collection listener |
| Dashboard subscription | `src/features/dashboard/hooks/useDashboardData.ts` | EXISTS | Already subscribes to `system_config/app` via `useFirestoreDoc` |
| Tax Jar KPI computation | `useDashboardData.ts` lines ~92-97 | EXISTS | `calculateTaxReserve(netProfitAgora, taxMethod, flatRate)` |
| `osPaturWarning` computation | `useDashboardData.ts` lines ~129-132 | EXISTS | `annualRevenueEstimate >= threshold * 0.8` — make configurable |
| Tax Jar KPI card | `DashboardPage.tsx` | EXISTS | `KpiCard` with label "Tax Jar" and subtitle |
| Types barrel | `src/types/index.ts` | EXISTS | Already exports `* from './config'` |
| Stores barrel | `src/stores/index.ts` | EXISTS | Already exports `* from './useSystemConfigStore'` |
| Lib barrel | `src/lib/index.ts` | EXISTS | Already exports `* from './taxJar'` |
| Hooks barrel | `src/hooks/index.ts` | EXISTS | Already exports `useFirestoreDoc` |

### Task 1: Extend SystemConfig Schema + Add calculateTaxBreakdown

#### 1.1 — Update `src/types/config.ts`

Add `osPaturAlertPercent` to the existing schema. Do NOT change any existing fields.

```typescript
export const systemConfigSchema = z.object({
  taxMethod: z.enum(['flat', 'bracket']),
  flatRate: z.number().min(0).max(1),
  currencyRates: z.object({
    ILS: z.number(),
    USD: z.number(),
    EUR: z.number(),
  }),
  osPaturThresholdAgora: z.number().int(),
  osPaturAlertPercent: z.number().min(0).max(1).default(0.80),
});
```

**CRITICAL:** Use `.default(0.80)` so existing Firestore documents without this field parse correctly. Zod v4 `.default()` provides the value when the field is `undefined`.

#### 1.2 — Add `calculateTaxBreakdown()` to `src/lib/taxJar.ts`

This function provides the bracket-by-bracket breakdown for the transparency display (AC #5).

```typescript
export interface TaxBracketRow {
  label: string;         // "10% (up to ₪86,220)"
  rate: number;          // 0.10
  taxableAgora: number;  // Amount taxable in this bracket
  taxAgora: number;      // Tax for this bracket
}

export interface TaxBreakdown {
  method: 'flat' | 'bracket';
  totalTaxAgora: number;
  rows: TaxBracketRow[];
}

/**
 * Calculate tax breakdown for display. Returns per-bracket contributions.
 * For flat mode: single row. For bracket mode: Israeli progressive brackets.
 * Uses MONTHLY net profit as input (same as calculateTaxReserve).
 */
export function calculateTaxBreakdown(
  netProfitAgora: number,
  method: 'flat' | 'bracket',
  flatRate: number = 0.35,
): TaxBreakdown {
  if (netProfitAgora <= 0) {
    return { method, totalTaxAgora: 0, rows: [] };
  }

  if (method === 'flat') {
    const tax = Math.round(netProfitAgora * flatRate);
    return {
      method,
      totalTaxAgora: tax,
      rows: [{ label: `${Math.round(flatRate * 100)}%`, rate: flatRate, taxableAgora: netProfitAgora, taxAgora: tax }],
    };
  }

  // Bracket mode
  const annualizedAgora = netProfitAgora * 12;
  const rows: TaxBracketRow[] = [];
  let remaining = annualizedAgora;
  let prevCeiling = 0;
  let totalAnnualTax = 0;

  for (const bracket of ISRAELI_TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = bracket.upToAgora === Infinity
      ? remaining
      : bracket.upToAgora - prevCeiling;
    const taxableInBracket = Math.min(remaining, bracketSize);
    const bracketTax = Math.round(taxableInBracket * bracket.rate);
    totalAnnualTax += bracketTax;

    const upperLabel = bracket.upToAgora === Infinity
      ? '+'
      : `₪${(bracket.upToAgora / 100).toLocaleString()}`;
    const lowerLabel = `₪${((prevCeiling + 1) / 100).toLocaleString()}`;
    rows.push({
      label: bracket.upToAgora === Infinity
        ? `${Math.round(bracket.rate * 100)}% (above ${lowerLabel})`
        : `${Math.round(bracket.rate * 100)}% (${lowerLabel} – ${upperLabel})`,
      rate: bracket.rate,
      taxableAgora: taxableInBracket,
      taxAgora: bracketTax,
    });

    remaining -= taxableInBracket;
    prevCeiling = bracket.upToAgora;
  }

  return {
    method,
    totalTaxAgora: Math.round(totalAnnualTax / 12), // Monthly equivalent
    rows,
  };
}
```

**CRITICAL:**
- Must export `ISRAELI_TAX_BRACKETS` from the module so `calculateTaxBreakdown` can access it. Currently `ISRAELI_TAX_BRACKETS` is a `const` (not exported). Either export it, or keep it module-scoped and add `calculateTaxBreakdown` in the same file (preferred — keeps brackets internal).
- The function MUST live in the same file as `ISRAELI_TAX_BRACKETS` since it uses the same bracket definitions.
- Bracket labels use `₪` for display. The formatCurrency utility from `src/lib/currency.ts` can also be used for amounts.

#### 1.3 — Tests for `calculateTaxBreakdown` in `src/lib/taxJar.test.ts`

Create a NEW test file (tests are co-located):

1. `calculateTaxBreakdown` — returns empty rows for zero/negative net profit
2. `calculateTaxBreakdown` flat — single row with correct rate and amount
3. `calculateTaxBreakdown` flat — respects custom flat rate
4. `calculateTaxBreakdown` bracket — returns multiple bracket rows
5. `calculateTaxBreakdown` bracket — total matches `calculateTaxReserve()` output
6. `calculateTaxBreakdown` bracket — only includes brackets with taxable amounts
7. `calculateTaxBreakdown` — monthly total matches `calculateTaxReserve` (cross-check)

#### 1.4 — Update `useDashboardData.ts` — configurable alert percent

**Replace:**
```typescript
const osPaturWarning = annualRevenueEstimate >= threshold * 0.8;
```

**With:**
```typescript
const alertPercent = configStore.config?.osPaturAlertPercent ?? 0.80;
const osPaturWarning = annualRevenueEstimate >= threshold * alertPercent;
```

**Also add** `osPaturPercent` to the returned metrics for the banner to display:
```typescript
// Add to the returned metrics object:
osPaturPercent: threshold > 0 ? Math.round((annualRevenueEstimate / threshold) * 100) : 0,
osPaturThresholdAgora: threshold,
```

**Update `useDashboardData` return type/destructuring** to include `osPaturWarning`, `osPaturPercent`, and `osPaturThresholdAgora`.

### Task 2: TaxJarSettings Component

#### 2.1 — `src/features/overhead/components/TaxJarSettings.tsx`

This is the core settings UI. Key design decisions:

**Data sources:**
- `useSystemConfigStore` — current saved config (taxMethod, flatRate)
- `calculateTaxReserve` + `calculateTaxBreakdown` — for preview
- Net profit for preview: accept as a prop `currentNetProfitAgora: number | null`

**Local state for unsaved changes:**
```typescript
const [localMethod, setLocalMethod] = useState<'flat' | 'bracket'>('flat');
const [localRate, setLocalRate] = useState(35); // Display as percentage (integer)
const [saving, setSaving] = useState(false);
```

Initialize local state from store config on mount:
```typescript
useEffect(() => {
  if (configStore.config) {
    setLocalMethod(configStore.config.taxMethod);
    setLocalRate(Math.round(configStore.config.flatRate * 100));
  }
}, [configStore.config]);
```

**Preview computation:**
```typescript
const previewTaxAgora = useMemo(() => {
  if (currentNetProfitAgora == null || currentNetProfitAgora <= 0) return null;
  return calculateTaxReserve(currentNetProfitAgora, localMethod, localRate / 100);
}, [currentNetProfitAgora, localMethod, localRate]);

const breakdown = useMemo(() => {
  if (currentNetProfitAgora == null || currentNetProfitAgora <= 0) return null;
  return calculateTaxBreakdown(currentNetProfitAgora, localMethod, localRate / 100);
}, [currentNetProfitAgora, localMethod, localRate]);
```

**Save handler:**
```typescript
const handleSave = useCallback(async () => {
  setSaving(true);
  try {
    const docRef = doc(db, 'system_config', 'app');
    await setDoc(docRef, {
      taxMethod: localMethod,
      flatRate: localRate / 100,
    }, { merge: true }); // CRITICAL: merge: true to preserve other fields
    toast.success(t('settings.taxJar.saveSuccess'));
  } catch {
    toast.error(t('settings.taxJar.saveError'));
  } finally {
    setSaving(false);
  }
}, [localMethod, localRate, t]);
```

**CRITICAL Firestore write pattern:**
- Use `setDoc` with `{ merge: true }` — NOT `updateDoc` — because the document may not exist yet (first-time setup).
- Only write `taxMethod` and `flatRate` — do NOT overwrite `currencyRates`, `osPaturThresholdAgora`, or `osPaturAlertPercent`.
- Import: `import { doc, setDoc } from 'firebase/firestore';`
- Import: `import { db } from '@/services';`

**Component props interface:**
```typescript
interface TaxJarSettingsProps {
  currentNetProfitAgora: number | null;
  onClose: () => void;
}
```

**JSX structure:**
```tsx
<div className={styles.settingsPanel}>
  <div className={styles.settingsHeader}>
    <h3>{t('settings.taxJar.title')}</h3>
    <button onClick={onClose} className={styles.closeButton} aria-label={t('actions.cancel')}>
      <X size={20} />
    </button>
  </div>

  {/* Method Toggle */}
  <div className={styles.methodToggle}>
    <span className={styles.toggleLabel}>{t('settings.taxJar.method')}</span>
    <div className={styles.toggleGroup} role="radiogroup" aria-label={t('settings.taxJar.method')}>
      <button
        role="radio"
        aria-checked={localMethod === 'flat'}
        className={`${styles.toggleOption} ${localMethod === 'flat' ? styles.toggleActive : ''}`}
        onClick={() => setLocalMethod('flat')}
      >
        {t('settings.taxJar.flat')}
      </button>
      <button
        role="radio"
        aria-checked={localMethod === 'bracket'}
        className={`${styles.toggleOption} ${localMethod === 'bracket' ? styles.toggleActive : ''}`}
        onClick={() => setLocalMethod('bracket')}
      >
        {t('settings.taxJar.bracket')}
      </button>
    </div>
  </div>

  {/* Flat Rate Input — only shown in flat mode */}
  {localMethod === 'flat' && (
    <div className={styles.rateInput}>
      <label htmlFor="flat-rate">{t('settings.taxJar.flatRateLabel')}</label>
      <div className={styles.rateInputWrap}>
        <input
          id="flat-rate"
          type="number"
          min={1}
          max={100}
          value={localRate}
          onChange={(e) => setLocalRate(Math.min(100, Math.max(1, Number(e.target.value))))}
          className={styles.rateField}
        />
        <span className={styles.rateSuffix}>%</span>
      </div>
    </div>
  )}

  {/* Preview */}
  <div className={styles.preview}>
    <span className={styles.previewLabel}>{t('settings.taxJar.preview')}</span>
    <span className={styles.previewAmount}>
      {previewTaxAgora != null ? formatCurrency(previewTaxAgora) : '—'}
    </span>
    {localMethod === 'flat' && (
      <span className={styles.previewHint}>
        {t('settings.taxJar.flatHint', { rate: String(localRate) })}
      </span>
    )}
  </div>

  {/* Bracket Breakdown — only shown in bracket mode */}
  {localMethod === 'bracket' && breakdown && breakdown.rows.length > 0 && (
    <div className={styles.bracketBreakdown}>
      <h4 className={styles.breakdownTitle}>{t('settings.taxJar.bracketBreakdown')}</h4>
      <table className={styles.bracketTable}>
        <thead>
          <tr>
            <th>{t('settings.taxJar.bracketRange')}</th>
            <th>{t('settings.taxJar.bracketTax')}</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.rows.map((row, i) => (
            <tr key={i}>
              <td>{row.label}</td>
              <td>{formatCurrency(row.taxAgora)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.breakdownTotal}>
        {t('settings.taxJar.monthlyReserve')}: {formatCurrency(breakdown.totalTaxAgora)}
      </div>
    </div>
  )}

  {/* Save Button */}
  <Button onClick={handleSave} disabled={saving}>
    {saving ? t('settings.taxJar.saving') : t('settings.taxJar.save')}
  </Button>
</div>
```

**Phosphor icons used:** `X` (close button) — import `import { X } from '@phosphor-icons/react';`

#### 2.2 — `src/features/overhead/components/TaxJarSettings.module.scss`

```scss
.settingsPanel {
  @include card-surface;
  padding: $space-lg;
  display: flex;
  flex-direction: column;
  gap: $space-md;
  margin-block-end: $space-lg;
}

.settingsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: $text-lg;
    font-weight: $font-semibold;
    color: $text-primary;
    margin: 0;
  }
}

.closeButton {
  @include interactive-reset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $radius-full;
  color: $text-muted;
  transition: background-color $transition-fast, color $transition-fast;

  &:hover {
    background: $bg-elevated;
    color: $text-primary;
  }
}

.methodToggle {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.toggleLabel {
  font-size: $text-sm;
  color: $text-secondary;
  font-weight: $font-medium;
}

.toggleGroup {
  display: flex;
  gap: 0;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid $border-subtle;
}

.toggleOption {
  @include interactive-reset;
  flex: 1;
  padding: $space-sm $space-md;
  font-size: $text-sm;
  font-weight: $font-medium;
  text-align: center;
  background: $bg-secondary;
  color: $text-muted;
  transition: background-color $transition-fast, color $transition-fast;
  min-height: 44px; // Touch target

  &:not(:last-child) {
    border-inline-end: 1px solid $border-subtle;
  }
}

.toggleActive {
  background: $gold;
  color: $bg-primary;
}

.rateInput {
  display: flex;
  flex-direction: column;
  gap: $space-xs;

  label {
    font-size: $text-sm;
    color: $text-secondary;
    font-weight: $font-medium;
  }
}

.rateInputWrap {
  display: flex;
  align-items: center;
  gap: $space-xs;
}

.rateField {
  width: 80px;
  padding: $space-sm;
  font-size: $text-base;
  font-family: $font-family;
  background: $bg-secondary;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  color: $text-primary;
  text-align: center;
  min-height: 44px; // Touch target

  &:focus {
    @include focus-ring;
  }
}

.rateSuffix {
  font-size: $text-lg;
  color: $text-secondary;
  font-weight: $font-medium;
}

.preview {
  @include elevated-surface;
  padding: $space-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-xs;
  text-align: center;
}

.previewLabel {
  font-size: $text-sm;
  color: $text-secondary;
}

.previewAmount {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gold;
}

.previewHint {
  font-size: $text-xs;
  color: $text-muted;
}

.bracketBreakdown {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.breakdownTitle {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $text-primary;
  margin: 0;
}

.bracketTable {
  width: 100%;
  border-collapse: collapse;
  font-size: $text-xs;

  th {
    text-align: start;
    padding: $space-xs $space-sm;
    color: $text-muted;
    font-weight: $font-medium;
    border-block-end: 1px solid $border-subtle;
  }

  td {
    padding: $space-xs $space-sm;
    color: $text-secondary;
    border-block-end: 1px solid rgba($border-subtle, 0.3);
  }

  // Last column right-aligned for amounts
  th:last-child,
  td:last-child {
    text-align: end;
  }
}

.breakdownTotal {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $gold;
  text-align: end;
  padding-block-start: $space-xs;
  border-block-start: 1px solid $border-subtle;
}

@media (max-width: $bp-sm) {
  .settingsPanel {
    padding: $space-md;
  }

  .bracketTable {
    font-size: $text-xs;

    th, td {
      padding: $space-xs;
    }
  }
}
```

**CRITICAL SCSS notes (from Story 7.1 and 7.2 learnings):**
- Use `$error` for red — `$danger` does NOT exist
- Use `$success` for green (verified: exists in `_variables.scss` as `#00ba7b`)
- Use `$warning` for amber (verified: exists as `#fa9700`)
- CSS logical properties for RTL: `text-align: start` not `text-align: left`, `margin-block-end` not `margin-bottom`, `padding-inline-end` not `padding-right`
- Touch targets ≥ 44px on mobile
- No explicit `@use` statements — globals auto-imported via Vite `additionalData`
- Font-size tokens: `$text-lg` NOT `$font-lg`
- `$surface-secondary` does NOT exist — use `$bg-secondary` or `$bg-tertiary`
- Mixins available: `@include card-surface`, `@include elevated-surface`, `@include focus-ring`, `@include interactive-reset`

#### 2.3 — TaxJarSettings Tests

**Test scenarios for `src/features/overhead/components/TaxJarSettings.test.tsx`:**

1. Renders method toggle with flat/bracket options
2. Initializes from store config (flat mode, 35%)
3. Switches method toggle from flat to bracket
4. Shows flat rate input only in flat mode
5. Hides flat rate input in bracket mode
6. Shows bracket breakdown table in bracket mode
7. Shows preview amount based on current settings
8. Shows "—" when no net profit provided
9. Clamps rate input between 1 and 100
10. Calls setDoc with merge:true on save
11. Shows success toast on successful save
12. Shows error toast on failed save

**Mock pattern:**
```typescript
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
}));
vi.mock('@/services', () => ({
  db: {},
}));
vi.mock('@/stores', () => ({
  useSystemConfigStore: vi.fn(),
}));
```

#### 2.4 — Update barrel export

Add to `src/features/overhead/components/index.ts`:
```typescript
export { TaxJarSettings } from './TaxJarSettings';
```

### Task 3: Integrate into OverheadPage

#### 3.1 — Update `src/features/overhead/OverheadPage.tsx`

**New imports:**
```typescript
import { GearSix } from '@phosphor-icons/react';
import { useTransactionStore, useSystemConfigStore } from '@/stores';
import { toIlsAgora, calculateTaxReserve } from '@/lib';
import { TaxJarSettings } from './components';
```

**New state:**
```typescript
const [showSettings, setShowSettings] = useState(false);
```

**Net profit computation for TaxJarSettings preview:**
```typescript
// Compute net profit for Tax Jar preview
const txnStore = useTransactionStore();
const configStore = useSystemConfigStore();

const currentNetProfitAgora = useMemo(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const rates = configStore.config?.currencyRates;

  const approved = txnStore.transactions.filter((t) => t.status === 'approved');
  const currentMonthApproved = approved.filter(
    (t) => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear,
  );

  const revenue = currentMonthApproved
    .filter((t) => t.category === 'Revenue')
    .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
  const costs = currentMonthApproved
    .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
    .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);

  return revenue - costs;
}, [txnStore.transactions, configStore.config]);
```

**IMPORTANT:** The transaction store may be empty if the user navigated directly to `/overhead` without visiting the Dashboard first. In that case, `currentNetProfitAgora` will be 0, and the preview will show "—". This is acceptable — the store gets populated once the user visits any page that subscribes to transactions. For robustness, the TaxJarSettings preview should handle `null | 0` gracefully.

**ALTERNATIVE (preferred):** Subscribe to transactions in OverheadPage only when settings panel is open:

```typescript
// Only subscribe when settings panel is open (lazy loading)
useFirestoreCollection(
  showSettings ? 'transactions' : '__noop__', // Skip subscription if not showing settings
  transactionSchema,
  {
    onData: txnStore.setTransactions,
    onError: txnStore.setError,
    onLoading: txnStore.setLoading,
  },
);
```

**NOTE:** The `__noop__` pattern may not work with `useFirestoreCollection`. If it doesn't, consider conditionally rendering TaxJarSettings (which internally subscribes). Or simply read from the store unconditionally — since Dashboard is the landing page, transactions will almost always be populated.

**Simplest approach (recommended):** Just read from `txnStore.transactions`. If empty, pass `null` as `currentNetProfitAgora`. The preview shows "—".

**Updated header JSX:**
```tsx
<div className={styles.header}>
  <h1 className={styles.pageTitle}>{t('overhead.pageTitle')}</h1>
  <div className={styles.headerActions}>
    <button
      onClick={() => setShowSettings((prev) => !prev)}
      className={styles.settingsButton}
      aria-label={t('settings.taxJar.title')}
      aria-expanded={showSettings}
    >
      <GearSix size={22} weight={showSettings ? 'fill' : 'regular'} />
    </button>
    <Button onClick={() => setFormMode({ type: 'create' })}>
      <Plus size={18} weight="bold" />
      {t('overhead.addButton')}
    </Button>
  </div>
</div>

{showSettings && (
  <TaxJarSettings
    currentNetProfitAgora={currentNetProfitAgora > 0 ? currentNetProfitAgora : null}
    onClose={() => setShowSettings(false)}
  />
)}
```

#### 3.2 — OverheadPage SCSS additions

```scss
.headerActions {
  display: flex;
  align-items: center;
  gap: $space-sm;
}

.settingsButton {
  @include interactive-reset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: $radius-full;
  color: $text-secondary;
  transition: background-color $transition-fast, color $transition-fast;

  &:hover {
    background: $bg-tertiary;
    color: $gold;
  }

  &[aria-expanded="true"] {
    color: $gold;
    background: $bg-tertiary;
  }
}
```

### Task 4: Osek Patur Warning Banner

#### 4.1 — `src/features/dashboard/components/OsPaturBanner.tsx`

```typescript
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle, X } from '@phosphor-icons/react';
import { formatCurrency } from '@/lib';
import styles from './OsPaturBanner.module.scss';

const DISMISS_KEY = 'osPaturBannerDismissed';

interface OsPaturBannerProps {
  osPaturPercent: number;
  thresholdAgora: number;
}

export function OsPaturBanner({ osPaturPercent, thresholdAgora }: OsPaturBannerProps) {
  const { t } = useTranslation();

  // Dismiss with sessionStorage — reappears on next login/session
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // sessionStorage may be unavailable in some contexts
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className={styles.banner} role="alert">
      <WarningCircle size={24} weight="fill" className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.message}>
          {t('dashboard.osPatur.warning', {
            percent: String(osPaturPercent),
            threshold: formatCurrency(thresholdAgora, 'ILS'),
          })}
        </p>
        <p className={styles.advice}>{t('dashboard.osPatur.advice')}</p>
      </div>
      <button
        onClick={handleDismiss}
        className={styles.dismiss}
        aria-label={t('dashboard.osPatur.dismiss')}
      >
        <X size={18} />
      </button>
    </div>
  );
}
```

**CRITICAL design decisions:**
- Uses `sessionStorage` (not `localStorage`) so the banner reappears on next browser session/login (per AC: "reappears on next login")
- `role="alert"` for accessibility
- Uses `$warning` amber styling — "informative, not alarming" per UX emotional design principles
- The banner contains: percentage of threshold reached, the threshold amount, and advice text

#### 4.2 — `src/features/dashboard/components/OsPaturBanner.module.scss`

```scss
.banner {
  display: flex;
  align-items: flex-start;
  gap: $space-md;
  padding: $space-md $space-lg;
  background: rgba($warning, 0.12);
  border: 1px solid rgba($warning, 0.3);
  border-radius: $radius-md;
  margin-block-end: $space-lg;
}

.icon {
  color: $warning;
  flex-shrink: 0;
  margin-block-start: 2px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-xs;
}

.message {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $warning;
  margin: 0;
}

.advice {
  font-size: $text-xs;
  color: $text-muted;
  margin: 0;
}

.dismiss {
  @include interactive-reset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: $radius-full;
  color: $text-muted;
  flex-shrink: 0;
  transition: background-color $transition-fast, color $transition-fast;

  &:hover {
    background: rgba($warning, 0.2);
    color: $warning;
  }
}

@media (max-width: $bp-sm) {
  .banner {
    padding: $space-sm $space-md;
    gap: $space-sm;
  }
}
```

#### 4.3 — OsPaturBanner Tests

**Test scenarios for `src/features/dashboard/components/OsPaturBanner.test.tsx`:**

1. Renders banner with correct warning message and percentage
2. Renders with the formatted threshold amount
3. Has role="alert" for accessibility
4. Dismiss button hides the banner
5. Dismissed state persists via sessionStorage
6. Reappears when sessionStorage is cleared (simulating new session)
7. Handles sessionStorage unavailability gracefully

#### 4.4 — Update `src/features/dashboard/DashboardPage.tsx`

**New imports:**
```typescript
import { OsPaturBanner } from './components';
```

**Update destructuring from useDashboardData:**
```typescript
const {
  // ... existing fields ...
  osPaturWarning,
  osPaturPercent,
  osPaturThresholdAgora,
} = useDashboardData();
```

**Add banner above KPI cards:**
```tsx
{osPaturWarning && (
  <OsPaturBanner
    osPaturPercent={osPaturPercent}
    thresholdAgora={osPaturThresholdAgora}
  />
)}
```

Place it inside the page div, before the HeroStat or between HeroStat and KPI row.

#### 4.5 — Dashboard Test Updates

Add to `src/features/dashboard/DashboardPage.test.tsx`:

1. Shows OsPaturBanner when `osPaturWarning` is true
2. Hides OsPaturBanner when `osPaturWarning` is false
3. Banner shows correct percentage

#### 4.6 — Update barrel export

Add to `src/features/dashboard/components/index.ts`:
```typescript
export { OsPaturBanner } from './OsPaturBanner';
```

### Task 5: i18n Keys

#### 5.1 — English (`en.json`)

Add `settings` top-level key and `dashboard.osPatur` sub-key:

```json
"settings": {
  "taxJar": {
    "title": "Tax Jar Settings",
    "method": "Calculation Method",
    "flat": "Flat Rate",
    "bracket": "Progressive Brackets",
    "flatRateLabel": "Tax Rate",
    "flatHint": "{{rate}}% of monthly net profit",
    "preview": "Current Tax Jar",
    "bracketBreakdown": "Bracket Breakdown (Annual)",
    "bracketRange": "Bracket",
    "bracketTax": "Tax",
    "monthlyReserve": "Monthly Reserve",
    "save": "Save Settings",
    "saving": "Saving...",
    "saveSuccess": "Tax Jar settings updated",
    "saveError": "Failed to update settings"
  }
}
```

Add inside existing `dashboard` key:
```json
"osPatur": {
  "warning": "Annual revenue at {{percent}}% of Osek Patur threshold ({{threshold}}). Consider consulting your accountant about transitioning to Osek Murshe.",
  "advice": "Exceeding the threshold changes your tax obligations significantly.",
  "dismiss": "Dismiss warning"
}
```

#### 5.2 — Hebrew (`he.json`)

```json
"settings": {
  "taxJar": {
    "title": "הגדרות צנצנת מס",
    "method": "שיטת חישוב",
    "flat": "שיעור קבוע",
    "bracket": "מדרגות מס",
    "flatRateLabel": "שיעור מס",
    "flatHint": "{{rate}}% מהרווח הנקי החודשי",
    "preview": "צנצנת מס נוכחית",
    "bracketBreakdown": "פירוט מדרגות (שנתי)",
    "bracketRange": "מדרגה",
    "bracketTax": "מס",
    "monthlyReserve": "הפרשה חודשית",
    "save": "שמור הגדרות",
    "saving": "שומר...",
    "saveSuccess": "הגדרות צנצנת המס עודכנו",
    "saveError": "שגיאה בעדכון ההגדרות"
  }
}
```

Add inside existing `dashboard` key:
```json
"osPatur": {
  "warning": "הכנסות שנתיות ב-{{percent}}% מסף עוסק פטור ({{threshold}}). מומלץ להתייעץ עם רואה החשבון לגבי מעבר לעוסק מורשה.",
  "advice": "חריגה מהסף משנה את חובות המס שלך באופן משמעותי.",
  "dismiss": "סגור התרעה"
}
```

### Project Structure Notes

**Files to CREATE (7 new files):**
```
src/features/overhead/components/TaxJarSettings.tsx           # Tax Jar settings UI
src/features/overhead/components/TaxJarSettings.module.scss   # Settings panel styles
src/features/overhead/components/TaxJarSettings.test.tsx      # Settings component tests
src/features/dashboard/components/OsPaturBanner.tsx           # Osek Patur warning banner
src/features/dashboard/components/OsPaturBanner.module.scss   # Banner styles
src/features/dashboard/components/OsPaturBanner.test.tsx      # Banner tests
src/lib/taxJar.test.ts                                        # calculateTaxBreakdown tests
```

**Files to MODIFY (10 files):**
```
src/types/config.ts                                           # Add osPaturAlertPercent
src/lib/taxJar.ts                                             # Add calculateTaxBreakdown + types
src/features/overhead/OverheadPage.tsx                        # Add GearSix settings trigger + TaxJarSettings
src/features/overhead/OverheadPage.module.scss                # Add settings button styles
src/features/overhead/OverheadPage.test.tsx                   # Add settings trigger tests
src/features/overhead/components/index.ts                     # Export TaxJarSettings
src/features/dashboard/DashboardPage.tsx                      # Add OsPaturBanner
src/features/dashboard/DashboardPage.test.tsx                 # Add banner tests
src/features/dashboard/hooks/useDashboardData.ts              # Configurable alert percent + return osPaturPercent
src/features/dashboard/components/index.ts                    # Export OsPaturBanner
src/i18n/en.json                                              # Add settings + osPatur keys
src/i18n/he.json                                              # Add Hebrew translations
```

**Files that must NOT be modified:**
- `src/stores/useSystemConfigStore.ts` — store is unchanged, already has all needed fields
- `src/stores/index.ts` — already exports useSystemConfigStore
- `src/types/index.ts` — already exports from config.ts
- `src/lib/index.ts` — already exports from taxJar.ts
- `src/hooks/useFirestoreDoc.ts` — hook is unchanged
- `src/hooks/index.ts` — already exports useFirestoreDoc
- `src/router.tsx` — no new routes needed (settings is inline in OverheadPage)
- `functions/` — no Cloud Function changes in this story

### Existing Components to Reuse

| Component | Location | Usage |
|---|---|---|
| `calculateTaxReserve` | `src/lib/taxJar.ts` | Existing — used for preview amount calculation |
| `calculateTaxBreakdown` | `src/lib/taxJar.ts` (NEW) | Bracket breakdown display |
| `formatCurrency` | `src/lib/currency.ts` | Amount formatting |
| `toIlsAgora` | `src/lib/currency.ts` | Currency conversion for net profit |
| `useSystemConfigStore` | `src/stores/useSystemConfigStore.ts` | Current config access |
| `useTransactionStore` | `src/stores/useTransactionStore.ts` | Net profit calculation for preview |
| `useFirestoreDoc` | `src/hooks/useFirestoreDoc.ts` | Already used by Dashboard for config subscription |
| `Button` | `src/components/Button/Button.tsx` | Save button |
| `Skeleton` | `src/components/Skeleton/Skeleton.tsx` | Loading states |
| `KpiCard` | `src/features/dashboard/components/KpiCard.tsx` | Tax Jar KPI (already exists) |
| `toast` | `src/stores/useUIStore.ts` | Success/error notifications |
| `db` | `src/services/index.ts` | Firestore instance |

### Critical Import Patterns

```typescript
// Types
import type { SystemConfig } from '@/types';
import { systemConfigSchema } from '@/types';

// Stores
import { useSystemConfigStore, useTransactionStore } from '@/stores';
import { toast } from '@/stores/useUIStore';

// Lib utilities
import { formatCurrency, toIlsAgora } from '@/lib';
import { calculateTaxReserve, calculateTaxBreakdown } from '@/lib';
import type { TaxBreakdown, TaxBracketRow } from '@/lib';

// Firestore
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services';

// Hooks
import { useFirestoreDoc } from '@/hooks';

// Phosphor icons
import { GearSix, X, WarningCircle } from '@phosphor-icons/react';

// i18n
import { useTranslation } from 'react-i18next';
```

### Testing Patterns

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files

**TaxJarSettings test setup:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services', () => ({ db: {} }));

// Mock stores
const mockConfig = {
  taxMethod: 'flat' as const,
  flatRate: 0.35,
  currencyRates: { ILS: 1, USD: 3.6, EUR: 3.9 },
  osPaturThresholdAgora: 12_000_000,
  osPaturAlertPercent: 0.80,
};
vi.mock('@/stores', () => ({
  useSystemConfigStore: vi.fn(() => ({ config: mockConfig, loading: false, error: null })),
  useTransactionStore: vi.fn(() => ({ transactions: [] })),
}));
vi.mock('@/stores/useUIStore', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

**OsPaturBanner test setup:**
```typescript
beforeEach(() => {
  sessionStorage.clear();
});
```

### Cross-Epic Context

- **Story 7.1 (done):** Created overhead data model, store, page, form. Story 7.3 adds the settings panel to OverheadPage.
- **Story 7.2 (review):** Added burn rate delta and category proportions. Story 7.3 adds the GearSix icon to the existing OverheadPage header.
- **Epic 3 (Story 3.1–3.3):** Dashboard already has Tax Jar KPI card with dynamic config. Story 7.3 adds the Osek Patur warning banner above/below the KPI row.
- **Story 7.4 (next):** Forward financial projection will factor in Tax Jar reserve from `calculateTaxReserve`. This utility is already in place.

### Git Intelligence (from Story 7.2 implementation)

Recent commit patterns:
- `73b2fa6` — Story 7.1 implementation with code review fixes
- Story 7.2 is uncommitted (in review status)

**Learnings from Story 7.2:**
- Store tests follow the pattern: mock `Date` for month selectors, use `act()` for state updates
- SCSS: `$space-2xs` was used in 7.2 but may not exist in `_variables.scss` — verify before using, use `$space-xs` (4px) as minimum
- Firestore mocks: mock `firebase/firestore` and `@/services` at module level
- Dashboard tests require mocking all stores used by `useDashboardData`

### Zod v4 Reminders (from Story 7.1)

- Use `{ error: "message" }` NOT `{ message: "message" }` for custom error strings
- `.default(0.80)` provides the value when the field is undefined during parse
- No schema changes needed for existing fields

### SCSS Patterns (from Story 7.1 and 7.2)

- Use `$error` for red/destructive — `$danger` does NOT exist
- Use `$success` for green — verified `#00ba7b` in `_variables.scss`
- Use `$warning` for amber — verified `#fa9700` in `_variables.scss`
- CSS logical properties for RTL (`margin-inline-start`, `padding-block-end`, `text-align: start`)
- Touch targets ≥ 44px on mobile
- No explicit `@use` — globals auto-imported
- Variable names: `$text-lg` NOT `$font-lg` for font-size tokens
- `$surface-secondary` does NOT exist — use `$bg-secondary` or `$bg-tertiary`
- Breakpoint: use `$bp-sm` (640px) for mobile vs desktop separation
- Mixins: `@include card-surface`, `@include elevated-surface`, `@include focus-ring`, `@include interactive-reset`

### Performance

- `calculateTaxBreakdown` is O(k) where k = number of brackets (7). Called once per settings render — negligible.
- OsPaturBanner uses `sessionStorage` — synchronous, single read on mount.
- No new Firestore subscriptions needed — both Dashboard and OverheadPage use existing subscriptions.
- TaxJarSettings preview reads from Zustand stores (synchronous selectors) — no performance concern.

### Accessibility Notes

- Method toggle uses `role="radiogroup"` and `role="radio"` with `aria-checked`
- Settings button has `aria-label` and `aria-expanded`
- OsPaturBanner has `role="alert"` for screen reader announcement
- Dismiss button has `aria-label`
- All interactive elements have `focus-visible` ring via `@include interactive-reset`
- Color is never the sole indicator — warning uses both amber color AND icon + text

### References

- [Source: epics.md — Epic 7, Story 7.3: Tax Jar Configuration & Osek Patur Alert]
- [Source: prd.md — FR2: Tax Jar reserve (configurable: flat 35% or progressive brackets)]
- [Source: prd.md — FR8: Osek Patur threshold alert at 80% of ₪120,000]
- [Source: prd.md — FR9: Configurable Tax Jar calculation method]
- [Source: architecture.md — system_config collection: taxMethod, flatRate, currencyRates, osPaturThreshold]
- [Source: architecture.md — State Management: One store per domain — useSystemConfigStore]
- [Source: architecture.md — Data Flow: Firestore → Zod → Store → Component]
- [Source: architecture.md — Feature Module Boundaries: Features never import from other features]
- [Source: ux-design-specification.md — KPI Cards: Tax Jar (₪ amount + "set aside from net profit")]
- [Source: ux-design-specification.md — Emotional Design: "Empower, Never Alarm" — Osek Patur as "heads up" not "danger"]
- [Source: ux-design-specification.md — Settings/Config: GearSix icon]
- [Source: ux-design-specification.md — Financial Semantic Colors: $warning for Osek Patur threshold approaching]
- [Source: src/types/config.ts — Existing SystemConfig schema]
- [Source: src/lib/taxJar.ts — Existing calculateTaxReserve with Israeli 2026 brackets]
- [Source: src/stores/useSystemConfigStore.ts — Existing config store]
- [Source: src/features/dashboard/hooks/useDashboardData.ts — Existing osPaturWarning computation]
- [Source: 7-2-monthly-overhead-burn-rate-trends.md — SCSS patterns, test patterns, store patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
