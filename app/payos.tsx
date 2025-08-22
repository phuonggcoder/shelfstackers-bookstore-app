import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { createPayOSPayment } from '../services/paymentService';

export default function PayOSRoute() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const doCreate = async () => {
      if (!token || !orderId) {
        router.back();
        return;
      }
      try {
        const res = await createPayOSPayment(token as string, orderId as string);
        if (!mounted) return;
        // Expect server to return { success: true, data: { checkout_url, vietqr_url, bank_info } }
        if (res?.success && res.data) {
          setCheckoutUrl(res.data.checkout_url || res.data.checkoutUrl || null);
          setQrUrl(res.data.vietqr_url || res.data.vietqrUrl || res.data.vietqr || null);
          setBankInfo(res.data.bank_info || res.data.bankInfo || null);
        } else if (res && (res.checkout_url || res.checkoutUrl)) {
          setCheckoutUrl(res.checkout_url || res.checkoutUrl);
        } else {
          router.back();
        }
      } catch {
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const handleDeepLink = (event: any) => {
      const url = event.url;
      if (url.includes('payment-success')) {
        router.replace({ pathname: '/order-success', params: { orderId } });
      } else if (url.includes('payment-cancelled')) {
        router.back();
      }
    };

    doCreate();
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [orderId, token, router]);

  const handleDeepLink = (event: any) => {
    const url = event.url;
    if (url.includes('payment-success')) {
      router.replace({ pathname: '/order-success', params: { orderId } });
    } else if (url.includes('payment-cancelled')) {
      router.back();
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (url.includes('payment-success')) {
      router.replace({ pathname: '/order-success', params: { orderId } });
    } else if (url.includes('payment-cancelled')) {
      router.back();
    }
  };

  if (loading) return (
    <View style={styles.container}><ActivityIndicator size="large" color="#3255FB"/></View>
  );

  if (qrUrl && bankInfo) {
    return (
      <View style={styles.vietqrContainer}>
        <Text style={styles.vietqrTitle}>Mở app ngân hàng và quét mã hoặc chuyển khoản theo thông tin</Text>
        <View style={styles.qrBox}>
          <WebView source={{ uri: qrUrl }} style={{ width: 220, height: 220 }} />
          <Text style={styles.bankName}>{bankInfo.bankName}</Text>
          <Text style={styles.accountName}>{bankInfo.accountName}</Text>
          <Text>Số tài khoản: {bankInfo.accountNumber}</Text>
          <Text>Số tiền: {bankInfo.amount}</Text>
          <Text>Nội dung: {bankInfo.description}</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}><Text>Huỷ</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
      />
    );
  }

  return (
    <View style={styles.container}><Text>Không lấy được link thanh toán</Text></View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vietqrContainer: { flex: 1, backgroundColor: '#fff', padding: 16 },
  vietqrTitle: { textAlign: 'center', marginBottom: 12 },
  qrBox: { alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10 },
  bankName: { fontWeight: 'bold', marginTop: 8 },
  accountName: { fontWeight: '600', marginBottom: 6 },
  cancelBtn: { marginTop: 12, backgroundColor: '#eee', padding: 10, borderRadius: 8 }
});
