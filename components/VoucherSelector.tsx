import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
    MultipleVoucherValidationRequest,
    MultipleVoucherValidationResponse,
    Voucher,
    VoucherType,
    getAvailableVouchers,
    validateMultipleVouchers
} from '../services/voucherService';

interface VoucherSelectorProps {
  orderValue: number;
  shippingCost: number;
  onVouchersSelected: (result: MultipleVoucherValidationResponse) => void;
  onClose: () => void;
  visible: boolean;
}

interface SelectedVoucher {
  voucher_id: string;
  voucher_type: VoucherType;
}

const VoucherSelector: React.FC<VoucherSelectorProps> = ({
  orderValue,
  shippingCost,
  onVouchersSelected,
  onClose,
  visible,
}) => {
  const { user, token } = useAuth();
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<SelectedVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (visible && token) {
      fetchAvailableVouchers();
    }
  }, [visible, orderValue, token]);

  const fetchAvailableVouchers = async () => {
    setLoading(true);
    try {
      const result = await getAvailableVouchers(undefined, orderValue);
      setAvailableVouchers(result.vouchers || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  const selectVoucher = (voucher: Voucher) => {
    const newSelected: SelectedVoucher = {
      voucher_id: voucher.voucher_id,
      voucher_type: voucher.voucher_type,
    };

    // Kiểm tra xem voucher này đã được chọn chưa
    const isAlreadySelected = selectedVouchers.some(
      v => v.voucher_id === voucher.voucher_id
    );

    if (isAlreadySelected) {
      // Bỏ chọn voucher
      setSelectedVouchers(prev => 
        prev.filter(v => v.voucher_id !== voucher.voucher_id)
      );
    } else {
      // Kiểm tra xem có thể chọn thêm voucher không
      const hasDiscountVoucher = selectedVouchers.some(v => v.voucher_type === 'discount');
      const hasShippingVoucher = selectedVouchers.some(v => v.voucher_type === 'shipping');

      if (voucher.voucher_type === 'discount' && hasDiscountVoucher) {
        Alert.alert('Thông báo', 'Chỉ có thể chọn 1 voucher giảm giá sản phẩm');
        return;
      }

      if (voucher.voucher_type === 'shipping' && hasShippingVoucher) {
        Alert.alert('Thông báo', 'Chỉ có thể chọn 1 voucher giảm phí vận chuyển');
        return;
      }

      // Chọn voucher mới
      setSelectedVouchers(prev => [...prev, newSelected]);
    }
  };

  const applyVouchers = async () => {
    if (selectedVouchers.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 voucher');
      return;
    }

    if (!user?._id || !token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng voucher');
      return;
    }

    setValidating(true);
    try {
      const request: MultipleVoucherValidationRequest = {
        vouchers: selectedVouchers,
        user_id: user._id,
        order_value: orderValue,
        shipping_cost: shippingCost,
      };

      const result = await validateMultipleVouchers(token, request);
      
      if (result.success) {
        onVouchersSelected(result);
        onClose();
      } else {
        Alert.alert('Lỗi', 'Không thể áp dụng voucher');
      }
    } catch (error: any) {
      console.error('Error applying vouchers:', error);
      Alert.alert('Lỗi', error.message || 'Không thể áp dụng voucher');
    } finally {
      setValidating(false);
    }
  };

  const isVoucherSelected = (voucherId: string) => {
    return selectedVouchers.some(v => v.voucher_id === voucherId);
  };

  const getVoucherDisplayValue = (voucher: Voucher) => {
    if (voucher.voucher_type === 'discount') {
      if (voucher.discount_type === 'percentage') {
        return `${voucher.discount_value}%`;
      } else {
        return `${voucher.discount_value?.toLocaleString('vi-VN')} VNĐ`;
      }
    } else {
      return `${voucher.shipping_discount?.toLocaleString('vi-VN')} VNĐ`;
    }
  };

  const getVoucherDescription = (voucher: Voucher) => {
    if (voucher.voucher_type === 'discount') {
      if (voucher.discount_type === 'percentage') {
        return `Giảm ${voucher.discount_value}% tối đa ${voucher.max_discount_value?.toLocaleString('vi-VN')} VNĐ`;
      } else {
        return `Giảm cố định ${voucher.discount_value?.toLocaleString('vi-VN')} VNĐ`;
      }
    } else {
      return `Giảm phí vận chuyển ${voucher.shipping_discount?.toLocaleString('vi-VN')} VNĐ`;
    }
  };

  const renderVoucherCard = (voucher: Voucher) => {
    const isSelected = isVoucherSelected(voucher.voucher_id);
    const isValid = voucher.isValid !== false;

    return (
      <TouchableOpacity
        key={voucher._id}
        style={[
          styles.voucherCard,
          isSelected && styles.selectedVoucherCard,
          !isValid && styles.invalidVoucherCard,
        ]}
        onPress={() => isValid && selectVoucher(voucher)}
        disabled={!isValid}
      >
        <View style={styles.voucherHeader}>
          <View style={styles.voucherTypeContainer}>
            <Ionicons
              name={voucher.voucher_type === 'discount' ? 'pricetag' : 'car'}
              size={16}
              color={isSelected ? '#fff' : '#3255FB'}
            />
            <Text style={[
              styles.voucherTypeText,
              isSelected && styles.selectedText
            ]}>
              {voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'}
            </Text>
          </View>
          
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          )}
        </View>

        <Text style={[
          styles.voucherCode,
          isSelected && styles.selectedText
        ]}>
          {voucher.voucher_id}
        </Text>

        <Text style={[
          styles.voucherValue,
          isSelected && styles.selectedText
        ]}>
          {getVoucherDisplayValue(voucher)}
        </Text>

        <Text style={[
          styles.voucherDescription,
          isSelected && styles.selectedText
        ]}>
          {getVoucherDescription(voucher)}
        </Text>

        <View style={styles.voucherConditions}>
          <Text style={[
            styles.conditionText,
            isSelected && styles.selectedText
          ]}>
            Đơn hàng tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')} VNĐ
          </Text>
          
          {voucher.remainingUsage !== undefined && (
            <Text style={[
              styles.conditionText,
              isSelected && styles.selectedText
            ]}>
              Còn lại: {voucher.remainingUsage} lượt
            </Text>
          )}
        </View>

        {!isValid && (
          <View style={styles.invalidOverlay}>
            <Text style={styles.invalidText}>Không khả dụng</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const discountVouchers = availableVouchers.filter(v => v.voucher_type === 'discount');
  const shippingVouchers = availableVouchers.filter(v => v.voucher_type === 'shipping');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chọn Voucher</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3255FB" />
            <Text style={styles.loadingText}>Đang tải voucher...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Discount Vouchers */}
            {discountVouchers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetag" size={20} color="#3255FB" />
                  <Text style={styles.sectionTitle}>Giảm Giá Sản Phẩm</Text>
                </View>
                <View style={styles.voucherGrid}>
                  {discountVouchers.map(renderVoucherCard)}
                </View>
              </View>
            )}

            {/* Shipping Vouchers */}
            {shippingVouchers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="car" size={20} color="#3255FB" />
                  <Text style={styles.sectionTitle}>Giảm Phí Vận Chuyển</Text>
                </View>
                <View style={styles.voucherGrid}>
                  {shippingVouchers.map(renderVoucherCard)}
                </View>
              </View>
            )}

            {availableVouchers.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Không có voucher khả dụng</Text>
                <Text style={styles.emptySubtext}>
                  Hiện tại không có voucher phù hợp với đơn hàng của bạn
                </Text>
              </View>
            )}

            {/* Selected Vouchers Summary */}
            {selectedVouchers.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedTitle}>
                  Đã chọn ({selectedVouchers.length} voucher):
                </Text>
                {selectedVouchers.map((selected, index) => {
                  const voucher = availableVouchers.find(v => v.voucher_id === selected.voucher_id);
                  return (
                    <Text key={index} style={styles.selectedVoucherText}>
                      • {selected.voucher_id} ({selected.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'})
                    </Text>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              (selectedVouchers.length === 0 || validating) && styles.disabledButton
            ]}
            onPress={applyVouchers}
            disabled={selectedVouchers.length === 0 || validating}
          >
            {validating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.applyButtonText}>
                Áp Dụng Voucher ({selectedVouchers.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  voucherGrid: {
    gap: 12,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  selectedVoucherCard: {
    borderColor: '#3255FB',
    backgroundColor: '#3255FB',
  },
  invalidVoucherCard: {
    opacity: 0.6,
    borderColor: '#dc3545',
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3255FB',
    marginLeft: 4,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  voucherValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3255FB',
    marginBottom: 8,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  voucherConditions: {
    gap: 4,
  },
  conditionText: {
    fontSize: 12,
    color: '#999',
  },
  selectedText: {
    color: '#fff',
  },
  invalidOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  invalidText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  selectedSummary: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  selectedVoucherText: {
    fontSize: 13,
    color: '#1976d2',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  applyButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoucherSelector;
