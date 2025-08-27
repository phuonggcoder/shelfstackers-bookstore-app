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
  user?: {
    id: string;
    email: string;
  };
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

export interface EmailChangeVerificationRequest {
  old_email_otp: string;
  new_email_otp: string;
}

class EmailService {
  private baseUrl = API_BASE_URL;

  // Gửi OTP email cho đăng ký
  async sendRegistrationOTP(email: string, userData?: { username?: string, full_name?: string, password?: string, phone_number?: string }): Promise<EmailVerificationResponse> {
    try {
      console.log('🔧 Sending registration OTP to:', email);
      
      const response = await fetch(`${this.baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          password: userData?.password || 'temp_password',
          full_name: userData?.full_name || '',
          username: userData?.username || email.split('@')[0],
          phone_number: userData?.phone_number || ''
        }),
      });
      
      const data = await response.json();
      console.log('✅ Registration OTP response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      return {
        success: true,
        message: data.message,
        requiresVerification: data.requiresVerification
      };
    } catch (error: any) {
      console.error('❌ Registration OTP error:', error);
      throw new Error(error.message || 'Không thể gửi mã OTP');
    }
  }

  // Kiểm tra trạng thái verify của user
  async checkVerificationStatus(email: string): Promise<any> {
    try {
      console.log('🔧 Checking verification status for:', email);
      
      const response = await fetch(`${this.baseUrl}/api/users/verification-status?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('✅ Verification status response:', data);
      
      return data;
    } catch (error: any) {
      console.error('❌ Check verification status error:', error);
      throw new Error(error.message || 'Không thể kiểm tra trạng thái verify');
    }
  }

  // Xác thực OTP email cho đăng ký
  async verifyRegistrationOTP(email: string, otp: string, password?: string): Promise<OTPVerificationResponse> {
    try {
      console.log('🔧 Verifying registration OTP:', { email, otp, hasPassword: !!password });
      
      const requestBody: any = { email, otp };
      if (password) {
        requestBody.password = password;
        console.log('🔧 Including password in verification request');
      }
      
      console.log('🔧 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.baseUrl}/api/users/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      console.log('✅ Registration OTP verification response:', data);
      console.log('✅ Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }
      
      return {
        success: true,
        message: data.message,
        user: data.user,
        isVerified: data.user?.is_verified
      };
    } catch (error: any) {
      console.error('❌ Registration OTP verification error:', error);
      throw new Error(error.message || 'Không thể xác thực OTP');
    }
  }

  // Gửi lại OTP email
  async resendOTP(email: string): Promise<EmailVerificationResponse> {
    try {
      console.log('🔧 Resending OTP to:', email);
      
      const response = await fetch(`${this.baseUrl}/api/users/resend-verification-otp`, {
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
      
      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);
      throw new Error(error.message || 'Không thể gửi lại OTP');
    }
  }

  // Đổi email
  async changeEmail(newEmail: string, currentPassword: string): Promise<EmailChangeResponse> {
    try {
      console.log('🔧 Changing email to:', newEmail);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }
      
      const response = await fetch(`${this.baseUrl}/api/users/change-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          newEmail: newEmail,
          currentPassword: currentPassword
        }),
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response as JSON
        let errorMessage = 'Failed to change email';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, get text response
          const errorText = await response.text();
          console.error('❌ Server returned non-JSON response:', errorText.substring(0, 200));
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      let data;
      try {
        data = await response.json();
        console.log('✅ Change email response:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid server response format');
      }
      
      return {
        success: true,
        message: data.message,
        email: newEmail
      };
    } catch (error: any) {
      console.error('❌ Change email error:', error);
      throw new Error(error.message || 'Không thể thay đổi email');
    }
  }

  // Xác thực đổi email
  async verifyEmailChange(oldEmailOtp: string, newEmailOtp: string): Promise<EmailChangeResponse> {
    try {
      console.log('🔧 Verifying email change OTPs');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }
      
      const response = await fetch(`${this.baseUrl}/api/users/verify-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          old_email_otp: oldEmailOtp,
          new_email_otp: newEmailOtp
        }),
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response as JSON
        let errorMessage = 'Failed to verify email change';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, get text response
          const errorText = await response.text();
          console.error('❌ Server returned non-JSON response:', errorText.substring(0, 200));
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      let data;
      try {
        data = await response.json();
        console.log('✅ Email change verification response:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid server response format');
      }
      
      return {
        success: true,
        message: data.message,
        email: data.new_email
      };
    } catch (error: any) {
      console.error('❌ Email change verification error:', error);
      throw new Error(error.message || 'Không thể xác thực thay đổi email');
    }
  }

  // Gửi OTP cho quên mật khẩu
  async sendForgotPasswordOTP(email: string): Promise<EmailVerificationResponse> {
    try {
      console.log('🔧 Sending forgot password OTP to:', email);
      
      const response = await fetch(`${this.baseUrl}/api/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('✅ Forgot password OTP response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send forgot password OTP');
      }
      
      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      console.error('❌ Forgot password OTP error:', error);
      throw new Error(error.message || 'Không thể gửi OTP quên mật khẩu');
    }
  }

  // Xác thực OTP quên mật khẩu
  async verifyForgotPasswordOTP(email: string, otp: string, newPassword: string): Promise<OTPVerificationResponse> {
    try {
      console.log('🔧 Verifying forgot password OTP');
      
      const response = await fetch(`${this.baseUrl}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          otp,
          new_password: newPassword
        }),
      });
      
      const data = await response.json();
      console.log('✅ Forgot password verification response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      console.error('❌ Forgot password verification error:', error);
      throw new Error(error.message || 'Không thể đặt lại mật khẩu');
    }
  }

  // Lấy thông tin user hiện tại
  async getCurrentUser(): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }
      
      const response = await fetch(`${this.baseUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response as JSON
        let errorMessage = 'Failed to get user profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, get text response
          const errorText = await response.text();
          console.error('❌ Server returned non-JSON response:', errorText.substring(0, 200));
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid server response format');
      }
      
      return data.user;
    } catch (error: any) {
      console.error('❌ Get current user error:', error);
      throw new Error(error.message || 'Không thể lấy thông tin người dùng');
    }
  }

  // Gửi lại OTP xác thực email
  async resendVerificationOTP(email: string): Promise<EmailVerificationResponse> {
    try {
      console.log('🔧 Resending verification OTP to:', email);
      
      const response = await fetch(`${this.baseUrl}/api/users/resend-verification-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('✅ Resend verification OTP response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification OTP');
      }
      
      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      console.error('❌ Resend verification OTP error:', error);
      throw new Error(error.message || 'Không thể gửi lại OTP xác thực');
    }
  }

  // Xác thực OTP email
  async verifyEmailOTP(email: string, otp: string): Promise<OTPVerificationResponse> {
    try {
      console.log('🔧 Verifying email OTP');
      
      const response = await fetch(`${this.baseUrl}/api/users/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          otp
        }),
      });
      
      const data = await response.json();
      console.log('✅ Email verification response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify email OTP');
      }
      
      return {
        success: true,
        message: data.message,
        user: data.user
      };
    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      throw new Error(error.message || 'Không thể xác thực email');
    }
  }
}

export default new EmailService();
