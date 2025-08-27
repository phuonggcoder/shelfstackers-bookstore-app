const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testChangeEmailDebug() {
  console.log('🧪 Debugging Change Email JSON Parse Error...\n');

  try {
    // Test 1: Check if server is responding
    console.log('1️⃣ Testing server connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
      console.log('✅ Server is responding:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server connectivity issue:', error.message);
    }

    // Test 2: Test change-email endpoint without auth
    console.log('\n2️⃣ Testing change-email endpoint without authentication...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status
      });
      
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Headers:', response.headers['content-type']);
      console.log('📊 Response Data (first 200 chars):', response.data?.toString().substring(0, 200));
      
      // Check if response is HTML
      if (response.headers['content-type']?.includes('text/html')) {
        console.log('❌ Server returned HTML instead of JSON');
        console.log('🔍 This usually means:');
        console.log('   - Server is down or restarting');
        console.log('   - Endpoint doesn\'t exist');
        console.log('   - Server error page');
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
      if (error.response) {
        console.log('📊 Error Status:', error.response.status);
        console.log('📊 Error Headers:', error.response.headers);
        console.log('📊 Error Data:', error.response.data?.toString().substring(0, 200));
      }
    }

    // Test 3: Test with invalid token
    console.log('\n3️⃣ Testing change-email endpoint with invalid token...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Headers:', response.headers['content-type']);
      console.log('📊 Response Data:', response.data);
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }

    // Test 4: Test other endpoints to see if server is working
    console.log('\n4️⃣ Testing other endpoints...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/books`, { timeout: 10000 });
      console.log('✅ Books endpoint working:', response.status);
    } catch (error) {
      console.log('❌ Books endpoint failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
testChangeEmailDebug();
