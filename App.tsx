import React from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from './components/CustomToast';
// ... các import khác ...

export default function App() {
  return (
    <>
      {/* ...các component khác, ví dụ NavigationContainer, ... */}
      <Toast config={toastConfig} />
    </>
  );
} 