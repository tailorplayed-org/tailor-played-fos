// Date formatting and manipulation utilities

/**
 * Format a Date object into the YYYY-MM-DD string format
 * required by HTML date inputs.
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Minimal translator signature compatible with react-i18next's `t` function. */
export type RelativeTimeTranslator = (key: string, options?: Record<string, unknown>) => string;

/**
 * Return a human-friendly relative time string.
 * Examples: "Today", "Yesterday", "3 days ago"
 *
 * When a `t` (i18n translator) function is provided, returns localised
 * strings via `dates.relative.*` keys. Otherwise falls back to English.
 *
 * @param date - The date to compare against now
 * @param now  - Reference date (defaults to `new Date()` — injectable for testing)
 * @param t    - Optional i18n translate function for localised output
 */
export function relativeTime(
  date: Date,
  now: Date = new Date(),
  t?: RelativeTimeTranslator,
): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfToday.getTime() - startOfDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t ? t('dates.relative.today') : 'Today';
  if (diffDays === 1) return t ? t('dates.relative.yesterday') : 'Yesterday';
  if (diffDays > 1 && diffDays <= 30) {
    return t
      ? t('dates.relative.daysAgo', { count: diffDays })
      : `${diffDays} days ago`;
  }
  if (diffDays > 30 && diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    return t
      ? t('dates.relative.monthsAgo', { count: months })
      : months === 1
        ? '1 month ago'
        : `${months} months ago`;
  }
  if (diffDays > 365) {
    const years = Math.floor(diffDays / 365);
    return t
      ? t('dates.relative.yearsAgo', { count: years })
      : years === 1
        ? '1 year ago'
        : `${years} years ago`;
  }
  // Future dates — shouldn't happen normally, but handle gracefully
  return formatDateForInput(date);
}
