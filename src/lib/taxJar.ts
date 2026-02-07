/**
 * Israeli 2025 progressive income tax brackets (annual amounts in agora).
 * Brackets are indexed to inflation annually.
 * Source: Israel Tax Authority, 2025 tax year.
 */
const ISRAELI_TAX_BRACKETS: ReadonlyArray<{ upToAgora: number; rate: number }> = [
  { upToAgora: 8_412_000, rate: 0.10 },   // 0 – ₪84,120
  { upToAgora: 12_072_000, rate: 0.14 },   // ₪84,121 – ₪120,720
  { upToAgora: 19_380_000, rate: 0.20 },   // ₪120,721 – ₪193,800
  { upToAgora: 26_928_000, rate: 0.31 },   // ₪193,801 – ₪269,280
  { upToAgora: 56_028_000, rate: 0.35 },   // ₪269,281 – ₪560,280
  { upToAgora: 72_156_000, rate: 0.47 },   // ₪560,281 – ₪721,560
  { upToAgora: Infinity, rate: 0.50 },      // ₪721,561+
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
