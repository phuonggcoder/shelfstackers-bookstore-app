import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface PayOSScreenProps {
  route: any;
  navigation: any;
}

const PayOSScreen: React.FC<PayOSScreenProps> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<any>(null); // Thông tin tài khoản, số tiền, nội dung

  useEffect(() => {
    createPaymentLink();
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  const createPaymentLink = async () => {
    try {
      // Gọi API tạo link thanh toán PayOS
      const response = await fetch('YOUR_API_URL/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_method: 'PAYOS',
        }),
      });
      const result = await response.json();
      if (result.success) {
        setCheckoutUrl(result.data.checkout_url);
        setQrUrl(result.data.vietqr_url || null); // Link ảnh QR
        setBankInfo(result.data.bank_info || null); // { bankName, accountName, accountNumber, amount, description }
      } else {
        navigation.goBack();
      }
    } catch (error) {
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDeepLink = (event: any) => {
    const url = event.url;
    if (url.includes('payment-success')) {
      navigation.replace('OrderSuccess', { orderId });
    } else if (url.includes('payment-cancelled')) {
      navigation.goBack();
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (url.includes('payment-success')) {
      navigation.replace('OrderSuccess', { orderId });
    } else if (url.includes('payment-cancelled')) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Giao diện VietQR giống mẫu
  if (qrUrl && bankInfo) {
    return (
      <View style={styles.vietqrContainer}>
        <Text style={styles.vietqrTitle}>Mở App Ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền bên dưới</Text>
        <View style={styles.qrBox}>
          <View style={styles.qrImageWrap}>
            {/* Hiển thị ảnh QR */}
            <WebView source={{ uri: qrUrl }} style={styles.qrImage} />
          </View>
          <Text style={styles.bankName}>{bankInfo.bankName}</Text>
          <Text style={styles.accountName}>{bankInfo.accountName}</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Số tài khoản:</Text><CopyText text={bankInfo.accountNumber} /></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Số tiền:</Text><CopyText text={bankInfo.amount} /></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Nội dung:</Text><CopyText text={bankInfo.description} /></View>
          <Text style={styles.note}>Lưu ý: Nhập chính xác số tiền khi chuyển khoản</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => downloadQR(qrUrl)}><Text>Tải về</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => shareQR(qrUrl)}><Text>Chia sẻ</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}><Text>Huỷ</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  // Nếu không có VietQR thì hiển thị WebView PayOS
  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}><ActivityIndicator size="large" color="#0000ff" /></View>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text>Không lấy được link thanh toán</Text>
    </View>
  );
};


// Component copy text
const CopyText = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <TouchableOpacity style={styles.copyBtn} onPress={onCopy}>
      <Text style={styles.copyText}>{copied ? 'Đã sao chép' : 'Sao chép'}</Text>
    </TouchableOpacity>
  );
};

// Dummy download/share QR
const downloadQR = (url: string) => {
  // TODO: Implement download logic
};
const shareQR = (url: string) => {
  // TODO: Implement share logic
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vietqrContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  vietqrTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  qrImageWrap: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  bankName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  accountName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: '500',
    marginRight: 8,
  },
  copyBtn: {
    backgroundColor: '#F3F6F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  copyText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  note: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    marginBottom: 8,
  },
  actionBtn: {
    backgroundColor: '#F3F6F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 8,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
});

export default PayOSScreen;
