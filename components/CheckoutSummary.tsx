import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CheckoutSummaryProps {
  subtotal: number;
  shippingFee: number;
  appliedVouchers: Array<{
    voucher: any;
    discountAmount: number;
  }>;
  onEditVouchers: () => void;
  showVoucherSection?: boolean;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  subtotal,
  shippingFee,
  appliedVouchers,
  onEditVouchers,
  showVoucherSection = true,
}) => {
  const totalDiscount = appliedVouchers.reduce((sum, item) => sum + item.discountAmount, 0);
  const finalAmount = subtotal - totalDiscount + shippingFee;

  const getVoucherDisplayValue = (voucher: any) => {
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

  const getVoucherDescription = (voucher: any) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="receipt-outline" size={20} color="#333" />
          <Text style={styles.headerTitle}>Tóm tắt đơn hàng</Text>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giá sản phẩm:</Text>
          <Text style={styles.summaryValue}>
            {subtotal.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
          <Text style={styles.summaryValue}>
            {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} VNĐ`}
          </Text>
        </View>
      </View>

      {/* Voucher Section */}
      {showVoucherSection && (
        <View style={styles.voucherSection}>
          <View style={styles.voucherHeader}>
            <View style={styles.voucherHeaderLeft}>
              <Ionicons name="ticket-outline" size={18} color="#666" />
              <Text style={styles.voucherSectionTitle}>Voucher</Text>
              {appliedVouchers.length > 0 && (
                <View style={styles.voucherCount}>
                  <Text style={styles.voucherCountText}>
                    {appliedVouchers.length} voucher
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onEditVouchers} style={styles.editVoucherButton}>
              <Ionicons name="create-outline" size={16} color="#3255FB" />
              <Text style={styles.editVoucherText}>
                {appliedVouchers.length > 0 ? 'Sửa' : 'Thêm'}
              </Text>
            </TouchableOpacity>
          </View>

          {appliedVouchers.length > 0 ? (
            <View style={styles.appliedVouchersList}>
              {appliedVouchers.map((item, index) => (
                <View key={index} style={styles.appliedVoucherItem}>
                  <View style={styles.voucherInfo}>
                    <Ionicons
                      name={item.voucher.voucher_type === 'discount' ? 'pricetag' : 'car'}
                      size={16}
                      color="#3255FB"
                    />
                    <Text style={styles.voucherCode}>
                      {item.voucher.voucher_id}
                    </Text>
                    <View style={styles.voucherType}>
                      <Text style={styles.voucherTypeText}>
                        {item.voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.voucherDiscount}>
                    -{item.discountAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity onPress={onEditVouchers} style={styles.addVoucherButton}>
              <Ionicons name="add-circle-outline" size={20} color="#3255FB" />
              <Text style={styles.addVoucherText}>Thêm voucher</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Total Discount */}
      {totalDiscount > 0 && (
        <View style={styles.discountSection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng giảm giá:</Text>
            <Text style={styles.discountValue}>
              -{totalDiscount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        </View>
      )}

      {/* Final Total */}
      <View style={styles.finalSection}>
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Tổng cộng:</Text>
          <Text style={styles.finalValue}>
            {finalAmount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>

        {totalDiscount > 0 && (
          <View style={styles.savingsContainer}>
            <Ionicons name="trending-down" size={16} color="#28a745" />
            <Text style={styles.savingsText}>
              Tiết kiệm {totalDiscount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  summarySection: {
    marginBottom: 16,
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
  voucherSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  voucherCount: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  voucherCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  editVoucherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editVoucherText: {
    fontSize: 12,
    color: '#3255FB',
    marginLeft: 2,
  },
  addVoucherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  addVoucherText: {
    flex: 1,
    fontSize: 14,
    color: '#3255FB',
    marginLeft: 8,
  },
  appliedVouchersList: {
    gap: 8,
  },
  appliedVoucherItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  voucherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976d2',
    marginLeft: 6,
  },
  voucherType: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  voucherTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  voucherDiscount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#28a745',
  },
  discountSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  finalSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    marginLeft: 4,
  },
});

export default CheckoutSummary;
