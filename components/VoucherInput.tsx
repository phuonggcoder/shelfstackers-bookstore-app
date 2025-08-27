import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateVoucher } from '../services/voucherService';

interface VoucherInputProps {
  orderValue: number;
  onVoucherApplied: (voucher: any, discountAmount: number) => void;
  onVoucherRemoved: () => void;
  appliedVoucher?: any;
}

const VoucherInput: React.FC<VoucherInputProps> = ({
  orderValue,
  onVoucherApplied,
  onVoucherRemoved,
  appliedVoucher,
}) => {
  const { token } = useAuth();
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setError('Vui lòng nhập mã voucher');
      return;
    }

    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng voucher');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await validateVoucher(token, voucherCode.trim().toUpperCase(), orderValue);
      
      if (result.valid && result.voucher) {
        const discountAmount = result.discount_amount || 0;
        onVoucherApplied(result.voucher, discountAmount);
        setVoucherCode('');
        setError('');
      } else {
        setError(result.message || 'Mã voucher không hợp lệ');
      }
    } catch (error: any) {
      console.error('Error applying voucher:', error);
      setError(error.message || 'Không thể áp dụng voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    onVoucherRemoved();
    setVoucherCode('');
    setError('');
  };

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

  if (appliedVoucher) {
    return (
      <View style={styles.container}>
        <View style={styles.appliedVoucherContainer}>
          <View style={styles.appliedVoucherHeader}>
            <View style={styles.appliedVoucherInfo}>
              <Ionicons
                name={appliedVoucher.voucher_type === 'discount' ? 'pricetag' : 'car'}
                size={20}
                color="#28a745"
              />
              <Text style={styles.appliedVoucherCode}>
                {appliedVoucher.voucher_id}
              </Text>
              <View style={styles.appliedVoucherType}>
                <Text style={styles.appliedVoucherTypeText}>
                  {appliedVoucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleRemoveVoucher}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={24} color="#dc3545" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.appliedVoucherValue}>
            {getVoucherDisplayValue(appliedVoucher)}
          </Text>
          
          <Text style={styles.appliedVoucherDescription}>
            {getVoucherDescription(appliedVoucher)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="ticket-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Nhập mã voucher"
            placeholderTextColor="#999"
            value={voucherCode}
            onChangeText={setVoucherCode}
            autoCapitalize="characters"
            maxLength={20}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.applyButton,
            (!voucherCode.trim() || loading) && styles.disabledButton
          ]}
          onPress={handleApplyVoucher}
          disabled={!voucherCode.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Áp dụng</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  applyButton: {
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 4,
  },
  appliedVoucherContainer: {
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  appliedVoucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appliedVoucherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedVoucherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginLeft: 8,
  },
  appliedVoucherType: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  appliedVoucherTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  removeButton: {
    padding: 4,
  },
  appliedVoucherValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  appliedVoucherDescription: {
    fontSize: 14,
    color: '#155724',
  },
});

export default VoucherInput;
