import { useCallback, useState } from 'react';

interface UseUnifiedComponentReturn {
  // Alert
  showAlert: (title: string, description: string, mode?: string, buttonText?: string) => void;
  hideAlert: () => void;
  alertVisible: boolean;
  alertConfig: {
    title: string;
    description: string;
    mode: string;
    buttonText: string;
  };

  // Dialog
  showDialog: (title: string, message: string, mode?: string, confirmText?: string, cancelText?: string) => void;
  hideDialog: () => void;
  dialogVisible: boolean;
  dialogConfig: {
    title: string;
    message: string;
    mode: string;
    confirmText: string;
    cancelText: string;
  };

  // Popup
  showPopup: (title: string, message: string, mode?: string, primaryText?: string, secondaryText?: string) => void;
  hidePopup: () => void;
  popupVisible: boolean;
  popupConfig: {
    title: string;
    message: string;
    mode: string;
    primaryText: string;
    secondaryText: string;
  };

  // Toast
  showToast: (text1: string, text2?: string, mode?: string, duration?: number) => void;
  hideToast: () => void;
  toastVisible: boolean;
  toastConfig: {
    text1: string;
    text2?: string;
    mode: string;
    duration: number;
  };
}

export const useUnifiedComponent = (): UseUnifiedComponentReturn => {
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    mode: 'info',
    buttonText: 'Đồng ý',
  });

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    mode: 'warning',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
  });

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: '',
    message: '',
    mode: 'info',
    primaryText: 'Tiếp tục',
    secondaryText: 'Hủy',
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    text1: '',
    text2: '',
    mode: 'success',
    duration: 3000,
  });

  // Alert functions
  const showAlert = useCallback((title: string, description: string, mode = 'info', buttonText = 'Đồng ý') => {
    setAlertConfig({ title, description, mode, buttonText });
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  // Dialog functions
  const showDialog = useCallback((
    title: string, 
    message: string, 
    mode = 'warning', 
    confirmText = 'Xác nhận', 
    cancelText = 'Hủy'
  ) => {
    setDialogConfig({ title, message, mode, confirmText, cancelText });
    setDialogVisible(true);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogVisible(false);
  }, []);

  // Popup functions
  const showPopup = useCallback((
    title: string, 
    message: string, 
    mode = 'info', 
    primaryText = 'Tiếp tục', 
    secondaryText = 'Hủy'
  ) => {
    setPopupConfig({ title, message, mode, primaryText, secondaryText });
    setPopupVisible(true);
  }, []);

  const hidePopup = useCallback(() => {
    setPopupVisible(false);
  }, []);

  // Toast functions
  const showToast = useCallback((
    text1: string, 
    text2 = '', 
    mode = 'success', 
    duration = 3000
  ) => {
    setToastConfig({ text1, text2, mode, duration });
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  return {
    // Alert
    showAlert,
    hideAlert,
    alertVisible,
    alertConfig,

    // Dialog
    showDialog,
    hideDialog,
    dialogVisible,
    dialogConfig,

    // Popup
    showPopup,
    hidePopup,
    popupVisible,
    popupConfig,

    // Toast
    showToast,
    hideToast,
    toastVisible,
    toastConfig,
  };
}; 