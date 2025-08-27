import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MultipleVoucherValidationResponse } from '../services/voucherService';

interface VoucherSummaryProps {
  voucherResult: MultipleVoucherValidationResponse | null;
  orderValue: number;
  shippingCost: number;
  onRemoveVouchers: () => void;
  onEditVouchers: () => void;
}

const VoucherSummary: React.FC<VoucherSummaryProps> = ({
  voucherResult,
  orderValue,
  shippingCost,
  onRemoveVouchers,
  onEditVouchers,
}) => {
  if (!voucherResult || voucherResult.results.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="ticket-outline" size={20} color="#666" />
            <Text style={styles.headerTitle}>Voucher</Text>
          </View>
          <TouchableOpacity onPress={onEditVouchers} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#3255FB" />
            <Text style={styles.addButtonText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const validVouchers = voucherResult.results.filter(v => v.valid);
  const totalDiscount = voucherResult.summary.total_discount;
  const finalAmount = voucherResult.summary.final_amount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="ticket" size={20} color="#3255FB" />
          <Text style={styles.headerTitle}>Voucher đã áp dụng</Text>
          <View style={styles.voucherCount}>
            <Text style={styles.voucherCountText}>
              {validVouchers.length} voucher
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onEditVouchers} style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#666" />
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemoveVouchers} style={styles.removeButton}>
            <Ionicons name="close" size={16} color="#dc3545" />
            <Text style={styles.removeButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.voucherList}
        contentContainerStyle={styles.voucherListContent}
      >
        {validVouchers.map((voucher, index) => (
          <View key={index} style={styles.voucherTag}>
            <Ionicons
              name={voucher.voucher_type === 'discount' ? 'pricetag' : 'car'}
              size={14}
              color="#3255FB"
            />
            <Text style={styles.voucherTagText}>
              {voucher.voucher_id}
            </Text>
            <Text style={styles.voucherTagValue}>
              -{voucher.discount_amount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summaryContainer}>
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

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tổng giảm giá:</Text>
          <Text style={styles.discountValue}>
            -{totalDiscount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Tổng cộng:</Text>
          <Text style={styles.finalValue}>
            {finalAmount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>

        <View style={styles.savingsContainer}>
          <Ionicons name="trending-down" size={16} color="#28a745" />
          <Text style={styles.savingsText}>
            Tiết kiệm {totalDiscount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
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
    marginBottom: 12,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3255FB',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#dc3545',
    marginLeft: 2,
  },
  voucherList: {
    marginBottom: 16,
  },
  voucherListContent: {
    paddingRight: 16,
  },
  voucherTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  voucherTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    marginLeft: 4,
    marginRight: 4,
  },
  voucherTagValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#28a745',
  },
  summaryContainer: {
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

export default VoucherSummary;
