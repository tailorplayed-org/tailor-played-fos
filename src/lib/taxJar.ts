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
