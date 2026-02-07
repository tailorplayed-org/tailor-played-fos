export type Currency = 'ILS' | 'USD' | 'EUR';

export const CURRENCY_CONFIG: Record<
  Currency,
  { code: string; locale: string; symbol: string; minorUnitsPerMajor: number }
> = {
  ILS: { code: 'ILS', locale: 'en-IL', symbol: '₪', minorUnitsPerMajor: 100 },
  USD: { code: 'USD', locale: 'en-US', symbol: '$', minorUnitsPerMajor: 100 },
  EUR: { code: 'EUR', locale: 'en-DE', symbol: '€', minorUnitsPerMajor: 100 },
};

/**
 * Convert a display amount (e.g., 82.00) to minor units (agora/cents).
 * Uses Math.round to prevent floating-point drift.
 */
export function toMinorUnits(amount: number, currency: Currency = 'ILS'): number {
  const config = CURRENCY_CONFIG[currency];
  return Math.round(amount * config.minorUnitsPerMajor);
}

/**
 * Convert minor units (agora/cents) back to a display amount.
 */
export function toDisplayAmount(minorUnits: number, currency: Currency = 'ILS'): number {
  const config = CURRENCY_CONFIG[currency];
  return minorUnits / config.minorUnitsPerMajor;
}

/**
 * Format a minor-units amount as a currency string.
 * Input is in agora/cents — converts to display amount before formatting.
 * Returns e.g., "₪82.00", "$142.50", "€200.00"
 */
export function formatCurrency(amountAgora: number, currency: Currency = 'ILS'): string {
  const config = CURRENCY_CONFIG[currency];
  const displayAmount = toDisplayAmount(amountAgora, currency);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount);
}
