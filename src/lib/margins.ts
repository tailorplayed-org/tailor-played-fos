// Margin calculation utilities

export type MarginStatus = 'healthy' | 'watch' | 'danger';

/** 5% unforeseen buffer constant */
export const BUFFER_PERCENTAGE = 0.05;

/**
 * Calculate the unforeseen buffer amount (5% of total costs).
 * All amounts in agora (integer).
 */
export function calculateBuffer(totalCostAgora: number): number {
  return Math.round(totalCostAgora * BUFFER_PERCENTAGE);
}

/**
 * Calculate margin percentage from revenue, total costs, and optional buffer.
 * Returns 0 if revenue is 0 (prevents division by zero).
 * All amounts in agora (integer).
 *
 * Formula: (revenue - totalCost - buffer) / revenue × 100
 *
 * Backward compatible: bufferAgora defaults to 0.
 */
export function calculateMargin(
  revenueAgora: number,
  totalCostAgora: number,
  bufferAgora: number = 0,
): number {
  if (revenueAgora === 0) return 0;
  return ((revenueAgora - totalCostAgora - bufferAgora) / revenueAgora) * 100;
}

/**
 * Map margin percentage to status tier.
 * ≥ 30% = healthy (green)
 * 20–29.99% = watch (yellow)
 * < 20% = danger (red)
 */
export function getMarginStatus(marginPercent: number): MarginStatus {
  if (marginPercent >= 30) return 'healthy';
  if (marginPercent >= 20) return 'watch';
  return 'danger';
}
