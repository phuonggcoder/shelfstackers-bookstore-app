import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MultipleVoucherValidationResponse } from '../services/voucherService';
import CheckoutSummary from './CheckoutSummary';
import VoucherInput from './VoucherInput';
import VoucherSelector from './VoucherSelector';

interface EnhancedCheckoutScreenProps {
  navigation: any;
  route: any;
}

const EnhancedCheckoutScreen: React.FC<EnhancedCheckoutScreenProps> = ({
  navigation,
  route,
}) => {
  // Sample data - in real app, this would come from route params or context
  const subtotal = 500000; // 500k VND
  const shippingFee = 30000; // 30k VND
  
  // State for voucher management
  const [appliedVouchers, setAppliedVouchers] = useState<Array<{
    voucher: any;
    discountAmount: number;
  }>>([]);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [voucherResult, setVoucherResult] = useState<MultipleVoucherValidationResponse | null>(null);

  const handleVoucherApplied = (voucher: any, discountAmount: number) => {
    // Check if voucher type already exists
    const existingVoucherIndex = appliedVouchers.findIndex(
      item => item.voucher.voucher_type === voucher.voucher_type
    );

    if (existingVoucherIndex >= 0) {
      // Replace existing voucher of same type
      const newAppliedVouchers = [...appliedVouchers];
      newAppliedVouchers[existingVoucherIndex] = { voucher, discountAmount };
      setAppliedVouchers(newAppliedVouchers);
    } else {
      // Add new voucher
      setAppliedVouchers(prev => [...prev, { voucher, discountAmount }]);
    }
  };

  const handleVoucherRemoved = () => {
    setAppliedVouchers([]);
    setVoucherResult(null);
  };

  const handleVouchersSelected = (result: MultipleVoucherValidationResponse) => {
    setVoucherResult(result);
    
    // Convert result to applied vouchers format
    const newAppliedVouchers = result.results
      .filter(v => v.valid)
      .map(v => ({
        voucher: v.voucher,
        discountAmount: v.discount_amount,
      }));
    
    setAppliedVouchers(newAppliedVouchers);
  };

  const handleEditVouchers = () => {
    setShowVoucherSelector(true);
  };

  const handleProceedToPayment = () => {
    const totalDiscount = appliedVouchers.reduce((sum, item) => sum + item.discountAmount, 0);
    const finalAmount = subtotal - totalDiscount + shippingFee;
    
    Alert.alert(
      'Xác nhận thanh toán',
      `Tổng tiền: ${finalAmount.toLocaleString('vi-VN')} VNĐ\nGiảm giá: ${totalDiscount.toLocaleString('vi-VN')} VNĐ`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Thanh toán', onPress: () => {
          // Navigate to payment screen
          navigation.navigate('Payment', {
            subtotal,
            shippingFee,
            appliedVouchers,
            finalAmount,
          });
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Sách mẫu</Text>
              <Text style={styles.productPrice}>500.000 VNĐ</Text>
            </View>
            <Text style={styles.productQuantity}>x1</Text>
          </View>
        </View>

        {/* Voucher Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voucher</Text>
          <VoucherInput
            orderValue={subtotal}
            onVoucherApplied={handleVoucherApplied}
            onVoucherRemoved={handleVoucherRemoved}
            appliedVoucher={appliedVouchers.length > 0 ? appliedVouchers[0].voucher : undefined}
          />
        </View>

        {/* Checkout Summary */}
        <CheckoutSummary
          subtotal={subtotal}
          shippingFee={shippingFee}
          appliedVouchers={appliedVouchers}
          onEditVouchers={handleEditVouchers}
          showVoucherSection={true}
        />

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <TouchableOpacity style={styles.addressCard}>
            <View style={styles.addressInfo}>
              <Text style={styles.addressName}>Nguyễn Văn A</Text>
              <Text style={styles.addressPhone}>0123456789</Text>
              <Text style={styles.addressText}>
                123 Đường ABC, Quận 1, TP.HCM
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity style={styles.paymentCard}>
            <View style={styles.paymentInfo}>
              <Ionicons name="card-outline" size={24} color="#3255FB" />
              <Text style={styles.paymentText}>Thanh toán qua ZaloPay</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.payButton} onPress={handleProceedToPayment}>
          <Text style={styles.payButtonText}>Tiến hành thanh toán</Text>
        </TouchableOpacity>
      </View>

      {/* Voucher Selector Modal */}
      <VoucherSelector
        visible={showVoucherSelector}
        orderValue={subtotal}
        shippingCost={shippingFee}
        onVouchersSelected={handleVouchersSelected}
        onClose={() => setShowVoucherSelector(false)}
      />
    </SafeAreaView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
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
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  bottomAction: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  payButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedCheckoutScreen;
