import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ThankYouModalProps {
  visible: boolean;
  onClose: () => void;
  onGoHome: () => void;
  isUpdate?: boolean;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ 
  visible, 
  onClose, 
  onGoHome, 
  isUpdate = false 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#27ae60" />
          </View>
          
          <Text style={styles.title}>
            {isUpdate ? 'Cập nhật thành công!' : 'Đánh giá thành công!'}
          </Text>
          
          <Text style={styles.message}>
            {isUpdate 
              ? 'Cảm ơn bạn đã cập nhật đánh giá!'
              : 'Cảm ơn bạn đã đánh giá sản phẩm! Đánh giá của bạn sẽ giúp người khác đưa ra quyết định mua hàng tốt hơn.'
            }
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.homeButton} onPress={onGoHome}>
              <Ionicons name="home" size={20} color="white" />
              <Text style={styles.homeButtonText}>Về trang chủ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ThankYouModal; 
