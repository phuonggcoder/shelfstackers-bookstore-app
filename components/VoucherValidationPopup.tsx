import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface VoucherValidationPopupProps {
  visible: boolean;
  voucher: any;
  subtotal: number;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const VoucherValidationPopup: React.FC<VoucherValidationPopupProps> = ({
  visible,
  voucher,
  subtotal,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    // Fade out animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onClose();
    });
  };

  if (!isVisible) return null;

  const minOrderValue = voucher?.min_order_value || 0;
  const remainingAmount = minOrderValue - subtotal;
  const isInsufficient = subtotal < minOrderValue;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.popupContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Ionicons
                name={isInsufficient ? "alert-circle" : "checkmark-circle"}
                size={48}
                color={isInsufficient ? "#FF6B6B" : "#4CAF50"}
              />
            </View>

            <Text style={styles.title}>
              {isInsufficient ? "Không thể sử dụng voucher" : "Voucher hợp lệ"}
            </Text>

            <Text style={styles.voucherName}>
              {voucher?.title || voucher?.voucher_id}
            </Text>

            {isInsufficient && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giá trị đơn hàng hiện tại:</Text>
                  <Text style={styles.detailValue}>
                    {subtotal.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Yêu cầu tối thiểu:</Text>
                  <Text style={styles.detailValue}>
                    {minOrderValue.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>

                <View style={styles.remainingContainer}>
                  <Text style={styles.remainingLabel}>
                    Cần thêm:
                  </Text>
                  <Text style={styles.remainingAmount}>
                    {remainingAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>
                💡 Gợi ý:
              </Text>
              <Text style={styles.suggestionText}>
                • Thêm sản phẩm vào giỏ hàng
              </Text>
              <Text style={styles.suggestionText}>
                • Chọn voucher khác phù hợp hơn
              </Text>
              <Text style={styles.suggestionText}>
                • Kiểm tra các mã giảm giá khác
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClose}
            >
              <Text style={styles.actionButtonText}>Đã hiểu</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: screenWidth - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  voucherName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#3255FB',
  },
  detailsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  remainingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  suggestionsContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoucherValidationPopup; 
