import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import './app/i18n';
import { reloadTranslations } from './app/i18n';
import { toastConfig } from './components/CustomToast';

export default function App() {
  useEffect(() => {
    // Force reload translations on app startup
    reloadTranslations();
  }, []);

  return (
    <>
      {/* ...các component khác, ví dụ NavigationContainer, ... */}
      <Toast config={toastConfig} />
    </>
  );
} 