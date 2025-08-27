import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface VoucherDemo {
  voucher_id: string;
  voucher_type: 'discount' | 'shipping';
  discount_type?: 'fixed' | 'percentage';
  discount_value?: number;
  shipping_discount?: number;
  min_order_value: number;
  max_discount_value?: number;
  description: string;
}

const VoucherSystemDemo: React.FC = () => {
  const [orderValue, setOrderValue] = useState('250000');
  const [shippingCost, setShippingCost] = useState('30000');
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Sample vouchers
  const sampleVouchers: VoucherDemo[] = [
    {
      voucher_id: 'SUMMER2024',
      voucher_type: 'discount',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_value: 100000,
      max_discount_value: 50000,
      description: 'Giảm 20% tối đa 50k'
    },
    {
      voucher_id: 'FREESHIP',
      voucher_type: 'shipping',
      shipping_discount: 25000,
      min_order_value: 200000,
      description: 'Miễn phí ship 25k'
    },
    {
      voucher_id: 'FIXED30K',
      voucher_type: 'discount',
      discount_type: 'fixed',
      discount_value: 30000,
      min_order_value: 150000,
      description: 'Giảm cố định 30k'
    }
  ];

  const toggleVoucher = (voucherId: string) => {
    setSelectedVouchers(prev => 
      prev.includes(voucherId) 
        ? prev.filter(id => id !== voucherId)
        : [...prev, voucherId]
    );
  };

  const calculateDiscount = () => {
    const orderVal = parseInt(orderValue) || 0;
    const shippingVal = parseInt(shippingCost) || 0;
    let totalDiscount = 0;

    selectedVouchers.forEach(voucherId => {
      const voucher = sampleVouchers.find(v => v.voucher_id === voucherId);
      if (!voucher) return;

      if (voucher.voucher_type === 'discount') {
        if (voucher.discount_type === 'percentage') {
          const discount = (orderVal * (voucher.discount_value || 0)) / 100;
          totalDiscount += Math.min(discount, voucher.max_discount_value || 0);
        } else {
          totalDiscount += voucher.discount_value || 0;
        }
      } else if (voucher.voucher_type === 'shipping') {
        totalDiscount += Math.min(voucher.shipping_discount || 0, shippingVal);
      }
    });

    setDiscountAmount(totalDiscount);
  };

  const getVoucherDisplayValue = (voucher: VoucherDemo) => {
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

  const getVoucherIcon = (type: string) => {
    return type === 'discount' ? 'pricetag' : 'car';
  };

  const getVoucherColor = (type: string) => {
    return type === 'discount' ? '#e74c3c' : '#3498db';
  };

  const finalAmount = (parseInt(orderValue) || 0) - discountAmount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="ticket" size={32} color="#3255FB" />
        <Text style={styles.title}>Voucher System Demo</Text>
        <Text style={styles.subtitle}>Hệ thống voucher đa loại</Text>
      </View>

      {/* Order Input */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
        
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Giá trị đơn hàng (VNĐ):</Text>
          <TextInput
            style={styles.input}
            value={orderValue}
            onChangeText={setOrderValue}
            keyboardType="numeric"
            placeholder="250000"
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Phí vận chuyển (VNĐ):</Text>
          <TextInput
            style={styles.input}
            value={shippingCost}
            onChangeText={setShippingCost}
            keyboardType="numeric"
            placeholder="30000"
          />
        </View>
      </View>

      {/* Available Vouchers */}
      <View style={styles.voucherSection}>
        <Text style={styles.sectionTitle}>Voucher khả dụng</Text>
        
        {sampleVouchers.map((voucher) => {
          const isSelected = selectedVouchers.includes(voucher.voucher_id);
          const isValid = (parseInt(orderValue) || 0) >= voucher.min_order_value;
          
          return (
            <TouchableOpacity
              key={voucher.voucher_id}
              style={[
                styles.voucherCard,
                isSelected && styles.selectedVoucherCard,
                !isValid && styles.invalidVoucherCard
              ]}
              onPress={() => isValid && toggleVoucher(voucher.voucher_id)}
              disabled={!isValid}
            >
              <View style={styles.voucherHeader}>
                <View style={styles.voucherTypeContainer}>
                  <Ionicons
                    name={getVoucherIcon(voucher.voucher_type)}
                    size={20}
                    color={isSelected ? '#fff' : getVoucherColor(voucher.voucher_type)}
                  />
                  <Text style={[
                    styles.voucherTypeText,
                    isSelected && styles.selectedText
                  ]}>
                    {voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'}
                  </Text>
                </View>
                
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
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
                {voucher.description}
              </Text>

              <Text style={[
                styles.voucherCondition,
                isSelected && styles.selectedText
              ]}>
                Đơn hàng tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')} VNĐ
              </Text>

              {!isValid && (
                <View style={styles.invalidOverlay}>
                  <Text style={styles.invalidText}>Không đủ điều kiện</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={styles.calculateButton}
        onPress={calculateDiscount}
      >
        <Ionicons name="calculator" size={20} color="#fff" />
        <Text style={styles.calculateButtonText}>Tính toán giảm giá</Text>
      </TouchableOpacity>

      {/* Results */}
      {discountAmount > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Kết quả</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Giá trị đơn hàng:</Text>
            <Text style={styles.resultValue}>
              {(parseInt(orderValue) || 0).toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Phí vận chuyển:</Text>
            <Text style={styles.resultValue}>
              {(parseInt(shippingCost) || 0).toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tổng giảm giá:</Text>
            <Text style={[styles.resultValue, styles.discountValue]}>
              -{discountAmount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>

          <View style={[styles.resultRow, styles.finalRow]}>
            <Text style={styles.finalLabel}>Tổng cộng:</Text>
            <Text style={styles.finalValue}>
              {finalAmount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>

          {selectedVouchers.length > 0 && (
            <View style={styles.appliedVouchers}>
              <Text style={styles.appliedTitle}>Voucher đã áp dụng:</Text>
              {selectedVouchers.map(voucherId => (
                <Text key={voucherId} style={styles.appliedVoucher}>
                  • {voucherId}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Tính năng hệ thống</Text>
        
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          <Text style={styles.featureText}>Áp dụng đồng thời nhiều loại voucher</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          <Text style={styles.featureText}>Validation chặt chẽ với transaction</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          <Text style={styles.featureText}>Tính toán discount chính xác</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          <Text style={styles.featureText}>Quản lý usage limit và user limit</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          <Text style={styles.featureText}>API đầy đủ cho admin và user</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  inputSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    textAlign: 'right',
  },
  voucherSection: {
    margin: 16,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginLeft: 8,
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
    marginBottom: 8,
  },
  voucherCondition: {
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
  calculateButton: {
    backgroundColor: '#3255FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    color: '#e74c3c',
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    marginTop: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3255FB',
  },
  appliedVouchers: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  appliedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  appliedVoucher: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  featuresSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
});

export default VoucherSystemDemo;
