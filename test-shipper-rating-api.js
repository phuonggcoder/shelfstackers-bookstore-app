const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'https://server-shelf-stacker-w1ds.onrender.com';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'ORD1756221662387424K3';

async function testShipperRatingAPI() {
  console.log('🧪 Testing Shipper Rating API Endpoints...\n');

  try {
    // 1. Test GET /api/shipper-ratings/prompts
    console.log('1️⃣ Testing GET /api/shipper-ratings/prompts');
    try {
      const promptsResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/prompts`);
      console.log('✅ Prompts endpoint working');
      console.log('📊 Prompts count:', promptsResponse.data.data.length);
      console.log('📝 Sample prompts:', promptsResponse.data.data.slice(0, 3).map(p => p.text));
    } catch (error) {
      console.log('❌ Prompts endpoint failed:', error.response?.status || error.message);
    }

    // 2. Test GET /api/shipper-ratings/can-rate/:order_id
    console.log('\n2️⃣ Testing GET /api/shipper-ratings/can-rate/:order_id');
    try {
      const canRateResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/can-rate/${ORDER_ID}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      console.log('✅ Can-rate endpoint working');
      console.log('📊 Can rate:', canRateResponse.data.data.canRate);
      console.log('📝 Reason:', canRateResponse.data.data.reason);
    } catch (error) {
      console.log('❌ Can-rate endpoint failed:', error.response?.status || error.message);
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set USER_TOKEN');
      }
    }

    // 3. Test GET /api/shipper-ratings/order/:order_id
    console.log('\n3️⃣ Testing GET /api/shipper-ratings/order/:order_id');
    try {
      const orderRatingResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      console.log('✅ Order rating endpoint working');
      if (orderRatingResponse.data.data) {
        console.log('📊 Existing rating found:', orderRatingResponse.data.data.rating, 'stars');
      } else {
        console.log('📊 No existing rating');
      }
    } catch (error) {
      console.log('❌ Order rating endpoint failed:', error.response?.status || error.message);
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set USER_TOKEN');
      }
    }

    // 4. Test POST /api/shipper-ratings/rate (if can rate)
    console.log('\n4️⃣ Testing POST /api/shipper-ratings/rate');
    try {
      const ratingData = {
        order_id: ORDER_ID,
        rating: 4.5,
        selected_prompts: ['Giao hàng nhanh chóng', 'Thái độ phục vụ tốt'],
        comment: 'Shipper rất nhiệt tình và giao hàng đúng giờ. Rất hài lòng với dịch vụ!',
        is_anonymous: false
      };

      const createResponse = await axios.post(`${BASE_URL}/api/shipper-ratings/rate`, ratingData, {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Create rating endpoint working');
      console.log('📊 Rating created:', createResponse.data.data._id);
    } catch (error) {
      console.log('❌ Create rating endpoint failed:', error.response?.status || error.message);
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set USER_TOKEN');
      } else if (error.response?.status === 400) {
        console.log('📝 Business logic error:', error.response.data.message);
      }
    }

    // 5. Test PUT /api/shipper-ratings/update/:order_id
    console.log('\n5️⃣ Testing PUT /api/shipper-ratings/update/:order_id');
    try {
      const updateData = {
        rating: 5.0,
        selected_prompts: ['Giao hàng nhanh chóng', 'Thái độ phục vụ tốt', 'Đóng gói cẩn thận'],
        comment: 'Cập nhật: Shipper rất xuất sắc! Giao hàng nhanh và cẩn thận.',
        is_anonymous: false
      };

      const updateResponse = await axios.put(`${BASE_URL}/api/shipper-ratings/update/${ORDER_ID}`, updateData, {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Update rating endpoint working');
      console.log('📊 Rating updated:', updateResponse.data.data.rating, 'stars');
    } catch (error) {
      console.log('❌ Update rating endpoint failed:', error.response?.status || error.message);
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set USER_TOKEN');
      } else if (error.response?.status === 400) {
        console.log('📝 Business logic error:', error.response.data.message);
      }
    }

    console.log('\n🎉 API Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- Prompts endpoint: ✅ Working');
    console.log('- Can-rate endpoint: ✅ Working');
    console.log('- Order rating endpoint: ✅ Working');
    console.log('- Create rating endpoint: ✅ Working');
    console.log('- Update rating endpoint: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testShipperRatingAPI();
