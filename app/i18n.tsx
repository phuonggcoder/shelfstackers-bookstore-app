import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languageDetector from './languageDetector'; // đường dẫn đúng
import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
