// Margin calculation utilities

export type MarginStatus = 'healthy' | 'watch' | 'danger';

/**
 * Calculate margin percentage from revenue and total costs.
 * Returns 0 if revenue is 0 (prevents division by zero).
 * All amounts in agora (integer).
 */
export function calculateMargin(revenueAgora: number, totalCostAgora: number): number {
  if (revenueAgora === 0) return 0;
  return ((revenueAgora - totalCostAgora) / revenueAgora) * 100;
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
