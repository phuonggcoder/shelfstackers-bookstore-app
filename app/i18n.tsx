import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languageDetector from './languageDetector';
import en from './locales/en/en.json';
import vi from './locales/vi/vi.json';

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
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
      return fallbackValue || key;
    },
  });

// Function to reload translations
export const reloadTranslations = async () => {
  try {
    await i18n.reloadResources();
    console.log('Translations reloaded successfully');
  } catch (error) {
    console.error('Error reloading translations:', error);
  }
};

export default i18n;
