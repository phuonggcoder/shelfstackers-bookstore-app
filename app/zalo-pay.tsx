import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getOrderDetail } from '../services/orderService';
import { updatePaymentStatus } from '../services/paymentService';
import { formatVND } from '../utils/format';

export default function ZaloPayScreen() {
  const { t } = useTranslation();
  const { orderId } = useLocalSearchParams();
  const { token } = useAuth();
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
        Alert.alert(t('error'), t('cannotLoadOrderInfo'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, token, t]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!order) return <Text>{t('orderNotFound')}</Text>;

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
      Alert.alert(t('copied'), t('paymentLinkCopied'));
    }
  };

  // Hàm xác nhận thanh toán thủ công
  const handleManualConfirm = async () => {
    if (!orderId) return;
    setConfirming(true);
    try {
      await updatePaymentStatus(token || '', orderId as string, { payment_status: 'Completed' });
      Alert.alert(t('success'), t('paymentConfirmed'));
      // Fetch lại đơn hàng để cập nhật trạng thái
      const response = await getOrderDetail(token || '', orderId as string);
      let orderData = response.order || {};
      let zaloPay = response.zaloPay || {};
      let payment = orderData.payment_id || orderData.payment || {};
      const paymentUrl = zaloPay.order_url || payment.order_url || response.paymentUrl || '';
      setOrder({ ...orderData, zaloPay, payment, paymentUrl });
    } catch (e) {
      Alert.alert(t('error'), t('cannotConfirmPayment'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {paymentMethod !== 'ZALOPAY' ? (
        <View style={[styles.verticalContainer, {justifyContent: 'center', flex: 1}]}> 
          <Text style={{ color: '#4A90E2', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            {t('orderNotUsingZaloPay')}
          </Text>
          <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace({ pathname: '/order-success', params: { orderId: order.order_id || order._id } })}>
            <Text style={styles.buttonOutlineText}>{t('backToOrder')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.verticalContainer}>
          <Text style={styles.title}>{t('payViaZaloPay')}</Text>
          {paymentUrl ? (
            <View style={styles.qrBoxTop}>
              <Text style={styles.qrTitle}>{t('zaloPayPaymentLink')}</Text>
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
                    {t('tapButtonToOpenZaloPay')}
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
            <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>{t('noZaloPayLink')}</Text>
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
                    Alert.alert(t('cannotOpenZaloPay'), t('deviceNotSupportLink'));
                  }
                } catch (e) {
                  Alert.alert(t('cannotOpenPaymentPage'), String(e));
                }
              }}
            >
              <Text style={styles.payButtonText}>{t('openZaloPayApp')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{t('paymentAmount')}</Text>
            <Text style={styles.infoValue}>{formatVND(paymentAmount)}</Text>
            <Text style={styles.infoLabel}>{t('orderNumber')}</Text>
            <Text style={styles.infoValue}>{order.order_id || order._id}</Text>
            {expireTime && <>
              <Text style={styles.infoLabel}>{t('transactionExpiresAt')}</Text>
              <Text style={styles.infoValue}>{expireTime}</Text>
            </>}
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>{t('paymentStatus')}</Text>
            <Text style={[styles.statusValue, {color: paymentStatus === 'Completed' ? '#4CAF50' : '#FFA500'}]}>
              {paymentStatus === 'Completed' ? t('paymentSuccess') : (paymentStatus === 'Pending' ? t('waitingForPayment') : (paymentStatus || t('processing')))}
            </Text>
          </View>
          {/* Nút xác nhận thanh toán thủ công */}
          {paymentStatus === 'Pending' && (
            <TouchableOpacity style={[styles.payButton, {backgroundColor: '#4CAF50', marginBottom: 10}]} onPress={handleManualConfirm} disabled={confirming}>
              <Text style={styles.payButtonText}>{confirming ? t('confirming') : t('iHavePaid')}</Text>
            </TouchableOpacity>
          )}
          {/* Sau khi thanh toán thành công, hiển thị 2 nút điều hướng */}
          {paymentStatus === 'Completed' && (
            <>
              <TouchableOpacity style={styles.payButton} onPress={() => router.replace('/order-history')}>
                <Text style={styles.payButtonText}>{t('viewOrderHistory')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace('/') }>
                <Text style={styles.buttonOutlineText}>{t('backToHome')}</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Nếu chưa thanh toán thành công, vẫn hiển thị nút quay lại đơn hàng */}
          {paymentStatus !== 'Completed' && (
            <TouchableOpacity style={styles.buttonOutline} onPress={() => router.replace({ pathname: '/order-success', params: { orderId: order.order_id || order._id } })}>
              <Text style={styles.buttonOutlineText}>{t('backToOrder')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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