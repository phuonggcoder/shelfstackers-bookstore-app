import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';
import { useAuth } from '../context/AuthContext';
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';
import { getOrderDetail } from '../services/orderService';
import { updatePaymentStatus } from '../services/paymentService';
import { formatVND } from '../utils/format';

export default function ZaloPayScreen() {
  const { orderId } = useLocalSearchParams();
  const { token } = useAuth();
  const { showAlert, alertVisible, alertConfig, hideAlert } = useUnifiedComponent();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const response = await getOrderDetail(token || '', orderId as string);
        let orderData = response.order || {};
        let zaloPay = response.zaloPay || {};
        let payment = orderData.payment_id || orderData.payment || {};
        // Ưu tiên lấy order_url theo thứ tự
        const paymentUrl = zaloPay.order_url || payment.order_url || response.paymentUrl || '';
        setOrder({ ...orderData, zaloPay, payment, paymentUrl });
      } catch (e) {
        showAlert('Lỗi', 'Không thể tải thông tin đơn hàng.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!order) return <Text>Không tìm thấy đơn hàng.</Text>;

  const paymentUrl = order.paymentUrl;
  const payment = order.payment_id || order.payment || {};
  const paymentStatus = payment.payment_status || order.payment_status || 'Pending';
  const paymentAmount = payment.amount || order.total_amount || 0;
  const expireAt = payment.expireAt || payment.expire_time || order.zaloPay.expire_time;
  const expireTime = expireAt ? new Date(expireAt).toLocaleString('vi-VN') : null;
  const paymentMethod = payment.payment_method || order.payment_method || '';



  // Copy order_url
  const handleCopyOrderUrl = async () => {
    if (paymentUrl) {
      await Clipboard.setStringAsync(paymentUrl);
      showAlert('Đã copy', 'Đã copy link thanh toán vào clipboard!', 'success');
    }
  };

  // Hàm xác nhận thanh toán thủ công
  const handleManualConfirm = async () => {
    if (!orderId) return;
    setConfirming(true);
    try {
      await updatePaymentStatus(token || '', orderId as string, { payment_status: 'Completed' });
      showAlert('Thành công', 'Đã xác nhận thanh toán.', 'success');
      // Fetch lại đơn hàng để cập nhật trạng thái
      const response = await getOrderDetail(token || '', orderId as string);
      let orderData = response.order || {};
      let zaloPay = response.zaloPay || {};
      let payment = orderData.payment_id || orderData.payment || {};
      const paymentUrl = zaloPay.order_url || payment.order_url || response.paymentUrl || '';
      setOrder({ ...orderData, zaloPay, payment, paymentUrl });
    } catch (e) {
      showAlert('Lỗi', 'Không thể xác nhận thanh toán.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {paymentMethod !== 'ZALOPAY' ? (
        <View style={[styles.verticalContainer, {justifyContent: 'center', flex: 1}]}> 
          <Text style={{ color: '#4A90E2', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            Đơn hàng này không sử dụng phương thức thanh toán ZaloPay.
          </Text>
          <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace({ pathname: '/order-success', params: { orderId: order.order_id || order._id } })}>
            <Text style={styles.buttonOutlineText}>Quay lại đơn hàng</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.verticalContainer}>
          <Text style={styles.title}>Thanh toán qua ZaloPay</Text>
          {paymentUrl ? (
            <View style={styles.qrBoxTop}>
              <Text style={styles.qrTitle}>Link thanh toán ZaloPay</Text>
              <View style={{ alignItems: 'center', position: 'relative' }}>
                <View style={{ 
                  width: 220, 
                  height: 120, 
                  backgroundColor: '#f8f9fa', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#e9ecef',
                  borderStyle: 'dashed'
                }}>
                  <Ionicons name="link-outline" size={48} color="#3255FB" />
                  <Text style={{ 
                    color: '#666', 
                    fontSize: 12, 
                    textAlign: 'center', 
                    marginTop: 8,
                    paddingHorizontal: 10
                  }}>
                    Nhấn nút bên dưới để mở app ZaloPay
                  </Text>
                </View>
                <View style={styles.qrActionRow}>
                  <TouchableOpacity onPress={handleCopyOrderUrl} style={styles.qrIconBtn}>
                    <Ionicons name="copy-outline" size={28} color="#3255FB" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>Không có link thanh toán ZaloPay.</Text>
          )}
          {paymentUrl && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={async () => {
                try {
                  const supported = await Linking.canOpenURL(paymentUrl);
                  if (supported) {
                    await Linking.openURL(paymentUrl);
                  } else {
                    showAlert('Không thể mở app ZaloPay', 'Thiết bị của bạn không hỗ trợ mở link này.', 'error');
                  }
                } catch (e) {
                  showAlert('Không thể mở trang thanh toán', String(e), 'error');
                }
              }}
            >
              <Text style={styles.payButtonText}>Mở app ZaloPay</Text>
            </TouchableOpacity>
          )}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Số tiền thanh toán</Text>
            <Text style={styles.infoValue}>{formatVND(paymentAmount)}</Text>
            <Text style={styles.infoLabel}>Mã đơn hàng</Text>
            <Text style={styles.infoValue}>{order.order_id || order._id}</Text>
            {expireTime && <>
              <Text style={styles.infoLabel}>Giao dịch kết thúc lúc</Text>
              <Text style={styles.infoValue}>{expireTime}</Text>
            </>}
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Trạng thái thanh toán</Text>
            <Text style={[styles.statusValue, {color: paymentStatus === 'Completed' ? '#4CAF50' : '#FFA500'}]}>
              {paymentStatus === 'Completed' ? 'Thanh toán thành công' : (paymentStatus === 'Pending' ? 'Đang chờ thanh toán' : (paymentStatus || 'Đang xử lý'))}
            </Text>
          </View>
          {/* Nút xác nhận thanh toán thủ công */}
          {paymentStatus === 'Pending' && (
            <TouchableOpacity style={[styles.payButton, {backgroundColor: '#4CAF50', marginBottom: 10}]} onPress={handleManualConfirm} disabled={confirming}>
              <Text style={styles.payButtonText}>{confirming ? 'Đang xác nhận...' : 'Tôi đã thanh toán'}</Text>
            </TouchableOpacity>
          )}
          {/* Sau khi thanh toán thành công, hiển thị 2 nút điều hướng */}
          {paymentStatus === 'Completed' && (
            <>
              <TouchableOpacity style={styles.payButton} onPress={() => router.replace('/order-history')}>
                <Text style={styles.payButtonText}>Xem lịch sử đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace('/') }>
                <Text style={styles.buttonOutlineText}>Về trang chủ</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Nếu chưa thanh toán thành công, vẫn hiển thị nút quay lại đơn hàng */}
          {paymentStatus !== 'Completed' && (
            <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace({ pathname: '/order-success', params: { orderId: order.order_id || order._id } })}>
              <Text style={styles.buttonOutlineText}>Quay lại đơn hàng</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Unified Components */}
      <UnifiedCustomComponent
        type="alert"
        mode={alertConfig.mode as any}
        visible={alertVisible}
        title={alertConfig.title}
        description={alertConfig.description}
        buttonText={alertConfig.buttonText}
        onButtonPress={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  verticalContainer: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#3255FB', marginBottom: 18, textAlign: 'center' },
  qrBoxTop: { alignItems: 'center', marginBottom: 18, marginTop: 10 },
  qrTitle: { fontWeight: 'bold', fontSize: 18, color: '#3255FB', marginBottom: 8 },
  qrActionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  qrIconBtn: { marginHorizontal: 10, backgroundColor: '#f2f2f2', borderRadius: 20, padding: 8 },
  payButton: { backgroundColor: '#00B2FF', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 30, marginBottom: 18, width: '100%', alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoBox: { width: '100%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 18, marginBottom: 18 },
  infoLabel: { color: '#888', fontSize: 14, marginTop: 6 },
  infoValue: { color: '#222', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  statusBox: { width: '100%', backgroundColor: '#fffbe6', borderRadius: 12, padding: 18, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: '#ffe082' },
  statusTitle: { color: '#FFA500', fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  statusValue: { fontSize: 18, fontWeight: 'bold' },
  buttonOutline: { borderColor: '#3255FB', borderWidth: 2, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, width: '100%', alignItems: 'center' },
  buttonOutlineText: { color: '#3255FB', fontWeight: 'bold', fontSize: 16 },
}); 