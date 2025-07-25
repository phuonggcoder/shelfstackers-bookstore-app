import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomLoginDialogProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  message?: string;
}

const CustomLoginDialog: React.FC<CustomLoginDialogProps> = ({ visible, onClose, onLogin, message }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.dialog, { opacity }]}> 
          <View style={styles.iconWrap}>
            <Ionicons name="log-in-outline" size={36} color="#5E5CE6" />
          </View>
          <Text style={styles.title}>Bạn chưa đăng nhập</Text>
          <Text style={styles.message}>{message || 'Vui lòng đăng nhập để sử dụng tính năng này.'}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Bỏ qua</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    backgroundColor: '#E8E8FF',
    borderRadius: 40,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  loginButton: {
    backgroundColor: '#5E5CE6',
    borderRadius: 20,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#E8E8FF',
    borderRadius: 20,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#5E5CE6',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomLoginDialog;
