import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAvailableVouchers } from '../services/voucherService';

interface VoucherNotificationProps {
  onVoucherPress?: () => void;
  showCount?: boolean;
  maxCount?: number;
}

const VoucherNotification: React.FC<VoucherNotificationProps> = ({
  onVoucherPress,
  showCount = true,
  maxCount = 3,
}) => {
  const { token } = useAuth();
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAvailableVouchers();
    }
  }, [token]);

  const fetchAvailableVouchers = async () => {
    setLoading(true);
    try {
      const result = await getAvailableVouchers();
      const vouchers = result.vouchers || [];
      // Filter for active vouchers and limit count
      const activeVouchers = vouchers
        .filter(v => v.isValid !== false)
        .slice(0, maxCount);
      setAvailableVouchers(activeVouchers);
    } catch (error) {
      console.error('Error fetching vouchers for notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherPress = () => {
    if (onVoucherPress) {
      onVoucherPress();
    } else {
      Alert.alert('Voucher', 'Chức năng voucher sẽ được mở trong phiên bản tiếp theo');
    }
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

  if (loading || availableVouchers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.notificationCard} onPress={handleVoucherPress}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons name="gift" size={20} color="#fff" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              Voucher khả dụng cho bạn!
            </Text>
            <Text style={styles.notificationSubtitle}>
              {showCount && availableVouchers.length > 0 
                ? `${availableVouchers.length} voucher đang chờ bạn sử dụng`
                : 'Có voucher mới dành cho bạn'
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>

        {/* Show top vouchers */}
        {availableVouchers.slice(0, 2).map((voucher, index) => (
          <View key={index} style={styles.voucherPreview}>
            <View style={styles.voucherPreviewInfo}>
              <Ionicons
                name={voucher.voucher_type === 'discount' ? 'pricetag' : 'car'}
                size={14}
                color="#3255FB"
              />
              <Text style={styles.voucherPreviewCode}>
                {voucher.voucher_id}
              </Text>
              <View style={styles.voucherPreviewType}>
                <Text style={styles.voucherPreviewTypeText}>
                  {voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'}
                </Text>
              </View>
            </View>
            <Text style={styles.voucherPreviewValue}>
              {getVoucherDisplayValue(voucher)}
            </Text>
          </View>
        ))}

        {availableVouchers.length > 2 && (
          <View style={styles.moreVouchers}>
            <Text style={styles.moreVouchersText}>
              +{availableVouchers.length - 2} voucher khác
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  notificationCard: {
    backgroundColor: '#fff',
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
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3255FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  voucherPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  voucherPreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherPreviewCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976d2',
    marginLeft: 6,
  },
  voucherPreviewType: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  voucherPreviewTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  voucherPreviewValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#28a745',
  },
  moreVouchers: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreVouchersText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default VoucherNotification;
