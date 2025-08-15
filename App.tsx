import Toast from 'react-native-toast-message';
import './app/i18n';
import { toastConfig } from './components/CustomToast';

export default function App() {
  return (
    <>
      {/* ...các component khác, ví dụ NavigationContainer, ... */}
      <Toast config={toastConfig} />
    </>
  );
} 