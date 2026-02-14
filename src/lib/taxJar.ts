/**
 * Israeli 2026 progressive income tax brackets (annual amounts in agora).
 * Brackets are indexed to inflation annually.
 * Source: Israel Tax Authority, 2026 tax year (CPI-adjusted from 2025).
 */
const ISRAELI_TAX_BRACKETS: ReadonlyArray<{ upToAgora: number; rate: number }> = [
  { upToAgora: 8_622_000, rate: 0.10 },   // 0 – ₪86,220
  { upToAgora: 12_374_000, rate: 0.14 },   // ₪86,221 – ₪123,740
  { upToAgora: 19_864_000, rate: 0.20 },   // ₪123,741 – ₪198,640
  { upToAgora: 27_601_000, rate: 0.31 },   // ₪198,641 – ₪276,010
  { upToAgora: 57_429_000, rate: 0.35 },   // ₪276,011 – ₪574,290
  { upToAgora: 73_960_000, rate: 0.47 },   // ₪574,291 – ₪739,600
  { upToAgora: Infinity, rate: 0.50 },      // ₪739,601+
];

const DEFAULT_FLAT_RATE = 0.35;

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
 * Calculate tax reserve amount for the Tax Jar.
 *
 * @param netProfitAgora - Net profit in agora (integer)
 * @param method - 'flat' applies a single rate; 'bracket' applies Israeli progressive brackets
 * @param flatRate - Rate for flat mode (default 0.35 = 35%)
 * @returns Tax reserve amount in agora (integer, rounded)
 */
export function calculateTaxReserve(
  netProfitAgora: number,
  method: 'flat' | 'bracket',
  flatRate: number = DEFAULT_FLAT_RATE,
): number {
  if (netProfitAgora <= 0) return 0;

  if (method === 'flat') {
    return Math.round(netProfitAgora * flatRate);
  }

  // Bracket mode — progressive taxation
  // Input is monthly, annualize first, then de-annualize result
  const annualizedAgora = netProfitAgora * 12;
  let tax = 0;
  let remaining = annualizedAgora;
  let prevCeiling = 0;

  for (const bracket of ISRAELI_TAX_BRACKETS) {
    const bracketSize = bracket.upToAgora - prevCeiling;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevCeiling = bracket.upToAgora;
    if (remaining <= 0) break;
  }

  // Return monthly equivalent
  return Math.round(tax / 12);
}

/**
 * Calculate tax breakdown for display. Returns per-bracket contributions.
 * For flat mode: single row. For bracket mode: Israeli progressive brackets.
 * Uses MONTHLY net profit as input (same as calculateTaxReserve).
 */
export function calculateTaxBreakdown(
  netProfitAgora: number,
  method: 'flat' | 'bracket',
  flatRate: number = DEFAULT_FLAT_RATE,
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

  // Bracket mode — progressive taxation with per-bracket breakdown
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
      : `₪${(bracket.upToAgora / 100).toLocaleString('en-IL', { maximumFractionDigits: 0 })}`;

    rows.push({
      label: bracket.upToAgora === Infinity
        ? `${Math.round(bracket.rate * 100)}% (above ₪${((prevCeiling + 1) / 100).toLocaleString('en-IL', { maximumFractionDigits: 0 })})`
        : prevCeiling === 0
          ? `${Math.round(bracket.rate * 100)}% (up to ${upperLabel})`
          : `${Math.round(bracket.rate * 100)}% (₪${((prevCeiling + 1) / 100).toLocaleString('en-IL', { maximumFractionDigits: 0 })} – ${upperLabel})`,
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
