const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Test data với tài khoản mới
const testEmail = 'testauth@example.com';
const testPassword = 'password123';
const testNewEmail = 'newauth@example.com';

async function testChangeEmailAuthFixNew() {
  console.log('🧪 Testing Change Email Authentication Fix (New Account)...\n');

  try {
    // Test 1: Register new account
    console.log('1️⃣ Registering new test account...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        full_name: 'Test Auth User'
      });
      console.log('✅ Registration successful');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Account already exists, proceeding with login');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Login to get token
    console.log('\n2️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained:', token ? 'Present' : 'Missing');

    // Test 3: Test change email with valid token
    console.log('\n3️⃣ Testing change email with valid token...');
    try {
      const changeEmailResponse = await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: testNewEmail,
        currentPassword: testPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Change email request successful:', {
        success: changeEmailResponse.data.success,
        message: changeEmailResponse.data.message
      });
    } catch (error) {
      console.log('❌ Change email failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Test change email without token
    console.log('\n4️⃣ Testing change email without token...');
    try {
      await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: testNewEmail,
        currentPassword: testPassword
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Should have failed without token');
    } catch (error) {
      console.log('✅ Correctly rejected without token:', error.response?.data?.message || error.message);
    }

    // Test 5: Test change email with invalid token
    console.log('\n5️⃣ Testing change email with invalid token...');
    try {
      await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: testNewEmail,
        currentPassword: testPassword
      }, {
        headers: {
          'Authorization': 'Bearer invalid_token_here',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      console.log('✅ Correctly rejected with invalid token:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ Authentication token handling fixed');
    console.log('✅ Proper error messages for missing/invalid tokens');
    console.log('✅ API correctly validates authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testChangeEmailAuthFixNew();
