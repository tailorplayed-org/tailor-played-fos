// Weighted Average Cost calculation utilities

/**
 * Recalculate WAC after a restock event.
 * All values are in agora (integer arithmetic only).
 *
 * Formula: newWAC = (existingQty × oldWAC + addedTotalCostAgora) / (existingQty + addedQty)
 *
 * Edge cases:
 * - Both quantities zero → returns 0
 * - First restock (existingQty = 0) → returns addedTotalCostAgora / addedQty
 * - Zero cost restock → WAC decreases (dilution)
 * - Single unit restock → WAC = total cost
 */
export function calculateWAC(
  existingQty: number,
  existingWacAgora: number,
  addedQty: number,
  addedTotalCostAgora: number,
): number {
  if (existingQty + addedQty === 0) return 0;
  // First restock: WAC = totalCost / qty
  if (existingQty === 0) return Math.round(addedTotalCostAgora / addedQty);
  // Standard WAC
  const totalValue = existingQty * existingWacAgora + addedTotalCostAgora;
  const totalQty = existingQty + addedQty;
  return Math.round(totalValue / totalQty);
}

/**
 * Calculate the cost of consuming inventory via scoops.
 * Placeholder for Story 6.3 — Scoop Action.
 */
export function applyScoopCost(qty: number, wacAgora: number): number {
  return qty * wacAgora;
}
