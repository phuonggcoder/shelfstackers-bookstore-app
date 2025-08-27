const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function checkUserExists() {
  try {
    console.log('🔍 Checking if user exists...');
    
    // Test verification status
    console.log('\n1️⃣ Checking verification status...');
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/api/users/verification-status?email=y2mtlath@gmail.com`);
      console.log('✅ Verification status:', statusResponse.data);
    } catch (error) {
      console.log('❌ Verification status error:', error.response?.data || error.message);
    }
    
    // Test if user can be found by email
    console.log('\n2️⃣ Testing user lookup...');
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ User lookup:', userResponse.data);
    } catch (error) {
      console.log('❌ User lookup error:', error.response?.data || error.message);
    }
    
    // Test registration with same email
    console.log('\n3️⃣ Testing registration with same email...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/users/register`, {
        email: 'y2mtlath@gmail.com',
        password: 'newpassword123',
        username: 'testuser123',
        full_name: 'Test User'
      });
      console.log('✅ Registration response:', registerResponse.data);
    } catch (error) {
      console.log('❌ Registration error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test with a completely new user
async function testNewUser() {
  try {
    console.log('\n🧪 Testing with completely new user...');
    
    const testEmail = `newuser${Date.now()}@example.com`;
    const testPassword = 'newpass123';
    
    console.log('📧 Test email:', testEmail);
    console.log('🔑 Test password:', testPassword);
    
    // 1. Register
    console.log('\n1️⃣ Registering...');
    const registerResponse = await axios.post(`${API_BASE_URL}/api/users/register`, {
      email: testEmail,
      password: testPassword,
      username: `newuser${Date.now()}`.slice(-15),
      full_name: 'New Test User'
    });
    
    console.log('✅ Register response:', registerResponse.data);
    
    // 2. Try login (should fail because not verified)
    console.log('\n2️⃣ Trying login (should fail)...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('❌ Login should have failed but succeeded:', loginResponse.data);
    } catch (error) {
      console.log('✅ Login failed as expected:', error.response?.data?.message);
    }
    
    // 3. Check verification status
    console.log('\n3️⃣ Checking verification status...');
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/api/users/verification-status?email=${encodeURIComponent(testEmail)}`);
      console.log('✅ Verification status:', statusResponse.data);
    } catch (error) {
      console.log('❌ Verification status error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await checkUserExists();
  await testNewUser();
}

runTests();

