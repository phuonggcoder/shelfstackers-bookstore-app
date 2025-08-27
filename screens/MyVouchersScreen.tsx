import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getAvailableVouchers, getUserVoucherUsage } from '../services/voucherService';

interface MyVouchersScreenProps {
  navigation: any;
}

const MyVouchersScreen: React.FC<MyVouchersScreenProps> = ({ navigation }) => {
  const { token, user } = useAuth();
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch available vouchers
      const vouchersResult = await getAvailableVouchers();
      setAvailableVouchers(vouchersResult.vouchers || []);

      // Fetch usage history
      if (user?._id) {
        const historyResult = await getUserVoucherUsage('', user._id);
        setUsageHistory(historyResult.usage_history || []);
      }
    } catch (error) {
      console.error('Error fetching voucher data:', error);
    } finally {
      setLoading(false);
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

  const renderAvailableVoucher = ({ item: voucher }: { item: any }) => (
    <View style={styles.voucherCard}>
      <View style={styles.voucherHeader}>
        <View style={styles.voucherTypeContainer}>
          <Ionicons
            name={voucher.voucher_type === 'discount' ? 'pricetag' : 'car'}
            size={16}
            color="#3255FB"
          />
          <Text style={styles.voucherTypeText}>
            {voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship'}
          </Text>
        </View>
        <View style={styles.voucherStatus}>
          <Ionicons name="checkmark-circle" size={16} color="#28a745" />
          <Text style={styles.voucherStatusText}>Khả dụng</Text>
        </View>
      </View>

      <Text style={styles.voucherCode}>{voucher.voucher_id}</Text>
      <Text style={styles.voucherValue}>{getVoucherDisplayValue(voucher)}</Text>
      <Text style={styles.voucherDescription}>{getVoucherDescription(voucher)}</Text>

      <View style={styles.voucherConditions}>
        <Text style={styles.conditionText}>
          Đơn hàng tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')} VNĐ
        </Text>
        {voucher.remainingUsage !== undefined && (
          <Text style={styles.conditionText}>
            Còn lại: {voucher.remainingUsage} lượt
          </Text>
        )}
        <Text style={styles.conditionText}>
          HSD: {new Date(voucher.end_date).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </View>
  );

  const renderUsageHistory = ({ item: usage }: { item: any }) => (
    <View style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <View style={styles.usageInfo}>
          <Text style={styles.usageVoucherCode}>{usage.voucher_id}</Text>
          <Text style={styles.usageOrderId}>Đơn hàng: {usage.order_id}</Text>
        </View>
        <View style={styles.usageAmount}>
          <Text style={styles.usageAmountText}>
            -{usage.discount_amount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
      </View>

      <View style={styles.usageDetails}>
        <Text style={styles.usageDate}>
          Sử dụng: {new Date(usage.used_at).toLocaleDateString('vi-VN')}
        </Text>
        <Text style={styles.usageType}>
          {usage.voucher_type === 'discount' ? 'Giảm giá sản phẩm' : 'Giảm phí vận chuyển'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'available' ? 'ticket-outline' : 'time-outline'} 
        size={48} 
        color="#ccc" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'available' 
          ? 'Không có voucher khả dụng' 
          : 'Chưa có lịch sử sử dụng voucher'
        }
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'available'
          ? 'Hiện tại không có voucher phù hợp với bạn'
          : 'Các voucher đã sử dụng sẽ hiển thị ở đây'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voucher của tôi</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tải...</Text>
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
        <Text style={styles.headerTitle}>Voucher của tôi</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#3255FB" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Ionicons 
            name="ticket-outline" 
            size={18} 
            color={activeTab === 'available' ? '#3255FB' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Khả dụng ({availableVouchers.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === 'history' ? '#3255FB' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Đã sử dụng ({usageHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'available' ? availableVouchers : usageHistory}
        renderItem={activeTab === 'available' ? renderAvailableVoucher : renderUsageHistory}
        keyExtractor={(item) => item._id || `${item.voucher_id}-${item.used_at}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
  refreshButton: {
    padding: 4,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#3255FB',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  voucherStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherStatusText: {
    fontSize: 12,
    color: '#28a745',
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
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageInfo: {
    flex: 1,
  },
  usageVoucherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  usageOrderId: {
    fontSize: 12,
    color: '#666',
  },
  usageAmount: {
    alignItems: 'flex-end',
  },
  usageAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  usageDetails: {
    gap: 4,
  },
  usageDate: {
    fontSize: 12,
    color: '#999',
  },
  usageType: {
    fontSize: 12,
    color: '#666',
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
});

export default MyVouchersScreen;
