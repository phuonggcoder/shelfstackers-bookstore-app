import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getOrderDetail } from '../services/orderService';
import { formatVND, getBookImageUrl } from '../utils/format';

export default function OrderDetailScreen() {
  // State cho hoàn tiền
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundStatus, setRefundStatus] = useState<string|null>(null);
  const { token } = useAuth();
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!token || !orderId) return;
      try {
        setLoading(true);
        const orderData = await getOrderDetail(token, orderId as string);
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();
  }, [token, orderId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#3255FB';
      case 'shipped':
        return '#4CAF50';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status || 'Không xác định';
    }
  };

  const formatAddressText = (addr: any) => {
    if (!addr) return '';
    const parts = [];
    if (addr.address_detail) parts.push(addr.address_detail);
    if (addr.ward) parts.push(addr.ward);
    if (addr.district) parts.push(addr.district);
    if (addr.province) parts.push(addr.province);
    return parts.join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Hàm gọi API hoàn tiền
  const handleRefund = async () => {
    if (!order?.payment?._id) {
      Alert.alert('Không tìm thấy thông tin thanh toán!');
      return;
    }
    setIsRefunding(true);
    try {
      // Chỉ admin mới được hoàn tiền, cần token admin
      const res = await fetch(`https://server-shelf-stacker.onrender.com/api/payments/${order.payment._id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: 'Hoàn tiền đơn hàng #' + order.order_id })
      });
      const data = await res.json();
      if (data.success) {
        setRefundStatus('Thành công');
        Alert.alert('Hoàn tiền thành công!');
      } else {
        setRefundStatus('Thất bại');
        Alert.alert('Hoàn tiền thất bại!', data.message || 'Có lỗi xảy ra');
      }
    } catch (e) {
      setRefundStatus('Thất bại');
      Alert.alert('Hoàn tiền thất bại!', e.message || 'Có lỗi xảy ra');
    }
    setIsRefunding(false);
  };

  // Hàm kiểm tra trạng thái hoàn tiền
  const handleQueryRefund = async () => {
    if (!order?.payment?.m_refund_id) {
      Alert.alert('Không tìm thấy mã hoàn tiền!');
      return;
    }
    try {
      const res = await fetch(`https://server-shelf-stacker.onrender.com/api/payments/query_refund`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ m_refund_id: order.payment.m_refund_id })
      });
      const data = await res.json();
      setRefundStatus(data.status || JSON.stringify(data));
      Alert.alert('Trạng thái hoàn tiền', data.status || JSON.stringify(data));
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Không kiểm tra được trạng thái hoàn tiền');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Nút hoàn tiền cho admin (chỉ hiển thị nếu là ZaloPay và trạng thái chưa hoàn tiền) */}
        {order?.payment?.payment_method === 'ZALOPAY' && order?.payment?.payment_status !== 'REFUNDED' && (
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#F44336', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8, opacity: isRefunding ? 0.6 : 1 }}
              onPress={handleRefund}
              disabled={isRefunding}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isRefunding ? 'Đang hoàn tiền...' : 'Hoàn tiền ZaloPay'}</Text>
            </TouchableOpacity>
            {order?.payment?.m_refund_id && (
              <TouchableOpacity
                style={{ backgroundColor: '#3255FB', padding: 12, borderRadius: 8, alignItems: 'center' }}
                onPress={handleQueryRefund}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kiểm tra trạng thái hoàn tiền</Text>
              </TouchableOpacity>
            )}
            {refundStatus && (
              <Text style={{ marginTop: 8, color: '#222', textAlign: 'center' }}>Trạng thái hoàn tiền: {refundStatus}</Text>
            )}
          </View>
        )}
        {/* Order Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.order_status) }]} />
            <Text style={styles.statusText}>{getStatusText(order.order_status)}</Text>
          </View>
          <Text style={styles.orderId}>Mã đơn hàng: {order.order_id}</Text>
          <Text style={styles.orderDate}>Ngày đặt: {formatDate(order.order_date)}</Text>
        </View>

        {/* Order Items */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Sản phẩm đã mua</Text>
        </View>
        
        {order.order_items && order.order_items.map((item: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Image 
              source={{ uri: getBookImageUrl(item.book) }} 
              style={styles.bookImage} 
              contentFit="cover"
              transition={200}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.bookTitle}>{item.book?.title || 'Không có tên'}</Text>
              <Text style={styles.bookAuthor}>Tác giả: {item.book?.author || ''}</Text>
              <Text style={styles.bookPrice}>{formatVND(item.price || 0)}</Text>
              <Text style={styles.qty}>Số lượng: {item.quantity || 1}</Text>
              <Text style={styles.itemTotal}>Tổng: {formatVND((item.price || 0) * (item.quantity || 1))}</Text>
            </View>
          </View>
        ))}

        {/* Shipping Address */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Địa chỉ giao hàng</Text>
        </View>
        
        {order.address && (
          <View style={styles.addressContainer}>
            <Text style={styles.addressName}>{order.address.receiver_name}</Text>
            <Text style={styles.addressPhone}>{order.address.phone_number}</Text>
            <Text style={styles.addressText}>{formatAddressText(order.address)}</Text>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Thông tin thanh toán</Text>
        </View>
        
        <View style={styles.paymentContainer}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phương thức:</Text>
            <Text style={styles.paymentValue}>{order.payment?.payment_method || 'COD'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Trạng thái:</Text>
            <Text style={[styles.paymentValue, { color: getStatusColor(order.payment?.payment_status) }]}>
              {getStatusText(order.payment?.payment_status)}
            </Text>
          </View>
          {order.payment?.payment_date && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Ngày thanh toán:</Text>
              <Text style={styles.paymentValue}>{formatDate(order.payment.payment_date)}</Text>
            </View>
          )}
        </View>

        {/* Voucher Information */}
        {order.voucher && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Voucher đã sử dụng</Text>
            </View>
            <View style={styles.voucherContainer}>
              <Text style={styles.voucherCode}>{order.voucher.voucher_id}</Text>
              <Text style={styles.voucherDiscount}>
                Giảm giá: {formatVND(order.discount_amount || 0)}
              </Text>
            </View>
          </>
        )}

        {/* Order Summary */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Tóm tắt đơn hàng</Text>
        </View>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text>Tạm tính</Text>
            <Text>{formatVND(order.original_amount || order.total_amount)}</Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Giảm giá</Text>
              <Text style={{ color: '#4CAF50' }}>- {formatVND(order.discount_amount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text>Phí vận chuyển</Text>
            <Text style={{ color: '#3255FB' }}>Miễn phí</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotal}>Tổng cộng</Text>
            <Text style={styles.grandTotal}>{formatVND(order.final_amount || order.total_amount)}</Text>
          </View>
        </View>

        {/* Order Timeline */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Lịch sử đơn hàng</Text>
        </View>
        
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Đơn hàng đã được tạo</Text>
              <Text style={styles.timelineDate}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
          
          {order.updatedAt && order.updatedAt !== order.createdAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Cập nhật trạng thái</Text>
                <Text style={styles.timelineDate}>{formatDate(order.updatedAt)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#222' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#F44336', fontSize: 16 },
  statusContainer: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 20 
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  orderId: { fontSize: 14, color: '#666', marginBottom: 4 },
  orderDate: { fontSize: 14, color: '#666' },
  sectionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 12 
  },
  sectionLabel: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  itemRow: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    alignItems: 'flex-start', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  bookImage: { width: 80, height: 100, borderRadius: 8, marginRight: 16 },
  itemInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  bookAuthor: { color: '#666', fontSize: 14, marginBottom: 4 },
  bookPrice: { color: '#3255FB', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  qty: { color: '#888', fontSize: 13, marginBottom: 4 },
  itemTotal: { color: '#222', fontWeight: 'bold', fontSize: 14 },
  addressContainer: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 8 
  },
  addressName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  addressPhone: { color: '#666', marginBottom: 4 },
  addressText: { color: '#222' },
  paymentContainer: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 8 
  },
  paymentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  paymentLabel: { color: '#666' },
  paymentValue: { fontWeight: 'bold' },
  voucherContainer: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 8 
  },
  voucherCode: { fontSize: 16, fontWeight: 'bold', color: '#3255FB' },
  voucherDiscount: { color: '#4CAF50', fontWeight: 'bold', marginTop: 4 },
  summaryContainer: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 8 
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  grandTotalRow: { 
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    paddingTop: 8, 
    marginTop: 8 
  },
  grandTotal: { fontWeight: 'bold', fontSize: 18, color: '#222' },
  timelineContainer: { marginTop: 8 },
  timelineItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  timelineDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: '#3255FB', 
    marginRight: 12, 
    marginTop: 4 
  },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  timelineDate: { fontSize: 12, color: '#666' }
}); 