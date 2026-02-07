import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockChangeLanguage = vi.fn();
let mockLanguage = 'he';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() {
        return mockLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

const { useDirection } = await import('./useDirection');

describe('useDirection', () => {
  beforeEach(() => {
    mockLanguage = 'he';
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  it('sets dir="rtl" when language is Hebrew', () => {
    mockLanguage = 'he';
    renderHook(() => useDirection());

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('sets lang="he" when language is Hebrew', () => {
    mockLanguage = 'he';
    renderHook(() => useDirection());

    expect(document.documentElement.getAttribute('lang')).toBe('he');
  });

  it('sets dir="ltr" when language is English', () => {
    mockLanguage = 'en';
    renderHook(() => useDirection());

    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('sets lang="en" when language is English', () => {
    mockLanguage = 'en';
    renderHook(() => useDirection());

    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('returns isRTL=true for Hebrew', () => {
    mockLanguage = 'he';
    const { result } = renderHook(() => useDirection());

    expect(result.current.isRTL).toBe(true);
  });

  it('returns isRTL=false for English', () => {
    mockLanguage = 'en';
    const { result } = renderHook(() => useDirection());

    expect(result.current.isRTL).toBe(false);
  });

  it('returns the correct direction string', () => {
    mockLanguage = 'he';
    const { result } = renderHook(() => useDirection());

    expect(result.current.direction).toBe('rtl');
  });

  it('returns the current language', () => {
    mockLanguage = 'en';
    const { result } = renderHook(() => useDirection());

    expect(result.current.language).toBe('en');
  });

  it('recognizes Arabic as RTL', () => {
    mockLanguage = 'ar';
    const { result } = renderHook(() => useDirection());

    expect(result.current.isRTL).toBe(true);
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });
});
