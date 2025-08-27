import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserVoucherUsage } from '../services/voucherService';

interface VoucherUsage {
  _id: string;
  voucher_id: string;
  voucher_type: 'discount' | 'shipping';
  discount_amount: number;
  order_value: number;
  used_at: string;
  order_id: string;
}

interface VoucherUsageHistoryProps {
  visible: boolean;
  onClose: () => void;
}

const VoucherUsageHistory: React.FC<VoucherUsageHistoryProps> = ({
  visible,
  onClose,
}) => {
  const { user, token } = useAuth();
  const [usageHistory, setUsageHistory] = useState<VoucherUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (visible && token && user?._id) {
      loadUsageHistory();
    }
  }, [visible, token, user?._id]);

  const loadUsageHistory = async (isRefresh = false) => {
    if (!token || !user?._id) return;

    const currentPage = isRefresh ? 1 : page;
    setLoading(!isRefresh);

    try {
      const result = await getUserVoucherUsage(token, user._id, currentPage, 20);
      
      if (result.success) {
        const newHistory = result.data || [];
        
        if (isRefresh) {
          setUsageHistory(newHistory);
          setPage(1);
        } else {
          setUsageHistory(prev => [...prev, ...newHistory]);
        }
        
        setHasMore(newHistory.length === 20);
      }
    } catch (error: any) {
      console.error('Error loading voucher usage history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử sử dụng voucher');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsageHistory(true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      loadUsageHistory();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVoucherTypeIcon = (type: 'discount' | 'shipping') => {
    return type === 'discount' ? 'pricetag' : 'car';
  };

  const getVoucherTypeText = (type: 'discount' | 'shipping') => {
    return type === 'discount' ? 'Giảm giá' : 'Giảm ship';
  };

  const renderUsageItem = ({ item }: { item: VoucherUsage }) => (
    <View style={styles.usageItem}>
      <View style={styles.usageHeader}>
        <View style={styles.voucherInfo}>
          <View style={styles.voucherTypeContainer}>
            <Ionicons
              name={getVoucherTypeIcon(item.voucher_type)}
              size={16}
              color="#3255FB"
            />
            <Text style={styles.voucherTypeText}>
              {getVoucherTypeText(item.voucher_type)}
            </Text>
          </View>
          <Text style={styles.voucherCode}>{item.voucher_id}</Text>
        </View>
        
        <View style={styles.discountContainer}>
          <Text style={styles.discountAmount}>
            -{item.discount_amount.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
      </View>

      <View style={styles.usageDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="receipt" size={14} color="#666" />
          <Text style={styles.detailText}>
            Đơn hàng: {item.order_id}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="card" size={14} color="#666" />
          <Text style={styles.detailText}>
            Giá trị: {item.order_value.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(item.used_at)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có lịch sử sử dụng</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa sử dụng voucher nào. Hãy thử áp dụng voucher trong lần mua hàng tiếp theo!
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Đã hiển thị tất cả</Text>
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#3255FB" />
          <Text style={styles.footerText}>Đang tải...</Text>
        </View>
      );
    }
    
    return null;
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Sử Sử Dụng Voucher</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={usageHistory}
        renderItem={renderUsageItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3255FB']}
            tintColor="#3255FB"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  usageItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  },
  discountContainer: {
    alignItems: 'flex-end',
  },
  discountAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  usageDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default VoucherUsageHistory;
