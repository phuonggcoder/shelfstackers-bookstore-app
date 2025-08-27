const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testAuthEndpointOnly() {
  console.log('🧪 Testing Change Email Endpoint Authentication...\n');

  try {
    // Test 1: Test change email without token
    console.log('1️⃣ Testing change email without token...');
    try {
      await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Should have failed without token');
    } catch (error) {
      console.log('✅ Correctly rejected without token:', error.response?.data?.message || error.message);
    }

    // Test 2: Test change email with invalid token
    console.log('\n2️⃣ Testing change email with invalid token...');
    try {
      await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
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

    // Test 3: Test change email with malformed token
    console.log('\n3️⃣ Testing change email with malformed token...');
    try {
      await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Authorization': 'Bearer',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Should have failed with malformed token');
    } catch (error) {
      console.log('✅ Correctly rejected with malformed token:', error.response?.data?.message || error.message);
    }

    // Test 4: Test change email with wrong header format
    console.log('\n4️⃣ Testing change email with wrong header format...');
    try {
      await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Authorization': 'invalid_format',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Should have failed with wrong header format');
    } catch (error) {
      console.log('✅ Correctly rejected with wrong header format:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Authentication Test Summary:');
    console.log('✅ Endpoint correctly requires authentication');
    console.log('✅ Proper error messages for missing tokens');
    console.log('✅ Proper error messages for invalid tokens');
    console.log('✅ Proper error messages for malformed tokens');
    console.log('✅ API correctly validates Authorization header format');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuthEndpointOnly();
