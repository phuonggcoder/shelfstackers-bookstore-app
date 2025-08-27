const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testRegistrationLoginFlow() {
  try {
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    console.log('🧪 Testing Registration → Verify → Login Flow');
    console.log('📧 Test email:', testEmail);
    console.log('🔑 Test password:', testPassword);
    
    // 1. Register user
    console.log('\n1️⃣ Registering user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/api/users/register`, {
      email: testEmail,
      password: testPassword,
      username: `testuser${Date.now()}`,
      full_name: 'Test User'
    });
    
    console.log('✅ Register response:', registerResponse.data);
    
    // 2. Get OTP from email (simulate)
    console.log('\n2️⃣ Getting OTP...');
    // In real scenario, user would check email
    // For testing, we'll assume OTP is "123456"
    const testOTP = "123456";
    
    // 3. Verify OTP
    console.log('\n3️⃣ Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/api/users/verify-email-otp`, {
      email: testEmail,
      otp: testOTP,
      password: testPassword
    });
    
    console.log('✅ Verify response:', verifyResponse.data);
    
    // 4. Try to login
    console.log('\n4️⃣ Attempting login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login response:', loginResponse.data);
    
    console.log('\n🎉 SUCCESS: Registration → Verify → Login flow works!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('🔍 400 Error - Bad Request');
      console.log('📝 Response:', error.response.data);
    } else if (error.response?.status === 401) {
      console.log('🔍 401 Error - Unauthorized');
      console.log('📝 Response:', error.response.data);
    } else if (error.response?.status === 500) {
      console.log('🔍 500 Error - Server Error');
      console.log('📝 Response:', error.response.data);
    }
  }
}

// Test with existing user
async function testExistingUserLogin() {
  try {
    console.log('\n🧪 Testing existing user login...');
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'y2mtlath@gmail.com',
      password: '123123'
    });
    
    console.log('✅ Existing user login response:', loginResponse.data);
    
  } catch (error) {
    console.error('❌ Existing user login error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testExistingUserLogin();
  // await testRegistrationLoginFlow(); // Uncomment to test full flow
}

runTests();

