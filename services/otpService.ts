import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api/users';

interface OTPRequestResponse {
  success: boolean;
  msg?: string;
  smsResult?: any;
}

interface OTPVerifyResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  user?: any;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
}

class OTPService {
  // Gửi OTP SMS
  async requestOTP(phone: string): Promise<OTPRequestResponse> {
    try {
      console.log('🔧 Requesting OTP for:', phone);
      
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      const data = await response.json();
      console.log('✅ OTP request response:', data);
      return data;
    } catch (error: any) {
      console.error('❌ OTP request error:', error);
      throw error;
    }
  }

  // Xác thực OTP
  async verifyOTP(phone: string, otp: string): Promise<OTPVerifyResponse> {
    try {
      console.log('🔧 Verifying OTP:', { phone, otp });
      
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });
      
      const data = await response.json();
      console.log('✅ OTP verification response:', data);
      
      if (data.success) {
        // Lưu tokens
        await this.storeTokens(data);
        return data;
      }
      
      throw new Error(data.message || 'OTP verification failed');
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      throw error;
    }
  }

  // Lưu tokens
  async storeTokens(data: any) {
    try {
      await AsyncStorage.multiSet([
        ['access_token', data.access_token],
        ['refresh_token', data.refresh_token],
        ['user_data', JSON.stringify(data.user)],
        ['token_expires_in', data.expires_in?.toString() || '14400'],
        ['refresh_expires_in', data.refresh_expires_in?.toString() || '2592000'],
        ['login_type', 'otp']
      ]);
      console.log('✅ Tokens stored successfully');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        await this.storeTokens(data);
        return data.access_token;
      }
      
      throw new Error(data.message || 'Token refresh failed');
    } catch (error: any) {
      console.error('❌ Token refresh error:', error);
      await this.clearTokens();
      throw error;
    }
  }

  // Xóa tokens
  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token', 
        'user_data',
        'token_expires_in',
        'refresh_expires_in',
        'login_type'
      ]);
      console.log('✅ Tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  // Lấy access token
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  // Kiểm tra xem user đã đăng nhập chưa
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new OTPService(); 