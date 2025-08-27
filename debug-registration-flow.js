// Debug script để kiểm tra registration flow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function debugRegistrationFlow() {
  try {
    console.log('🔧 Debugging registration flow...');
    
    const testEmail = 'debug-test@example.com';
    const testPassword = 'DebugPassword123';
    
    // Step 1: Test registration OTP
    console.log('📧 Step 1: Testing registration OTP...');
    const otpResponse = await axios.post(`${API_BASE_URL}/users/register`, {
      email: testEmail,
      password: 'temp_password',
      full_name: '',
      phone_number: ''
    });
    
    console.log('✅ Registration response:', {
      success: otpResponse.data.success,
      message: otpResponse.data.message,
      hasUser: !!otpResponse.data.user,
      userId: otpResponse.data.user?.id
    });
    
    // Step 2: Test OTP verification với password
    console.log('🔐 Step 2: Testing OTP verification with password...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/users/verify-email-otp`, {
      email: testEmail,
      otp: '123456', // Test OTP
      password: testPassword
    });
    
    console.log('✅ Verification response:', {
      success: verifyResponse.data.success,
      message: verifyResponse.data.message,
      hasUser: !!verifyResponse.data.user,
      userVerified: verifyResponse.data.user?.is_verified
    });
    
    // Step 3: Test login sau verification
    console.log('🔑 Step 3: Testing login after verification...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login response:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.access_token,
      hasUser: !!loginResponse.data.user,
      userVerified: loginResponse.data.user?.is_verified
    });
    
  } catch (error) {
    console.log('❌ Debug failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Phân tích lỗi
    if (error.response?.status === 400) {
      console.log('💡 400 Error - Bad Request');
      console.log('📋 Request data might be invalid');
    } else if (error.response?.status === 404) {
      console.log('💡 404 Error - Not Found');
      console.log('📋 Endpoint might not exist');
    } else if (error.response?.status === 500) {
      console.log('💡 500 Error - Server Error');
      console.log('📋 Backend might have issues');
    }
  }
}

// Chạy debug
debugRegistrationFlow();

