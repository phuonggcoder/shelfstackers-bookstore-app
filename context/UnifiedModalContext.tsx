import React, { createContext, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';

interface ModalConfig {
  type: 'alert' | 'dialog' | 'popup' | 'toast';
  mode: 'success' | 'error' | 'warning' | 'info' | 'login' | 'delete' | 'update' | 'download';
  title?: string;
  message?: string;
  text1?: string;
  text2?: string;
  description?: string;
  buttonText?: string;
  confirmText?: string;
  cancelText?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  onButtonPress?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

interface UnifiedModalContextType {
  visible: boolean;
  config: ModalConfig;
  showModal: (modalConfig: ModalConfig) => void;
  hideModal: () => void;
  showToast: (text1: string, text2?: string, mode?: ModalConfig['mode'], position?: 'top' | 'bottom' | 'center', duration?: number) => void;
  showAlert: (title: string, description?: string, buttonText?: string, mode?: ModalConfig['mode'], onButtonPress?: () => void) => void;
  showDialog: (title: string, message?: string, confirmText?: string, cancelText?: string, mode?: ModalConfig['mode'], onConfirm?: () => void, onCancel?: () => void) => void;
  showPopup: (title: string, message?: string, primaryButtonText?: string, secondaryButtonText?: string, mode?: ModalConfig['mode'], onPrimaryPress?: () => void, onSecondaryPress?: () => void) => void;
  showSuccessToast: (text1: string, text2?: string, duration?: number) => void;
  showErrorToast: (text1: string, text2?: string) => void;
  showWarningToast: (text1: string, text2?: string) => void;
  showLoginPopup: (onLogin?: () => void, onSkip?: () => void) => void;
  showDeleteDialog: (onConfirm?: () => void, onCancel?: () => void) => void;
}

const UnifiedModalContext = createContext<UnifiedModalContextType | undefined>(undefined);

export const UnifiedModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    type: 'alert',
    mode: 'info'
  });

  const showModal = useCallback((modalConfig: ModalConfig) => {
    setConfig(modalConfig);
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
  }, []);

  const showToast = useCallback((
    text1: string, 
    text2?: string, 
    mode: ModalConfig['mode'] = 'success',
    position: 'top' | 'bottom' | 'center' = 'bottom',
    duration = 2000
  ) => {
    showModal({
      type: 'toast',
      mode,
      text1,
      text2,
      position,
      duration,
      onClose: hideModal
    });
  }, [showModal, hideModal]);

  const showAlert = useCallback((
    title: string,
    description?: string,
    buttonText?: string,
    mode: ModalConfig['mode'] = 'info',
    onButtonPress?: () => void
  ) => {
    showModal({
      type: 'alert',
      mode,
      title,
      description,
      buttonText,
      onButtonPress: onButtonPress || hideModal
    });
  }, [showModal, hideModal]);

  const showDialog = useCallback((
    title: string,
    message?: string,
    confirmText?: string,
    cancelText?: string,
    mode: ModalConfig['mode'] = 'info',
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    showModal({
      type: 'dialog',
      mode,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: onConfirm || hideModal,
      onCancel: onCancel || hideModal
    });
  }, [showModal, hideModal]);

  const showPopup = useCallback((
    title: string,
    message?: string,
    primaryButtonText?: string,
    secondaryButtonText?: string,
    mode: ModalConfig['mode'] = 'info',
    onPrimaryPress?: () => void,
    onSecondaryPress?: () => void
  ) => {
    showModal({
      type: 'popup',
      mode,
      title,
      message,
      primaryButtonText,
      secondaryButtonText,
      onPrimaryPress: onPrimaryPress || hideModal,
      onSecondaryPress: onSecondaryPress || hideModal
    });
  }, [showModal, hideModal]);

  const showSuccessToast = useCallback((text1: string, text2?: string, duration?: number) => {
    showToast(text1, text2, 'success', 'bottom', duration);
  }, [showToast]);

  const showErrorToast = useCallback((text1: string, text2?: string) => {
    showToast(text1, text2, 'error');
  }, [showToast]);

  const showWarningToast = useCallback((text1: string, text2?: string) => {
    showToast(text1, text2, 'warning');
  }, [showToast]);

  const showLoginPopup = useCallback((onLogin?: () => void, onSkip?: () => void) => {
    showPopup(
      t('unifiedModal.loginRequired'),
      t('unifiedModal.loginRequiredMessage'),
      t('unifiedModal.login'),
      t('unifiedModal.skip'),
      'login',
      () => {
        if (onLogin) {
          onLogin();
        }
        hideModal();
      },
      () => {
        if (onSkip) {
          onSkip();
        }
        hideModal();
      }
    );
  }, [showPopup, hideModal, t]);

  const showDeleteDialog = useCallback((onConfirm?: () => void, onCancel?: () => void) => {
    showDialog(
      t('unifiedModal.deleteConfirmation'),
      t('unifiedModal.deleteConfirmationMessage'),
      t('unifiedModal.delete'),
      t('unifiedModal.cancel'),
      'delete',
      onConfirm,
      onCancel
    );
  }, [showDialog, t]);

  const value: UnifiedModalContextType = {
    visible,
    config,
    showModal,
    hideModal,
    showToast,
    showAlert,
    showDialog,
    showPopup,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showLoginPopup,
    showDeleteDialog
  };

  return (
    <UnifiedModalContext.Provider value={value}>
      {children}
      <UnifiedCustomComponent
        visible={visible}
        {...config}
        onClose={hideModal}
      />
    </UnifiedModalContext.Provider>
  );
};

export const useUnifiedModal = (): UnifiedModalContextType => {
  const context = useContext(UnifiedModalContext);
  if (!context) {
    throw new Error('useUnifiedModal must be used within a UnifiedModalProvider');
  }
  return context;
};
