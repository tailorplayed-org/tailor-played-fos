// Shared currency utilities between client and functions (Story 4.4)

export type Currency = 'ILS' | 'USD' | 'EUR';

/**
 * Default ILS conversion rates (approximate).
 * Will be replaced by system_config values when available.
 * Server-side copy — kept in sync with src/lib/currency.ts.
 */
export const DEFAULT_CONVERSION_RATES: Record<Currency, number> = {
  ILS: 1,
  USD: 3.5, // 1 USD ≈ 3.5 ILS
  EUR: 3.8, // 1 EUR ≈ 3.8 ILS
};
