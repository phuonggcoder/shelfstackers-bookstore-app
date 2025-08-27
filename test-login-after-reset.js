// Test script để kiểm tra login sau khi đặt lại mật khẩu
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testLoginAfterReset() {
  try {
    console.log('🔧 Testing login after password reset...');
    
    // Thay thế bằng mật khẩu mới mà bạn đã đặt
    const loginData = {
      email: 'y2mtlath@gmail.com',
      password: 'NewPassword123' // Thay bằng mật khẩu mới của bạn
    };
    
    console.log('📧 Attempting login with:', loginData.email);
    
    const response = await axios.post(`${API_BASE_URL}/users/login`, loginData);
    
    console.log('✅ Login successful!');
    console.log('🔑 Access token:', response.data.access_token ? 'Present' : 'Missing');
    console.log('👤 User:', response.data.user?.username || 'Unknown');
    console.log('✅ Verified:', response.data.user?.is_verified || false);
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('💡 Tip: Kiểm tra lại mật khẩu mới');
    }
  }
}

// Chạy test
testLoginAfterReset();

