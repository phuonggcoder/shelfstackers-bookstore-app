const axios = require('axios');

// Test API endpoints
const BASE_URL = 'http://localhost:3000/api/v1'; // Thay đổi URL theo backend của bạn

async function testReviewAPI() {
  try {
    console.log('🧪 Testing Review API...\n');

    // Test 1: Get product reviews
    console.log('1. Testing GET /review/product/:productId');
    try {
      const productId = '507f1f77bcf86cd799439011'; // Thay đổi productId thực tế
      const response = await axios.get(`${BASE_URL}/review/product/${productId}`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Get product review summary
    console.log('\n2. Testing GET /review/product/:productId/summary');
    try {
      const productId = '507f1f77bcf86cd799439011'; // Thay đổi productId thực tế
      const response = await axios.get(`${BASE_URL}/review/product/${productId}/summary`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 3: Get user reviews
    console.log('\n3. Testing GET /review/user/:userId');
    try {
      const userId = '507f1f77bcf86cd799439012'; // Thay đổi userId thực tế
      const response = await axios.get(`${BASE_URL}/review/user/${userId}`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 4: Check user review
    console.log('\n4. Testing GET /review/check');
    try {
      const params = {
        productId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439013'
      };
      const response = await axios.get(`${BASE_URL}/review/check`, { params });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testReviewAPI(); 