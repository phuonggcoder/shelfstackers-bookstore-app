import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { changeLanguage } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import { getOrderDetail } from '../services/orderService';
import { formatVND } from '../utils/format';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderActions from '../components/OrderActions';

const videoSource = require('../assets/lottie/shoppingCart.mp4');


export default function OrderSuccessScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { showErrorToast } = useUnifiedModal();
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Ensure default language is set to Vietnamese
  useEffect(() => {
    changeLanguage('vi');
  }, []);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!token || !orderId) return;
      try {
        setLoading(true);
        const response = await getOrderDetail(token, orderId as string);

        if (response.success && response.order) {
          setOrder(response.order);
        } else {
          setOrder(response);
        }
      } catch {
        showErrorToast(t('error'), t('cannotLoadOrderInfo'));
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();
  }, [token, orderId, t, showErrorToast]);

  if (loading) return (
    <View style={styles.loaderContainer}>
      <Ionicons name="cart" size={48} color="#3255FB" />
    </View>
  );
  if (!order) return <Text>{t('orderNotFound')}</Text>;

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
  const now = dayjs();
  const isExpired = expireAt ? dayjs(expireAt).isBefore(now) : false;

  // Cải thiện UI/UX của trang
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.verticalContainer}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>{t('orderSuccess')}</Text>
          <Text style={styles.headerSubtitle}>{t('thankYouForYourOrder')}</Text>
        </View>
        <View style={styles.animationBox}>
          <VideoView
            style={styles.animationVideo}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            nativeControls={false}
          />
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>{t('orderValue')}</Text>
          <Text style={styles.infoValue}>{formatVND(order.total_amount || 0)}</Text>
          <Text style={styles.infoLabel}>{t('paymentAmount')}</Text>
          <Text style={styles.infoValue}>{formatVND(paymentAmount)}</Text>
          <Text style={styles.infoLabel}>{t('orderStatus')}</Text>
          <Text style={styles.infoValue}>{
            // canonicalize status for display
            (function() {
              const s = order.order_status || order.status || paymentStatus || 'Pending';
              const map: Record<string, string> = {
                Pending: t('pending'),
                AwaitingPickup: t('awaitingPickup'),
                OutForDelivery: t('outForDelivery'),
                Delivered: t('delivered'),
                Returned: t('returned'),
                Cancelled: t('cancelled'),
                Refunded: t('refunded'),
              };
              return map[s] || s;
            })()
          }</Text>
          {order.assigned_shipper_id && (
            <>
              <Text style={styles.infoLabel}>{t('assignedShipper')}</Text>
              <Text style={styles.infoValue}>{order.assigned_shipper_name || order.assigned_shipper_id}</Text>
            </>
          )}
          {transactionId && <>
            <Text style={styles.infoLabel}>{t('transactionId')}</Text>
            <Text style={styles.infoValue}>{transactionId}</Text>
          </>}
          <Text style={styles.infoLabel}>{t('orderNumber')}</Text>
          <Text style={styles.infoValue}>{order.order_id || order._id}</Text>
          {paymentNotes && <>
            <Text style={styles.infoLabel}>{t('content')}</Text>
            <Text style={styles.infoValue}>{paymentNotes}</Text>
          </>}
        </View>
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>{t('currentStatus')}</Text>
          <OrderStatusBadge status={order.order_status || order.status || paymentStatus} shipperName={order.assigned_shipper_name || order.assigned_shipper_id} shipperAck={order.shipper_ack} />
          <Text style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>{t((order.order_status || order.status || paymentStatus) === 'Pending' ? 'orderIsPendingHelp' : (order.order_status || order.status || paymentStatus) === 'AwaitingPickup' ? 'orderAwaitingPickupHelp' : (order.order_status || order.status || paymentStatus) === 'OutForDelivery' ? 'orderOutForDeliveryHelp' : (order.order_status || order.status || paymentStatus) === 'Delivered' ? 'orderDeliveredHelp' : '')}</Text>
        </View>
        <View style={styles.buttonContainer}>
          {/* Primary action: view order history / details */}
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/order-history')}>
            <Text style={styles.buttonText}>{t('viewOrderHistory')}</Text>
          </TouchableOpacity>

          {/* Secondary actions dependent on status */}


          <TouchableOpacity style={[styles.buttonOutline, { marginTop: 10 }]} onPress={() => router.replace('/') }>
            <Text style={styles.buttonOutlineText}>{t('backToHome')}</Text>
          </TouchableOpacity>
          <OrderActions status={order.order_status || order.status || paymentStatus} orderId={order.order_id || order._id} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  verticalContainer: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  headerBox: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#3255FB' },
  headerSubtitle: { fontSize: 16, color: '#666', marginTop: 8 },
  animationBox: { alignItems: 'center', marginBottom: 20 },
  animationVideo: { width: 150, height: 150, borderRadius: 60 },
  infoBox: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  infoLabel: { color: '#888', fontSize: 14, marginTop: 6 },
  infoValue: { color: '#222', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  statusBox: { width: '100%', backgroundColor: '#fffbe6', borderRadius: 12, padding: 18, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#ffe082', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statusTitle: { color: '#FFA500', fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  statusValue: { fontSize: 18, fontWeight: 'bold' },
  buttonContainer: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#3255FB', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 30, marginBottom: 10, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonOutline: {
    borderColor: '#3255FB',
    borderWidth: 2,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff', // Change background to white
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonOutlineText: {
    color: '#3255FB',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: { marginTop: 0, flex: 1 },
  qrBox: { alignItems: 'center', marginBottom: 18, marginTop: 10 },
  qrBoxTop: { alignItems: 'center', marginBottom: 18, marginTop: 10 },
  qrTitle: { fontWeight: 'bold', fontSize: 18, color: '#3255FB', marginBottom: 8 },
  qrActionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  qrIconBtn: { marginHorizontal: 10, backgroundColor: '#f2f2f2', borderRadius: 20, padding: 8 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});