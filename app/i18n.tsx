import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languageDetector from './languageDetector';
import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    fallbackLng: 'vi',
    lng: 'vi', // default language
    debug: __DEV__, // enable debug in development
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // recommended for React Native
    },
  });

export default i18n;
