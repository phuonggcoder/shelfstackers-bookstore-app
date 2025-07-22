import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageDetectorAsyncModule } from 'i18next';

const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  init: () => {},

  detect: (callback) => {
    AsyncStorage.getItem('language')
      .then((language) => {
        if (language) {
          callback(language);
        } else {
          callback('vi'); // mặc định tiếng Việt
        }
      })
      .catch((err) => {
        console.error('Language detection error:', err);
        callback('vi');
      });
  },

  cacheUserLanguage: (lng) => {
    AsyncStorage.setItem('language', lng).catch((err) => {
      console.error('Error caching language:', err);
    });
  },
};

export default languageDetector;
