const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testChangeEmailDetailed() {
  console.log('🧪 Detailed Change Email Debug...\n');

  try {
    // Test 1: Test change-email endpoint with detailed logging
    console.log('1️⃣ Testing change-email endpoint with detailed response...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Headers:', JSON.stringify(response.headers, null, 2));
      console.log('📊 Response Data Type:', typeof response.data);
      console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
      
      // Try to parse as JSON
      try {
        const parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        console.log('✅ JSON parsing successful:', parsedData);
      } catch (parseError) {
        console.log('❌ JSON parsing failed:', parseError.message);
        console.log('🔍 Raw response data:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
      if (error.response) {
        console.log('📊 Error Status:', error.response.status);
        console.log('📊 Error Headers:', JSON.stringify(error.response.headers, null, 2));
        console.log('📊 Error Data Type:', typeof error.response.data);
        console.log('📊 Error Data:', error.response.data);
      }
    }

    // Test 2: Test with proper error handling like frontend
    console.log('\n2️⃣ Testing with frontend-style error handling...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/change-email`, {
        newEmail: 'test@example.com',
        currentPassword: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Success response:', response.data);
      
    } catch (error) {
      console.log('❌ Error caught:', error.message);
      
      if (error.response) {
        console.log('📊 Error Status:', error.response.status);
        console.log('📊 Error Data:', error.response.data);
        
        // Try to parse error response
        try {
          const errorData = typeof error.response.data === 'string' 
            ? JSON.parse(error.response.data) 
            : error.response.data;
          console.log('✅ Error data parsed:', errorData);
        } catch (parseError) {
          console.log('❌ Error data parsing failed:', parseError.message);
          console.log('🔍 Raw error data:', error.response.data);
        }
      } else if (error.request) {
        console.log('❌ No response received:', error.request);
      } else {
        console.log('❌ Request setup error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the detailed debug
testChangeEmailDetailed();
