import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getOrderDetail } from '../services/orderService';
import { formatVND } from '../utils/format';

export default function OrderSuccessScreen() {
  const { token } = useAuth();
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qrRef = useRef<any>(null);

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!token || !orderId) return;
      try {
        setLoading(true);
        const response = await getOrderDetail(token, orderId as string);
        
        // Handle new API response structure
        if (response.success && response.order) {
          setOrder(response.order);
        } else {
          // Fallback for old response structure
          setOrder(response);
        }
      } catch (error) {
        console.error('Error loading order detail:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    loadOrderDetail();
  }, [token, orderId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!order) return <Text>Không tìm thấy đơn hàng.</Text>;

  // Lấy thông tin payment nếu có - Safe access với fallback
  const payment = order.payment_id || order.payment || {};
  const zaloPay = order.zaloPay || {};
  
  // Safe access cho các trường payment
  const paymentAmount = payment.amount || order.total_amount || 0;
  const paymentStatus = payment.payment_status || order.payment_status || 'Pending';
  const transactionId = payment.transaction_id || null;
  const paymentNotes = payment.notes || null;
  
  // Safe access cho thời gian hết hạn
  const expireAt = payment.expireAt || payment.expire_time || zaloPay.expire_time;
  const expireTime = expireAt ? dayjs(expireAt).format('HH:mm DD/MM/YYYY') : null;
  const now = dayjs();
  const isExpired = expireAt ? dayjs(expireAt).isBefore(now) : false;

  // QR value: lấy từ zaloPay.order_url nếu có
  const qrValue = zaloPay.order_url || '';

  // Download QR code as image (dùng ref của QRCode)
  const handleDownloadQR = async () => {
    if (!qrValue || !qrRef.current) return;
    try {
      qrRef.current.toDataURL(async (data: string) => {
        const fileUri = FileSystem.cacheDirectory + `qr_${order.order_id || order._id}.png`;
        await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri, { mimeType: 'image/png' });
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải ảnh QR.');
    }
  };

  // Copy order_url
  const handleCopyOrderUrl = async () => {
    if (qrValue) {
      await Clipboard.setStringAsync(qrValue);
      Alert.alert('Đã copy', 'Đã copy link thanh toán vào clipboard!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.verticalContainer}>
        {/* QR code lớn ở trên cùng nếu có order_url */}
        {qrValue && (
          <View style={styles.qrBoxTop}>
            <Text style={styles.qrTitle}>Quét QR để thanh toán</Text>
            <View style={{ alignItems: 'center', position: 'relative' }}>
              <QRCode value={qrValue} size={220} getRef={c => (qrRef.current = c)} />
              <View style={styles.qrActionRow}>
                <TouchableOpacity onPress={handleDownloadQR} style={styles.qrIconBtn}>
                  <Ionicons name="download-outline" size={28} color="#3255FB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCopyOrderUrl} style={styles.qrIconBtn}>
                  <Ionicons name="copy-outline" size={28} color="#3255FB" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {/* Logo và tên shop */}
        <View style={styles.logoRow}>
          <Image source={require('../assets/images/app.png')} style={styles.shopLogo} />
          <Text style={styles.shopName}>Bookstore</Text>
        </View>
        {/* Thông tin đơn hàng */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Giá trị đơn hàng</Text>
          <Text style={styles.infoValue}>{formatVND(order.total_amount || 0)}</Text>
          <Text style={styles.infoLabel}>Số tiền thanh toán</Text>
          <Text style={styles.infoValue}>{formatVND(paymentAmount)}</Text>
          {transactionId && <>
            <Text style={styles.infoLabel}>Mã giao dịch</Text>
            <Text style={styles.infoValue}>{transactionId}</Text>
          </>}
          <Text style={styles.infoLabel}>Mã đơn hàng</Text>
          <Text style={styles.infoValue}>{order.order_id || order._id}</Text>
          {paymentNotes && <>
            <Text style={styles.infoLabel}>Nội dung</Text>
            <Text style={styles.infoValue}>{paymentNotes}</Text>
          </>}
          {expireTime && <>
            <Text style={styles.infoLabel}>Giao dịch kết thúc lúc</Text>
            <Text style={[styles.infoValue, isExpired && {color:'#4A90E2'}]}>{expireTime} {isExpired ? '(Đã hết hạn)' : ''}</Text>
          </>}
        </View>
        {/* Nút chuyển sang web/app thanh toán (order_url) */}
        {qrValue && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => router.push({ pathname: '/zalo-pay', params: { orderId: order.order_id || order._id } })}
          >
            <Text style={styles.payButtonText}>Thanh toán qua ZaloPay</Text>
          </TouchableOpacity>
        )}
        {/* Trạng thái thanh toán */}
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Trạng thái thanh toán</Text>
          <Text style={[styles.statusValue, {color: paymentStatus === 'Completed' ? '#4CAF50' : '#FFA500'}]}>
            {paymentStatus === 'Completed' ? 'Đã thanh toán' : (isExpired ? 'Hết hạn' : (paymentStatus || 'Đang xử lý'))}
          </Text>
        </View>
        {/* Nút điều hướng */}
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/order-history')}>
          <Text style={styles.buttonText}>Xem lịch sử đơn hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace('/') }>
          <Text style={styles.buttonOutlineText}>Về trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  verticalContainer: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  shopLogo: { width: 40, height: 40, borderRadius: 10, marginRight: 10 },
  shopName: { fontSize: 20, fontWeight: 'bold', color: '#3255FB' },
  infoBox: { width: '100%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 18, marginBottom: 18 },
  infoLabel: { color: '#888', fontSize: 14, marginTop: 6 },
  infoValue: { color: '#222', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  statusBox: { width: '100%', backgroundColor: '#fffbe6', borderRadius: 12, padding: 18, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: '#ffe082' },
  statusTitle: { color: '#FFA500', fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  statusValue: { fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#3255FB', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 30, marginBottom: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonOutline: { borderColor: '#3255FB', borderWidth: 2, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, width: '100%', alignItems: 'center' },
  buttonOutlineText: { color: '#3255FB', fontWeight: 'bold', fontSize: 16 },
  scrollView: { marginTop: 0, flex: 1 },
  qrBox: { alignItems: 'center', marginBottom: 18, marginTop: 10 },
  qrBoxTop: { alignItems: 'center', marginBottom: 18, marginTop: 10 },
  qrTitle: { fontWeight: 'bold', fontSize: 18, color: '#3255FB', marginBottom: 8 },
  qrActionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  qrIconBtn: { marginHorizontal: 10, backgroundColor: '#f2f2f2', borderRadius: 20, padding: 8 },
  payButton: { backgroundColor: '#00B2FF', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 30, marginBottom: 18, width: '100%', alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
