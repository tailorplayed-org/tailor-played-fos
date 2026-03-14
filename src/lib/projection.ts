/**
 * Forward Financial Projection calculation utilities.
 * All monetary values in agora (integer, minor units).
 */

export type ProjectionAssessment = 'healthy' | 'tight' | 'negative';

export interface FinancialSnapshot {
  netProfitAgora: number;
  taxJarAgora: number;
  monthlyOverheadAgora: number;
  availableBufferAgora: number;
  pipelineRevenueAgora: number;
}

export interface ProjectionResult {
  assessment: ProjectionAssessment;
  bufferAfterPurchaseAgora: number;
  monthlyCoverageMonths: number;
  monthsUntilAbsorbed: number | null;
  shortfallAgora: number;
  isInventoryPurchase: boolean;
}

/**
 * Buffer = Net Profit - Tax Jar Reserve - Monthly Overhead.
 * Tax Jar is only reserved from positive profit.
 */
export function calculateAvailableBuffer(
  netProfitAgora: number,
  taxJarAgora: number,
  monthlyOverheadAgora: number,
): number {
  const effectiveTaxJar = netProfitAgora > 0 ? taxJarAgora : 0;
  return netProfitAgora - effectiveTaxJar - monthlyOverheadAgora;
}

export function buildFinancialSnapshot(
  netProfitAgora: number,
  taxJarAgora: number,
  monthlyOverheadAgora: number,
  pipelineRevenueAgora: number,
): FinancialSnapshot {
  return {
    netProfitAgora,
    taxJarAgora,
    monthlyOverheadAgora,
    availableBufferAgora: calculateAvailableBuffer(netProfitAgora, taxJarAgora, monthlyOverheadAgora),
    pipelineRevenueAgora,
  };
}

/**
 * How many months of recurring costs (overhead + tax jar) the buffer covers.
 * Returns Infinity if monthly cost is 0 and buffer is positive.
 */
export function calculateMonthlyCoverage(
  bufferAgora: number,
  monthlyOverheadAgora: number,
  taxJarAgora: number,
): number {
  const monthlyCost = monthlyOverheadAgora + taxJarAgora;
  if (monthlyCost <= 0) return bufferAgora > 0 ? Infinity : 0;
  if (bufferAgora <= 0) return 0;
  return bufferAgora / monthlyCost;
}

/**
 * Conservative estimate: Production/Shipped WOs are expected to
 * invoice within ~1–3 months, so pipeline revenue is spread evenly.
 */
const PIPELINE_SPREAD_MONTHS = 3;

/**
 * Months until pipeline revenue recovers the purchase amount.
 * Returns null if no pipeline revenue exists.
 */
export function calculateMonthsUntilAbsorbed(
  purchaseAgora: number,
  pipelineRevenueAgora: number,
): number | null {
  if (pipelineRevenueAgora <= 0) return null;
  const monthlyPipelineRevenue = Math.round(pipelineRevenueAgora / PIPELINE_SPREAD_MONTHS);
  if (monthlyPipelineRevenue <= 0) return null;
  return Math.ceil(purchaseAgora / monthlyPipelineRevenue);
}

/**
 * Assessment thresholds per AC #3/#4/#5:
 * - healthy: >= 2 months coverage
 * - tight: > 0 but < 2 months
 * - negative: <= 0
 */
export function getAssessment(monthlyCoverageMonths: number): ProjectionAssessment {
  if (monthlyCoverageMonths >= 2) return 'healthy';
  if (monthlyCoverageMonths > 0) return 'tight';
  return 'negative';
}

export function calculateProjection(
  snapshot: FinancialSnapshot,
  purchaseAgora: number,
  isInventoryPurchase: boolean = false,
): ProjectionResult {
  if (purchaseAgora <= 0) {
    const coverage = calculateMonthlyCoverage(
      snapshot.availableBufferAgora,
      snapshot.monthlyOverheadAgora,
      snapshot.taxJarAgora,
    );
    return {
      assessment: getAssessment(coverage),
      bufferAfterPurchaseAgora: snapshot.availableBufferAgora,
      monthlyCoverageMonths: Math.round(coverage * 10) / 10,
      monthsUntilAbsorbed: null,
      shortfallAgora: 0,
      isInventoryPurchase,
    };
  }

  const bufferAfterPurchase = snapshot.availableBufferAgora - purchaseAgora;
  const coverage = calculateMonthlyCoverage(
    bufferAfterPurchase,
    snapshot.monthlyOverheadAgora,
    snapshot.taxJarAgora,
  );
  const monthsUntilAbsorbed = calculateMonthsUntilAbsorbed(
    purchaseAgora,
    snapshot.pipelineRevenueAgora,
  );

  return {
    assessment: getAssessment(coverage),
    bufferAfterPurchaseAgora: bufferAfterPurchase,
    monthlyCoverageMonths: Math.round(coverage * 10) / 10,
    monthsUntilAbsorbed,
    shortfallAgora: bufferAfterPurchase < 0 ? Math.abs(bufferAfterPurchase) : 0,
    isInventoryPurchase,
  };
}
