import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Voucher, VoucherType } from '../services/voucherService';

interface VoucherCardProps {
  voucher: Voucher;
  isSelected?: boolean;
  onPress?: () => void;
  showDetails?: boolean;
}

const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  isSelected = false,
  onPress,
  showDetails = true,
}) => {
  const getVoucherIcon = (type: VoucherType) => {
    return type === 'discount' ? 'pricetag' : 'car';
  };

  const getVoucherTypeText = (type: VoucherType) => {
    return type === 'discount' ? 'Giảm giá' : 'Giảm ship';
  };

  const getVoucherDisplayValue = () => {
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

  const getVoucherDescription = () => {
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

  const getValidityStatus = () => {
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    
    if (now < startDate) {
      return { status: 'upcoming', text: 'Sắp diễn ra', color: '#ffc107' };
    } else if (now > endDate) {
      return { status: 'expired', text: 'Đã hết hạn', color: '#dc3545' };
    } else {
      return { status: 'active', text: 'Đang hiệu lực', color: '#28a745' };
    }
  };

  const validityStatus = getValidityStatus();
  const isValid = voucher.isValid !== false && validityStatus.status === 'active';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        !isValid && styles.invalidContainer,
      ]}
      onPress={onPress}
      disabled={!isValid}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.voucherTypeContainer}>
          <Ionicons
            name={getVoucherIcon(voucher.voucher_type)}
            size={16}
            color={isSelected ? '#fff' : '#3255FB'}
          />
          <Text style={[
            styles.voucherTypeText,
            isSelected && styles.selectedText
          ]}>
            {getVoucherTypeText(voucher.voucher_type)}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: validityStatus.color + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: validityStatus.color }
            ]}>
              {validityStatus.text}
            </Text>
          </View>
        </View>
      </View>

      {/* Voucher Code */}
      <Text style={[
        styles.voucherCode,
        isSelected && styles.selectedText
      ]}>
        {voucher.voucher_id}
      </Text>

      {/* Voucher Value */}
      <Text style={[
        styles.voucherValue,
        isSelected && styles.selectedText
      ]}>
        {getVoucherDisplayValue()}
      </Text>

      {/* Description */}
      <Text style={[
        styles.description,
        isSelected && styles.selectedText
      ]}>
        {getVoucherDescription()}
      </Text>

      {/* Conditions */}
      <View style={styles.conditionsContainer}>
        <View style={styles.conditionRow}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={isSelected ? '#fff' : '#28a745'}
          />
          <Text style={[
            styles.conditionText,
            isSelected && styles.selectedText
          ]}>
            Đơn hàng tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>

        {voucher.remainingUsage !== undefined && (
          <View style={styles.conditionRow}>
            <Ionicons
              name="time"
              size={14}
              color={isSelected ? '#fff' : '#ffc107'}
            />
            <Text style={[
              styles.conditionText,
              isSelected && styles.selectedText
            ]}>
              Còn lại: {voucher.remainingUsage} lượt
            </Text>
          </View>
        )}

        {voucher.max_per_user > 1 && (
          <View style={styles.conditionRow}>
            <Ionicons
              name="person"
              size={14}
              color={isSelected ? '#fff' : '#6c757d'}
            />
            <Text style={[
              styles.conditionText,
              isSelected && styles.selectedText
            ]}>
              Tối đa {voucher.max_per_user} lần/người
            </Text>
          </View>
        )}
      </View>

      {/* Validity Period */}
      <View style={styles.validityContainer}>
        <Ionicons
          name="calendar"
          size={14}
          color={isSelected ? '#fff' : '#6c757d'}
        />
        <Text style={[
          styles.validityText,
          isSelected && styles.selectedText
        ]}>
          {new Date(voucher.start_date).toLocaleDateString('vi-VN')} - {new Date(voucher.end_date).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      {/* Selection Indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </View>
      )}

      {/* Invalid Overlay */}
      {!isValid && (
        <View style={styles.invalidOverlay}>
          <Ionicons name="close-circle" size={32} color="#dc3545" />
          <Text style={styles.invalidText}>
            {validityStatus.status === 'expired' ? 'Đã hết hạn' : 'Không khả dụng'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedContainer: {
    borderColor: '#3255FB',
    backgroundColor: '#3255FB',
    shadowColor: '#3255FB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  invalidContainer: {
    opacity: 0.6,
    borderColor: '#dc3545',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  voucherCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  voucherValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3255FB',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  conditionsContainer: {
    marginBottom: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conditionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  validityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  selectedText: {
    color: '#fff',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    borderRadius: 16,
  },
  invalidText: {
    color: '#dc3545',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 12,
  },
});

export default VoucherCard;
