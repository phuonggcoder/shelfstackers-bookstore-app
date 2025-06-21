import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';

interface BottomAlertProps {
  type?: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  buttonText: string;
  onButtonPress: () => void;
  visible: boolean;
  onClose?: () => void;
  showCloseIcon?: boolean;
  onRequestClose?: () => void;
  contentContainerStyle?: ViewStyle;
  bottomInset?: number;
}

const ICONS = {
  success: { color: '#2D5BFF', name: 'checkmark', bg: '#EAF0FF' },
  error: { color: '#FF2D2D', name: 'close', bg: '#FFEAEA' },
  info: { color: '#2D5BFF', name: 'information', bg: '#EAF0FF' },
};

const BottomAlert: React.FC<BottomAlertProps> = ({
  type = 'info',
  title,
  description,
  buttonText,
  onButtonPress,
  visible,
  onClose,
  showCloseIcon,
  onRequestClose,
  contentContainerStyle,
  bottomInset = 0,
}) => {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const icon = ICONS[type];

  // Hàm xử lý khi click vào overlay hoặc nút X
  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onRequestClose) onRequestClose();
      else if (onClose) onClose();
    });
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={handleClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            pointerEvents: visible ? 'auto' : 'none',
            transform: [
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={[
            styles.alertBox,
            { paddingBottom: 30 + bottomInset },
            contentContainerStyle,
          ]}>
            {/* Close icon */}
            {showCloseIcon && (
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            )}
            <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>  
              <View style={[styles.iconCircle, { backgroundColor: icon.color }]}>  
                <Ionicons name={icon.name as any} size={32} color="#fff" />
              </View>
            </View>
            <Text style={styles.title}>{title}</Text>
            {!!description && <Text style={styles.desc}>{description}</Text>}
            <TouchableOpacity style={styles.button} onPress={onButtonPress}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 100,
  },
  alertBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 180,
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    padding: 4,
  },
  iconWrap: {
    marginBottom: 18,
    borderRadius: 999,
    padding: 12,
    marginTop: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D5BFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#222',
  },
  desc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 22,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2D5BFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BottomAlert;
