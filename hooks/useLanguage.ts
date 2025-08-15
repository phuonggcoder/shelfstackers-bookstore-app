import { useTranslation } from 'react-i18next';
import { useLanguage as useLanguageContext } from '../context/LanguageContext';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage, isLoading } = useLanguageContext();

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'en':
        return 'English';
      case 'vi':
        return 'Tiếng Việt';
      default:
        return 'Tiếng Việt';
    }
  };

  const getLanguageFlag = (code: string) => {
    switch (code) {
      case 'en':
        return '🇺🇸';
      case 'vi':
        return '🇻🇳';
      default:
        return '🇻🇳';
    }
  };

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    isLoading,
    getLanguageLabel,
    getLanguageFlag,
  };
}; 