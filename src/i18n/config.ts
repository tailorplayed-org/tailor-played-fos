import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import he from './he.json';

// Hebrew is the default language (AC #1). Read stored preference from
// localStorage; when no preference exists (first visit), default to Hebrew.
// Setting `lng` explicitly guarantees Hebrew on first visit regardless of
// the browser's navigator.language. The LanguageDetector plugin still
// handles caching on subsequent changeLanguage() calls.
const STORAGE_KEY = 'tp-fos-lang';

function getStoredLang(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

const storedLang = getStoredLang();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    lng: storedLang || 'he',
    fallbackLng: 'en',
    supportedLngs: ['he', 'en'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
