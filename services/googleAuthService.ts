import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Cấu hình Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: "346115100070-bk0aon0gtdm610c0f9hp1s161u2sr8ct.apps.googleusercontent.com",
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  });
};

// Google Sign-In Service
class GoogleAuthService {
  // Force hiển thị account picker
  async forceAccountPicker() {
    try {
      // Sign out để force hiển thị account picker
      await GoogleSignin.signOut();
      console.log('✅ Signed out to force account picker');
      return true;
    } catch (error) {
      console.log('⚠️ Force account picker failed:', error);
      return false;
    }
  }

  // Đăng nhập với Google
  async signInWithGoogle() {
    try {
      console.log('🔍 Starting Google Sign-In...');
      
      // Kiểm tra Google Play Services
      await GoogleSignin.hasPlayServices();
      console.log('✅ Google Play Services OK');

      // Force hiển thị account picker
      await this.forceAccountPicker();

      // Thực hiện Google Sign-In
      console.log('🔍 Performing Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful');
      console.log('🔍 userInfo structure:', JSON.stringify(userInfo, null, 2));

      // Lấy ID token từ userInfo.data hoặc userInfo
      let idToken = userInfo.data?.idToken;
      
      // Nếu không có trong data, thử lấy từ userInfo trực tiếp
      if (!idToken) {
        idToken = userInfo.idToken;
      }
      
      // Nếu vẫn không có, thử lấy tokens
      if (!idToken) {
        try {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken;
        } catch (tokenError) {
          console.error('❌ Error getting tokens:', tokenError);
        }
      }
      
      if (!idToken) {
        console.error('❌ No ID token received from Google');
        console.error('❌ userInfo structure:', JSON.stringify(userInfo, null, 2));
        throw new Error('Không thể lấy ID token từ Google');
      }

      console.log('🔍 ID Token received:', idToken.substring(0, 50) + '...');

      // Gửi ID token lên backend
      const result = await this.sendIdTokenToBackend(idToken);
      
      if (result.success) {
        // Lưu tokens
        await this.storeTokens(result.access_token, result.refresh_token);
        return result;
      } else {
        throw new Error(result.message || 'Đăng nhập Google thất bại');
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      throw error;
    }
  }

  // Gửi ID token lên backend
  async sendIdTokenToBackend(idToken: string) {
    try {
      console.log('🔧 Sending Google ID token to backend...');
      
      const response = await fetch(`${API_BASE_URL}/api/users/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: idToken,
        }),
      });

      const responseText = await response.text();
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response text:', responseText);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Google Sign-In failed');
      }
    } catch (error: any) {
      console.error('❌ Backend communication error:', error);
      throw error;
    }
  }

  // Lưu tokens vào AsyncStorage
  async storeTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      await AsyncStorage.setItem('token_expires_at', 
        (Date.now() + (4 * 60 * 60 * 1000)).toString()); // 4 hours
      await AsyncStorage.setItem('refresh_expires_at', 
        (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString()); // 30 days
      console.log('✅ Tokens stored successfully');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await this.storeTokens(data.access_token, data.refresh_token);
        return data.access_token;
      } else {
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error: any) {
      console.error('❌ Token refresh error:', error);
      await this.clearTokens();
      throw error;
    }
  }

  // Lấy access token hiện tại (với auto-refresh)
  async getAccessToken() {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const expiresAt = await AsyncStorage.getItem('token_expires_at');
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Kiểm tra token có hết hạn không (với buffer 5 phút)
      if (expiresAt && Date.now() > parseInt(expiresAt) - (5 * 60 * 1000)) {
        console.log('🔄 Access token expired, refreshing...');
        return await this.refreshAccessToken();
      }

      return accessToken;
    } catch (error: any) {
      console.error('❌ Error getting access token:', error);
      throw error;
    }
  }

  // Xóa tokens
  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'token_expires_at',
        'refresh_expires_at'
      ]);
      console.log('✅ Tokens cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  // Đăng xuất Google
  async signOut() {
    try {
      console.log('🔍 Signing out from Google...');
      await GoogleSignin.signOut();
      await this.clearTokens();
      console.log('✅ Google Sign-Out successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Google Sign-Out Error:', error);
      throw error;
    }
  }

  // Đăng xuất và xóa cache để hiển thị account picker
  async signOutAndClearCache() {
    try {
      console.log('🔍 Signing out and clearing cache...');
      
      // Đăng xuất Google
      await GoogleSignin.signOut();
      
      // Xóa tokens
      await this.clearTokens();
      
      console.log('✅ Sign-Out and cache clear successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign-Out and cache clear Error:', error);
      throw error;
    }
  }

  // Kiểm tra trạng thái đăng nhập
  async checkSignInStatus() {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      
      return {
        isSignedIn: !!accessToken,
        hasValidToken: !!accessToken
      };
    } catch (error: any) {
      console.error('❌ Check sign-in status error:', error);
      return {
        isSignedIn: false,
        hasValidToken: false
      };
    }
  }
}

export default new GoogleAuthService(); 