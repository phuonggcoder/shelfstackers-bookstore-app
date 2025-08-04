const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Test token - thay thế bằng token thực tế
const TEST_TOKEN = 'YOUR_TEST_TOKEN_HERE';

async function testProductReviews() {
  console.log('=== Testing Product Reviews Endpoints ===\n');

  try {
    // Test 1: Get product reviews
    console.log('1. Testing GET /api/v1/review/product/{productId}');
    const productId = '507f1f77bcf86cd799439011'; // Thay thế bằng productId thực tế
    const reviewsResponse = await axios.get(`${API_BASE_URL}/api/v1/review/product/${productId}?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Reviews Response:', reviewsResponse.data);
    console.log('Reviews count:', reviewsResponse.data.reviews?.length || 0);

  } catch (error) {
    console.log('❌ Reviews Error:', error.response?.status, error.response?.data || error.message);
  }

  try {
    // Test 2: Get product review summary
    console.log('\n2. Testing GET /api/v1/review/product/{productId}/summary');
    const productId = '507f1f77bcf86cd799439011'; // Thay thế bằng productId thực tế
    const summaryResponse = await axios.get(`${API_BASE_URL}/api/v1/review/product/${productId}/summary`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Summary Response:', summaryResponse.data);

  } catch (error) {
    console.log('❌ Summary Error:', error.response?.status, error.response?.data || error.message);
  }

  try {
    // Test 3: Get user reviews
    console.log('\n3. Testing GET /api/v1/review/user');
    const userReviewsResponse = await axios.get(`${API_BASE_URL}/api/v1/review/user?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ User Reviews Response:', userReviewsResponse.data);

  } catch (error) {
    console.log('❌ User Reviews Error:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n=== Test Complete ===');
}

// Chạy test
testProductReviews().catch(console.error); 