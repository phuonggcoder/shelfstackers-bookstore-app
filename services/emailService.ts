import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Types
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  expiresIn?: string;
  requiresVerification?: boolean;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
}

export interface OTPVerificationResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  isVerified?: boolean;
}

export interface VerificationMethodsResponse {
  success: boolean;
  methods: Array<{
    type: string;
    value: string;
    display: string;
  }>;
  availableMethods: string[];
}

export interface ForgotPasswordRequest {
  identifier: string;
  method: 'email' | 'sms';
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  method: string;
  email?: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  token?: string;
  otp?: string;
  identifier?: string;
  newPassword: string;
  method: 'email' | 'sms';
}

export interface EmailChangeRequest {
  email: string;
  isNewEmail: boolean;
}

export interface EmailChangeResponse {
  success: boolean;
  message: string;
  email?: string;
}

class EmailService {
  private baseUrl = `${API_BASE_URL}/api`;

  // Gửi OTP email cho đăng ký
  async sendRegistrationOTP(email: string): Promise<EmailVerificationResponse> {
    try {
      console.log('🔧 Sending registration OTP to:', email);
      
      const response = await fetch(`${this.baseUrl}/email-verification/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('✅ Registration OTP response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Registration OTP error:', error);
      throw new Error(error.message || 'Không thể gửi mã OTP');
    }
  }

  // Xác thực OTP email
  async verifyEmailOTP(email: string, otp: string): Promise<OTPVerificationResponse> {
    try {
      console.log('🔧 Verifying email OTP:', { email, otp });
      
      const response = await fetch(`${this.baseUrl}/email-verification/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await response.json();
      console.log('✅ Email OTP verification response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      // Lưu token nếu có
      if (data.token) {
        await this.storeAuthData(data);
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Email OTP verification error:', error);
      throw new Error(error.message || 'Xác thực OTP thất bại');
    }
  }

  // Gửi lại OTP
  async resendOTP(email: string): Promise<EmailVerificationResponse> {
    try {
      console.log('🔧 Resending OTP to:', email);
      
      const response = await fetch(`${this.baseUrl}/email-verification/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('✅ Resend OTP response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);
      throw new Error(error.message || 'Không thể gửi lại mã OTP');
    }
  }

  // Lấy phương thức xác thực có sẵn
  async getVerificationMethods(identifier: string): Promise<VerificationMethodsResponse> {
    try {
      console.log('🔧 Getting verification methods for:', identifier);
      
      const response = await fetch(`${this.baseUrl}/users/get-verification-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });
      
      const data = await response.json();
      console.log('✅ Verification methods response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get verification methods');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Get verification methods error:', error);
      throw new Error(error.message || 'Không thể lấy phương thức xác thực');
    }
  }

  // Quên mật khẩu
  async forgotPassword(identifier: string, method: 'email' | 'sms'): Promise<ForgotPasswordResponse> {
    try {
      console.log('🔧 Forgot password request:', { identifier, method });
      
      const response = await fetch(`${this.baseUrl}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, method }),
      });
      
      const data = await response.json();
      console.log('✅ Forgot password response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process forgot password request');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      throw new Error(error.message || 'Không thể xử lý yêu cầu quên mật khẩu');
    }
  }

  // Xác thực OTP SMS cho quên mật khẩu
  async verifySMSOTP(identifier: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Verifying SMS OTP for forgot password:', { identifier, otp });
      
      const response = await fetch(`${this.baseUrl}/users/verify-sms-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp }),
      });
      
      const data = await response.json();
      console.log('✅ SMS OTP verification response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'SMS OTP verification failed');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ SMS OTP verification error:', error);
      throw new Error(error.message || 'Xác thực OTP SMS thất bại');
    }
  }

  // Đặt lại mật khẩu
  async resetPassword(request: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Resetting password');
      
      const response = await fetch(`${this.baseUrl}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      console.log('✅ Reset password response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      throw new Error(error.message || 'Không thể đặt lại mật khẩu');
    }
  }

  // Gửi OTP cho thay đổi email
  async sendEmailChangeOTP(email: string, isNewEmail: boolean = false): Promise<EmailChangeResponse> {
    try {
      console.log('🔧 Sending email change OTP:', { email, isNewEmail });
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/users/send-email-change-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, isNewEmail }),
      });
      
      const data = await response.json();
      console.log('✅ Email change OTP response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email change OTP');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Email change OTP error:', error);
      throw new Error(error.message || 'Không thể gửi OTP thay đổi email');
    }
  }

  // Thay đổi email
  async changeEmail(
    currentEmail: string,
    newEmail: string,
    currentEmailOtp: string,
    newEmailOtp: string
  ): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      console.log('🔧 Changing email');
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/users/change-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentEmail,
          newEmail,
          currentEmailOtp,
          newEmailOtp,
        }),
      });
      
      const data = await response.json();
      console.log('✅ Change email response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change email');
      }
      
      // Cập nhật user data nếu có
      if (data.user) {
        await this.updateUserData(data.user);
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Change email error:', error);
      throw new Error(error.message || 'Không thể thay đổi email');
    }
  }

  // Kiểm tra trạng thái xác thực
  async getVerificationStatus(): Promise<{ isVerified: boolean; email?: string }> {
    try {
      console.log('🔧 Getting verification status');
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/email-verification/verification-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      console.log('✅ Verification status response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get verification status');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Get verification status error:', error);
      throw new Error(error.message || 'Không thể kiểm tra trạng thái xác thực');
    }
  }

  // Helper methods
  private async storeAuthData(data: any) {
    try {
      await AsyncStorage.multiSet([
        ['access_token', data.token],
        ['user_data', JSON.stringify(data.user)],
        ['is_verified', 'true'],
      ]);
      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  private async updateUserData(user: any) {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      console.log('✅ User data updated successfully');
    } catch (error) {
      console.error('❌ Error updating user data:', error);
    }
  }
}

export default new EmailService();
