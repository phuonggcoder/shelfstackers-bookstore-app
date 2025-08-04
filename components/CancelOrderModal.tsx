import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CancelOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, newAddress?: string) => void;
  loading: boolean;
  paymentMethod?: string;
  isRefund?: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading,
  paymentMethod = 'cod',
  isRefund = false,
}) => {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const predefinedReasons = [
    'Thay đổi ý định mua hàng',
    'Tìm thấy sản phẩm rẻ hơn',
    'Thông tin đơn hàng không chính xác',
    'Không còn nhu cầu sử dụng',
    'Cần thay đổi địa chỉ',
    'Lý do khác',
  ];

  const handleConfirm = () => {
    if (!reason.trim() && !selectedReason) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    // Kiểm tra nếu chọn "Cần thay đổi địa chỉ" thì phải nhập địa chỉ mới
    if (selectedReason === 'Cần thay đổi địa chỉ' && !newAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ mới');
      return;
    }

    const finalReason = reason.trim() || selectedReason;
    onConfirm(finalReason, selectedReason === 'Cần thay đổi địa chỉ' ? newAddress.trim() : undefined);
  };

  const handleReasonSelect = (selected: string) => {
    setSelectedReason(selected);
    if (selected === 'Lý do khác') {
      setReason('');
      setNewAddress('');
    } else if (selected === 'Cần thay đổi địa chỉ') {
      setReason(selected);
      setNewAddress('');
    } else {
      setReason(selected);
      setNewAddress('');
    }
  };

  const getTitle = () => {
    if (isRefund) {
      return 'Yêu cầu hoàn tiền';
    }
    return 'Hủy đơn hàng';
  };

  const getDescription = () => {
    if (isRefund) {
      return 'Bạn có chắc chắn muốn yêu cầu hoàn tiền cho đơn hàng này?';
    }
    return 'Bạn có chắc chắn muốn hủy đơn hàng này?';
  };

  const getConfirmText = () => {
    if (isRefund) {
      return 'Gửi yêu cầu';
    }
    return 'Hủy đơn hàng';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.description}>{getDescription()}</Text>

            {/* Payment method info */}
            {paymentMethod !== 'cod' && (
              <View style={styles.paymentInfo}>
                <Ionicons name="card-outline" size={20} color="#667eea" />
                <Text style={styles.paymentText}>
                  Đơn hàng đã thanh toán qua {paymentMethod.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Predefined reasons */}
            <Text style={styles.sectionTitle}>Chọn lý do:</Text>
            {predefinedReasons.map((predefinedReason, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reasonOption,
                  selectedReason === predefinedReason && styles.selectedReason,
                ]}
                onPress={() => handleReasonSelect(predefinedReason)}
              >
                <View style={styles.reasonContent}>
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radio,
                        selectedReason === predefinedReason && styles.radioSelected,
                      ]}
                    >
                      {selectedReason === predefinedReason && (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.reasonText}>{predefinedReason}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Custom reason input */}
            {selectedReason === 'Lý do khác' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.sectionTitle}>Lý do khác:</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Nhập lý do của bạn..."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* New address input */}
            {selectedReason === 'Cần thay đổi địa chỉ' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.sectionTitle}>Địa chỉ mới:</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Nhập địa chỉ giao hàng mới..."
                  value={newAddress}
                  onChangeText={setNewAddress}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>{getConfirmText()}</Text>
              )}
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
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 22,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  paymentText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  reasonOption: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: 'white',
  },
  selectedReason: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  radioContainer: {
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#667eea',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  reasonText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  customReasonContainer: {
    marginTop: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default CancelOrderModal; 