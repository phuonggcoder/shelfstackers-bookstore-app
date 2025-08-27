// Test script để kiểm tra registration flow sau khi sửa
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistrationFlow() {
  try {
    console.log('🔧 Testing registration flow...');
    
    const testEmail = 'test-registration@example.com';
    const testPassword = 'TestPassword123';
    
    // Step 1: Send registration OTP
    console.log('📧 Step 1: Sending registration OTP...');
    const otpResponse = await axios.post(`${API_BASE_URL}/users/register`, {
      email: testEmail,
      password: 'temp_password',
      full_name: '',
      phone_number: ''
    });
    
    console.log('✅ OTP sent successfully');
    console.log('📋 Response:', otpResponse.data);
    
    // Step 2: Verify OTP (simulate with a test OTP)
    console.log('🔐 Step 2: Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/users/verify-email-otp`, {
      email: testEmail,
      otp: '123456' // Test OTP
    });
    
    console.log('✅ OTP verification response:');
    console.log('📋 Response:', verifyResponse.data);
    
    // Step 3: Test login after verification
    console.log('🔑 Step 3: Testing login after verification...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login successful after verification');
    console.log('📋 Login response:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.access_token,
      hasUser: !!loginResponse.data.user,
      userVerified: loginResponse.data.user?.is_verified
    });
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('💡 This might be expected if OTP is invalid');
    }
  }
}

// Chạy test
testRegistrationFlow();

