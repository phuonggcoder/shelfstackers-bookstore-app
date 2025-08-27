import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getAvailableVouchers, validateMultipleVouchers } from '../services/voucherService';

interface VoucherSelectionScreenProps {
  navigation: any;
  route: any;
}

interface SelectedVoucher {
  voucher_id: string;
  voucher_type: 'discount' | 'shipping';
}

const VoucherSelectionScreen: React.FC<VoucherSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { token } = useAuth();
  const [orderValue, setOrderValue] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [onVouchersSelected, setOnVouchersSelected] = useState<((result: any) => void) | null>(null);
  
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<SelectedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    // Load params from AsyncStorage
    const loadParams = async () => {
      try {
        const paramsStr = await AsyncStorage.getItem('voucher_callback');
        if (paramsStr) {
          const params = JSON.parse(paramsStr);
          setOrderValue(params.orderValue || 0);
          setShippingCost(params.shippingCost || 0);
          // Clear the stored params
          await AsyncStorage.removeItem('voucher_callback');
        }
      } catch (error) {
        console.error('Error loading voucher params:', error);
      }
    };
    
    loadParams();
  }, []);

  useEffect(() => {
    if (orderValue > 0) {
      fetchAvailableVouchers();
    }
  }, [orderValue]);

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

  const selectVoucher = (voucher: any) => {
    const newSelected: SelectedVoucher = {
      voucher_id: voucher.voucher_id,
      voucher_type: voucher.voucher_type,
    };

    // Check if voucher is already selected
    const isAlreadySelected = selectedVouchers.some(
      v => v.voucher_id === voucher.voucher_id
    );

    if (isAlreadySelected) {
      // Remove voucher
      setSelectedVouchers(prev => 
        prev.filter(v => v.voucher_id !== voucher.voucher_id)
      );
    } else {
      // Check if we can add more vouchers
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

      // Add new voucher
      setSelectedVouchers(prev => [...prev, newSelected]);
    }
  };

  const applyVouchers = async () => {
    if (selectedVouchers.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 voucher');
      return;
    }

    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng voucher');
      return;
    }

    setApplying(true);
    try {
      const request = {
        vouchers: selectedVouchers,
        user_id: '', // Will be set by backend
        order_value: orderValue,
        shipping_cost: shippingCost,
      };

      const result = await validateMultipleVouchers('', request);
      
             if (result.success) {
         // Store result in AsyncStorage for CartScreen to read
         await AsyncStorage.setItem('voucher_result', JSON.stringify(result));
         navigation.goBack();
       } else {
        Alert.alert('Lỗi', 'Không thể áp dụng voucher');
      }
    } catch (error: any) {
      console.error('Error applying vouchers:', error);
      Alert.alert('Lỗi', error.message || 'Không thể áp dụng voucher');
    } finally {
      setApplying(false);
    }
  };

  const isVoucherSelected = (voucherId: string) => {
    return selectedVouchers.some(v => v.voucher_id === voucherId);
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

  const renderVoucherCard = ({ item: voucher }: { item: any }) => {
    const isSelected = isVoucherSelected(voucher.voucher_id);
    const isValid = voucher.isValid !== false;

    return (
      <TouchableOpacity
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn Voucher</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tải voucher...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn Voucher</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={[
          { type: 'header', title: 'Giảm Giá Sản Phẩm', icon: 'pricetag' },
          ...discountVouchers,
          { type: 'header', title: 'Giảm Phí Vận Chuyển', icon: 'car' },
          ...shippingVouchers,
        ]}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Ionicons name={item.icon} size={20} color="#3255FB" />
                <Text style={styles.sectionTitle}>{item.title}</Text>
              </View>
            );
          }
          return renderVoucherCard({ item });
        }}
        keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có voucher khả dụng</Text>
            <Text style={styles.emptySubtext}>
              Hiện tại không có voucher phù hợp với đơn hàng của bạn
            </Text>
          </View>
        }
      />

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

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.applyButton,
            (selectedVouchers.length === 0 || applying) && styles.disabledButton
          ]}
          onPress={applyVouchers}
          disabled={selectedVouchers.length === 0 || applying}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>
              Áp Dụng Voucher ({selectedVouchers.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 12,
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
    margin: 16,
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

export default VoucherSelectionScreen;
 