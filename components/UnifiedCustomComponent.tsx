import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface UnifiedCustomComponentProps {
  // Common props
  visible: boolean;
  type?: 'alert' | 'dialog' | 'popup' | 'toast';
  mode?: 'success' | 'error' | 'warning' | 'info' | 'login' | 'delete' | 'update' | 'download';
  
  // Text content
  title?: string;
  message?: string;
  text1?: string;
  text2?: string;
  description?: string;
  
  // Buttons
  buttonText?: string;
  confirmText?: string;
  cancelText?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  
  // Actions
  onButtonPress?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
  
  // Icons
  icon?: string;
  
  // Toast specific
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  
  // Custom styling
  customStyle?: any;
}

export default function UnifiedCustomComponent({
  visible,
  type = 'alert',
  mode = 'info',
  title,
  message,
  text1,
  text2,
  description,
  buttonText = 'Đồng ý',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  primaryButtonText = 'Tiếp tục',
  secondaryButtonText = 'Hủy',
  onButtonPress,
  onConfirm,
  onCancel,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  icon,
  duration = 3000,
  position = 'bottom',
  customStyle
}: UnifiedCustomComponentProps) {
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (type === 'toast') {
        const timer = setTimeout(() => {
          onClose?.();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, type, duration, onClose]);

  const getModeStyles = () => {
    switch (mode) {
      case 'success':
        return {
          backgroundColor: '#3255FB',
          iconColor: '#fff',
          icon: 'checkmark-circle',
          borderColor: '#3255FB',
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          iconColor: '#fff',
          icon: 'close-circle',
          borderColor: '#F44336',
        };
      case 'warning':
        return {
          backgroundColor: '#F44336',
          iconColor: '#fff',
          icon: 'warning',
          borderColor: '#F44336',
        };
      case 'info':
        return {
          backgroundColor: '#2196F3',
          iconColor: '#fff',
          icon: 'information-circle',
          borderColor: '#2196F3',
        };
             case 'login':
         return {
           backgroundColor: '#5E5CE6',
           iconColor: '#fff',
           icon: 'log-in',
           borderColor: '#5E5CE6',
         };
       case 'delete':
         return {
           backgroundColor: '#DC3545',
           iconColor: '#fff',
           icon: 'trash',
           borderColor: '#DC3545',
         };
       case 'update':
         return {
           backgroundColor: '#17A2B8',
           iconColor: '#fff',
           icon: 'refresh',
           borderColor: '#17A2B8',
         };
       case 'download':
         return {
           backgroundColor: '#28A745',
           iconColor: '#fff',
           icon: 'download',
           borderColor: '#28A745',
         };
       default:
         return {
           backgroundColor: '#2196F3',
           iconColor: '#fff',
           icon: 'information-circle',
           borderColor: '#2196F3',
         };
    }
  };

  const modeStyle = getModeStyles();

  const renderIcon = () => {
    const iconName = icon || modeStyle.icon;
    return (
      <Ionicons
        name={iconName as any}
        size={type === 'toast' ? 24 : 48}
        color={modeStyle.iconColor}
        style={type === 'toast' ? styles.toastIcon : styles.icon}
      />
    );
  };

  const renderToast = () => {
    return (
      <Animated.View
        style={[
          styles.toastContainer,
                     styles[`toast${position.charAt(0).toUpperCase() + position.slice(1)}` as keyof typeof styles],
          {
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: position === 'top' ? [-50, 0] : [50, 0],
                }),
              },
            ],
          },
          { backgroundColor: modeStyle.backgroundColor },
          customStyle,
        ]}
      >
        {renderIcon()}
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastText}>{text1}</Text>
          {text2 && <Text style={styles.toastSubText}>{text2}</Text>}
        </View>
      </Animated.View>
    );
  };

  const renderAlert = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onButtonPress}
      >
        <View style={styles.alertOverlay}>
          <Animated.View
            style={[
              styles.alertContainer,
              {
                opacity: animation,
                transform: [
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
              customStyle,
            ]}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: modeStyle.backgroundColor }]}>
              {renderIcon()}
            </View>
            <Text style={styles.alertTitle}>{title}</Text>
            {description && <Text style={styles.alertDescription}>{description}</Text>}
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: modeStyle.backgroundColor }]}
              onPress={onButtonPress}
            >
              <Text style={styles.alertButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderDialog = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onCancel}
      >
        <View style={styles.dialogOverlay}>
          <Animated.View
            style={[
              styles.dialogContainer,
              {
                opacity: animation,
                transform: [
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
              customStyle,
            ]}
          >
            <View style={[styles.dialogIconContainer, { backgroundColor: modeStyle.backgroundColor }]}>
              {renderIcon()}
            </View>
            <Text style={styles.dialogTitle}>{title}</Text>
            {message && <Text style={styles.dialogMessage}>{message}</Text>}
            <View style={styles.dialogButtonContainer}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogCancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.dialogCancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogConfirmButton, { backgroundColor: modeStyle.backgroundColor }]}
                onPress={onConfirm}
              >
                <Text style={styles.dialogConfirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderPopup = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popupContainer,
              {
                opacity: animation,
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              },
              customStyle,
            ]}
          >
            <TouchableOpacity style={styles.popupCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            <View style={[styles.popupIconContainer, { backgroundColor: modeStyle.backgroundColor }]}>
              {renderIcon()}
            </View>
            
            <Text style={styles.popupTitle}>{title}</Text>
            {message && <Text style={styles.popupMessage}>{message}</Text>}
            
            <View style={styles.popupButtonContainer}>
              {secondaryButtonText && (
                <TouchableOpacity
                  style={[styles.popupButton, styles.popupSecondaryButton]}
                  onPress={onSecondaryPress}
                >
                  <Text style={styles.popupSecondaryButtonText}>{secondaryButtonText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.popupButton, styles.popupPrimaryButton, { backgroundColor: modeStyle.backgroundColor }]}
                onPress={onPrimaryPress}
              >
                <Text style={styles.popupPrimaryButtonText}>{primaryButtonText}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Render based on type
  switch (type) {
    case 'toast':
      return renderToast();
    case 'alert':
      return renderAlert();
    case 'dialog':
      return renderDialog();
    case 'popup':
      return renderPopup();
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  // Toast styles
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  toastTop: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
  },
  toastBottom: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  toastCenter: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -25 }],
  },
  toastIcon: {
    marginRight: 12,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toastSubText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },

  // Alert styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 320,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 0,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 320,
  },
  dialogIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  dialogButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  dialogCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  dialogConfirmButton: {
    backgroundColor: '#5E5CE6',
  },
  dialogCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Popup styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: width * 0.9,
    maxWidth: 350,
    position: 'relative',
  },
  popupCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  popupIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  popupMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  popupButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  popupButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  popupSecondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  popupPrimaryButton: {
    backgroundColor: '#5E5CE6',
  },
  popupSecondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  popupPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 