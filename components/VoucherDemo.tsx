import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useVoucher } from '../hooks/useVoucher';
import { MultipleVoucherValidationResponse } from '../services/voucherService';
import VoucherSelector from './VoucherSelector';
import VoucherSummary from './VoucherSummary';
import VoucherUsageHistory from './VoucherUsageHistory';

const VoucherDemo: React.FC = () => {
  const [orderValue, setOrderValue] = useState(250000);
  const [shippingCost, setShippingCost] = useState(30000);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [showUsageHistory, setShowUsageHistory] = useState(false);

  const {
    voucherResult,
    isApplying,
    isUsing,
    applyVouchers,
    useVouchers,
    clearVouchers,
    getTotalDiscount,
    getFinalAmount,
    getAppliedVouchersCount,
  } = useVoucher({ orderValue, shippingCost });

  const handleVouchersSelected = (result: MultipleVoucherValidationResponse) => {
    console.log('Vouchers selected:', result);
    // The voucher result is already set in the hook
  };

  const handleRemoveVouchers = () => {
    clearVouchers();
  };

  const handleEditVouchers = () => {
    setShowVoucherSelector(true);
  };

  const handleTestOrder = async () => {
    if (getAppliedVouchersCount() === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn voucher trước khi test đặt hàng');
      return;
    }

    const success = await useVouchers('test-order-123');
    if (success) {
      Alert.alert('Thành công', 'Voucher đã được sử dụng thành công!');
    }
  };

  const handleChangeOrderValue = (newValue: number) => {
    setOrderValue(newValue);
    // Clear vouchers when order value changes
    clearVouchers();
  };

  const handleChangeShippingCost = (newCost: number) => {
    setShippingCost(newCost);
    // Clear vouchers when shipping cost changes
    clearVouchers();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎫 Demo Hệ Thống Voucher Đa Loại</Text>
          <Text style={styles.subtitle}>
            Hỗ trợ áp dụng đồng thời Discount + Shipping Voucher
          </Text>
        </View>

        {/* Order Configuration */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>⚙️ Cấu Hình Đơn Hàng</Text>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Giá trị đơn hàng:</Text>
            <View style={styles.configButtons}>
              {[100000, 150000, 200000, 250000, 300000].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.configButton,
                    orderValue === value && styles.configButtonActive
                  ]}
                  onPress={() => handleChangeOrderValue(value)}
                >
                  <Text style={[
                    styles.configButtonText,
                    orderValue === value && styles.configButtonTextActive
                  ]}>
                    {value.toLocaleString('vi-VN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Phí vận chuyển:</Text>
            <View style={styles.configButtons}>
              {[15000, 20000, 25000, 30000, 35000].map((cost) => (
                <TouchableOpacity
                  key={cost}
                  style={[
                    styles.configButton,
                    shippingCost === cost && styles.configButtonActive
                  ]}
                  onPress={() => handleChangeShippingCost(cost)}
                >
                  <Text style={[
                    styles.configButtonText,
                    shippingCost === cost && styles.configButtonTextActive
                  ]}>
                    {cost.toLocaleString('vi-VN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>📊 Tổng Quan Đơn Hàng</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giá sản phẩm:</Text>
              <Text style={styles.summaryValue}>
                {orderValue.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
              <Text style={styles.summaryValue}>
                {shippingCost.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>

            {getTotalDiscount() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá:</Text>
                <Text style={styles.discountValue}>
                  -{getTotalDiscount().toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.finalLabel}>Tổng cộng:</Text>
              <Text style={styles.finalValue}>
                {getFinalAmount().toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>

            {getTotalDiscount() > 0 && (
              <View style={styles.savingsContainer}>
                <Ionicons name="trending-down" size={16} color="#28a745" />
                <Text style={styles.savingsText}>
                  Tiết kiệm {getTotalDiscount().toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Voucher Summary */}
        <VoucherSummary
          voucherResult={voucherResult}
          orderValue={orderValue}
          shippingCost={shippingCost}
          onRemoveVouchers={handleRemoveVouchers}
          onEditVouchers={handleEditVouchers}
        />

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowVoucherSelector(true)}
          >
            <Ionicons name="ticket" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Chọn Voucher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton
            ]}
            onPress={() => setShowUsageHistory(true)}
          >
            <Ionicons name="time" size={20} color="#3255FB" />
            <Text style={styles.secondaryButtonText}>Lịch Sử Sử Dụng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.testButton,
              getAppliedVouchersCount() === 0 && styles.disabledButton
            ]}
            onPress={handleTestOrder}
            disabled={getAppliedVouchersCount() === 0 || isUsing}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {isUsing ? 'Đang xử lý...' : 'Test Đặt Hàng'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ℹ️ Thông Tin Hệ Thống</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.infoText}>
                Hỗ trợ áp dụng đồng thời 1 Discount + 1 Shipping voucher
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.infoText}>
                Validation chặt chẽ với transaction
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.infoText}>
                Tính toán discount chính xác
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.infoText}>
                Quản lý usage limit và user limit
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <VoucherSelector
        visible={showVoucherSelector}
        orderValue={orderValue}
        shippingCost={shippingCost}
        onVouchersSelected={handleVouchersSelected}
        onClose={() => setShowVoucherSelector(false)}
      />

      <Modal
        visible={showUsageHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUsageHistory(false)}
      >
        <VoucherUsageHistory
          visible={showUsageHistory}
          onClose={() => setShowUsageHistory(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  configSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  configRow: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  configButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  configButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  configButtonActive: {
    backgroundColor: '#3255FB',
    borderColor: '#3255FB',
  },
  configButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  configButtonTextActive: {
    color: '#fff',
  },
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3255FB',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4edda',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    marginLeft: 4,
  },
  actionSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3255FB',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3255FB',
  },
  testButton: {
    backgroundColor: '#28a745',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3255FB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default VoucherDemo;
