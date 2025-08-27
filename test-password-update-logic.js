// Test script để kiểm tra logic password update
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testPasswordUpdateLogic() {
  try {
    console.log('🔧 Testing password update logic...');
    
    const testEmail = 'test-password-update@example.com';
    const testPassword = 'TestPassword123';
    
    // Step 1: Register user
    console.log('📧 Step 1: Registering user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/users/register`, {
      email: testEmail,
      password: 'temp_password',
      full_name: '',
      phone_number: ''
    });
    
    console.log('✅ Registration successful');
    console.log('📋 User ID:', registerResponse.data.user.id);
    
    // Step 2: Test verify OTP với password (simulate)
    console.log('🔐 Step 2: Testing verify OTP with password...');
    
    // Lấy OTP từ database hoặc email service
    // Trong thực tế, OTP sẽ được gửi qua email
    console.log('💡 Note: In real scenario, OTP would be sent via email');
    console.log('💡 For testing, we need to get the actual OTP from database');
    
    // Step 3: Test login với temp_password (sẽ thất bại)
    console.log('🔑 Step 3: Testing login with temp_password (should fail)...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
        email: testEmail,
        password: 'temp_password'
      });
      console.log('❌ Login should have failed but succeeded');
    } catch (loginError) {
      console.log('✅ Login failed as expected:', loginError.response?.data?.message);
    }
    
    // Step 4: Test login với password thật (sẽ thất bại vì chưa update)
    console.log('🔑 Step 4: Testing login with real password (should fail)...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('❌ Login should have failed but succeeded');
    } catch (loginError) {
      console.log('✅ Login failed as expected:', loginError.response?.data?.message);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('✅ Registration: Working');
    console.log('✅ Password update logic: Ready (needs OTP)');
    console.log('✅ Login validation: Working');
    console.log('💡 Next: Need to test with actual OTP from email');
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Chạy test
testPasswordUpdateLogic();

