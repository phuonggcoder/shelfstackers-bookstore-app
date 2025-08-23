import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { getOrderDetail } from '../services/orderService';

export default function PayOSRoute() {
  const { orderId, amount } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [webViewLoading, setWebViewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    // Đăng ký lắng nghe URL khi quay lại app
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // Lấy PayOS data từ order detail
  useEffect(() => {
    getPayOSData();
  }, [orderId, token]);

  const getPayOSData = async () => {
    if (!token || !orderId) {
      router.back();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get order detail which should contain PayOS data
      const orderResponse = await getOrderDetail(token as string, orderId as string);
      
      console.log('Order detail response:', orderResponse);
      
      // Check if PayOS data exists in the order response
      if (orderResponse?.success && orderResponse?.payosPay) {
        const payosData = orderResponse.payosPay;
        
        // Set PayOS checkout URL
        setCheckoutUrl(payosData.checkoutUrl || null);
      } else if (orderResponse?.success && orderResponse?.paymentUrl) {
        // Fallback: use paymentUrl from order detail response
        console.log('Using paymentUrl from order detail:', orderResponse.paymentUrl);
        setCheckoutUrl(orderResponse.paymentUrl);
      } else {
        setError('Không tìm thấy thông tin thanh toán PayOS');
      }
    } catch (err: any) {
      console.error('PayOS data fetch error:', err);
      setError(err.message || 'Lỗi lấy thông tin thanh toán PayOS');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepLink = (url: any) => {
    console.log('Deep link received:', url);
    
    // Xử lý kết quả thanh toán từ PayOS
    if (url.includes('payment-return')) {
      // Extract parameters from URL
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const status = urlParams.get('status');
      const orderCode = urlParams.get('orderCode');
      const paymentLinkId = urlParams.get('paymentLinkId');
      
      console.log('PayOS return params:', { status, orderCode, paymentLinkId });
      
      if (status === 'success' || status === '00') {
        // Navigate trực tiếp thay vì hiển thị Alert
        router.replace({ pathname: '/order-success', params: { orderId } });
      } else {
        // Navigate back thay vì hiển thị Alert
        router.back();
      }
    } else if (url.includes('payment-cancel')) {
      // Navigate back thay vì hiển thị Alert
      router.back();
    }
  };

  const handleWebViewMessage = (event: any) => {
    const data = event.nativeEvent.data;
    console.log('WebView message:', data);
    
    try {
      const result = JSON.parse(data);
      if (result.status === 'success') {
        router.replace({ pathname: '/order-success', params: { orderId } });
      } else if (result.status === 'cancel') {
        router.back();
      }
    } catch (error) {
      console.log('Invalid message format:', data);
    }
  };

  const handleWebViewLoadStart = () => {
    console.log('WebView load start');
    setWebViewLoading(true);
    
    // Set timeout for WebView loading (30 seconds)
    setTimeout(() => {
      if (webViewLoading) {
        console.log('WebView loading timeout');
        setWebViewLoading(false);
        setError('Trang thanh toán tải quá lâu. Vui lòng thử lại.');
      }
    }, 30000);
  };

  const handleWebViewLoadEnd = () => {
    console.log('WebView load end');
    setWebViewLoading(false);
  };

  const handleWebViewError = (error: any) => {
    console.error('WebView error:', error);
    setWebViewLoading(false);
    
    // Provide more specific error messages
    let errorMessage = 'Không thể tải trang thanh toán';
    
    if (error.nativeEvent) {
      const { code, description } = error.nativeEvent;
      console.log('WebView error details:', { code, description });
      
      if (code === 'ERR_TIMED_OUT') {
        errorMessage = 'Kết nối tải quá lâu. Vui lòng kiểm tra mạng và thử lại.';
      } else if (code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = 'Không thể kết nối đến trang thanh toán. Vui lòng thử lại.';
      } else if (code === 'ERR_NAME_NOT_RESOLVED') {
        errorMessage = 'Không thể tìm thấy trang thanh toán. Vui lòng thử lại.';
      }
    }
    
    setError(errorMessage);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState.url);
    
    // Kiểm tra URL để xử lý callback
    if (navState.url.includes('payment-return') || navState.url.includes('success') || navState.url.includes('complete')) {
      const urlParams = new URLSearchParams(navState.url.split('?')[1] || '');
      const status = urlParams.get('status');
      const orderCode = urlParams.get('orderCode');
      const paymentLinkId = urlParams.get('paymentLinkId');
      
      console.log('PayOS WebView return params:', { status, orderCode, paymentLinkId });
      
      // Kiểm tra nhiều trạng thái thành công
      if (status === 'success' || status === '00' || status === 'completed' || 
          navState.url.includes('success') || navState.url.includes('complete')) {
        console.log('Payment successful, navigating to order success...');
        router.replace({ pathname: '/order-success', params: { orderId } });
      } else {
        console.log('Payment cancelled or failed, navigating back...');
        router.back();
      }
    } else if (navState.url.includes('payment-cancel') || navState.url.includes('cancel') || navState.url.includes('failed')) {
      console.log('Payment cancelled, navigating back...');
      router.back();
    }
  };

  const handleRetry = () => {
    setError(null);
    setWebViewKey(prev => prev + 1);
    getPayOSData();
  };

  const handleCancel = () => {
    Alert.alert(
      'Hủy thanh toán',
      'Bạn có chắc chắn muốn hủy thanh toán?',
      [
        { text: 'Tiếp tục thanh toán', style: 'cancel' },
        { text: 'Hủy', onPress: () => router.back() }
      ]
    );
  };

  const handleBack = () => {
    // Clear error state trước khi navigate back
    setError(null);
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin thanh toán...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Lỗi thanh toán</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
              <Text style={styles.cancelButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!checkoutUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Không có link thanh toán</Text>
          <Text style={styles.errorMessage}>Không thể tạo link thanh toán PayOS</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getPayOSData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelHeaderButton} onPress={handleCancel}>
          <Text style={styles.cancelHeaderButtonText}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán PayOS</Text>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => {
            console.log('Debug info:', {
              checkoutUrl,
              webViewLoading,
              error,
              orderId
            });
            Alert.alert('Debug Info', `URL: ${checkoutUrl}\nLoading: ${webViewLoading}\nError: ${error}`);
          }}
        >
          <Text style={styles.debugButtonText}>🔧</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        key={webViewKey}
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onMessage={handleWebViewMessage}
        onError={handleWebViewError}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsBackForwardNavigationGestures={false}
        incognito={false}
        mixedContentMode="compatibility"
        allowsProtectedMedia={true}
        onShouldStartLoadWithRequest={(request) => {
          console.log('WebView request:', request.url);
          // Allow all requests to PayOS domains
          if (request.url.includes('payos.vn') || request.url.includes('pay.payos.vn')) {
            return true;
          }
          // Allow deep link requests
          if (request.url.includes('bookshelfstacker://')) {
            return true;
          }
          // Allow relative URLs
          if (request.url.startsWith('http') || request.url.startsWith('https')) {
            return true;
          }
          return true;
        }}
      />
      
      {/* WebView Loading overlay */}
      {webViewLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  cancelHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelHeaderButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 60,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  debugButtonText: {
    fontSize: 24,
  },
});
