// Mock for react-i18next — no vitest imports to avoid circular resolution
const noop = () => {};

export const useTranslation = () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    if (params) {
      let result = key;
      for (const [k, v] of Object.entries(params)) {
        const placeholder = `{{${k}}}`;
        if (result.includes(placeholder)) {
          result = result.replace(placeholder, String(v));
        } else {
          // Append unreplaced params so tests can verify they were passed
          result += `|${k}=${v}`;
        }
      }
      return result;
    }
    return key;
  },
  i18n: {
    language: 'en',
    changeLanguage: noop,
  },
});

export const initReactI18next = { type: '3rdParty', init: noop };

export const Trans = ({ children }: { children: unknown }) => children;

export const I18nextProvider = ({ children }: { children: unknown }) => children;
