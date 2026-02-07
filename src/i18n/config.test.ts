import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Unmock react-i18next for this test — we need the REAL i18next initialization
vi.unmock('react-i18next');

// ─── Tests that verify the ACTUAL config module ───────────────────────

describe('i18n config (actual module)', () => {
  it('exports a configured i18n instance', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n).toBeDefined();
    expect(i18n.isInitialized).toBe(true);
  });

  it('has Hebrew and English resource bundles', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.hasResourceBundle('he', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
  });

  it('uses English as fallback language for missing keys', async () => {
    const { default: i18n } = await import('./config');
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('supports only Hebrew and English', async () => {
    const { default: i18n } = await import('./config');
    // i18next automatically appends 'cimode' (CI mode) to supportedLngs
    expect(i18n.options.supportedLngs).toContain('he');
    expect(i18n.options.supportedLngs).toContain('en');
    expect(i18n.options.supportedLngs?.filter((l) => l !== 'cimode')).toEqual(['he', 'en']);
  });
});

// ─── Tests for translation content and behavior ───────────────────────

describe('i18n translations', () => {
  let i18n: typeof import('i18next').default;

  beforeAll(async () => {
    // Import i18next directly for translation-specific tests so we can
    // control the language without side-effects from the config module.
    const mod = await import('i18next');
    i18n = mod.default;

    // Load translation resources manually (mirrors config.ts resources)
    const en = (await import('./en.json')).default;
    const he = (await import('./he.json')).default;

    if (!i18n.isInitialized) {
      await i18n.init({
        resources: {
          en: { translation: en },
          he: { translation: he },
        },
        fallbackLng: 'en',
        defaultNS: 'translation',
        interpolation: { escapeValue: false },
        lng: 'he',
      });
    }
  });

  beforeEach(async () => {
    await i18n.changeLanguage('he');
  });

  it('translates keys in Hebrew', async () => {
    await i18n.changeLanguage('he');
    expect(i18n.t('nav.dashboard')).toBe('לוח בקרה');
  });

  it('translates keys in English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.dashboard')).toBe('Dashboard');
  });

  it('falls back to English for unsupported languages', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('nav.dashboard')).toBe('Dashboard');
  });

  it('handles interpolation with count', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.pendingReviews', { count: 3 })).toBe('3 pending reviews');
  });

  it('handles interpolation with id', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('pages.workOrderDetail.placeholder', { id: 'WO-42' })).toBe(
      'Detailed view for order WO-42 is coming soon.',
    );
  });

  it('has matching keys between Hebrew and English', async () => {
    const en = (await import('./en.json')).default;
    const he = (await import('./he.json')).default;

    const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        return typeof v === 'object' && v !== null
          ? getKeys(v as Record<string, unknown>, key)
          : [key];
      });

    const enKeys = getKeys(en).sort();
    const heKeys = getKeys(he).sort();
    expect(enKeys).toEqual(heKeys);
  });
});
