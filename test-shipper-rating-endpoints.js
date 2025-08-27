const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'https://server-shelf-stacker-w1ds.onrender.com';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'your_order_id';

async function testShipperRatingEndpoints() {
  console.log('🧪 Testing Shipper Rating Endpoints...\n');

  const endpoints = [
    {
      name: 'Get Rating Prompts',
      method: 'GET',
      url: '/api/shipper-ratings/prompts',
      auth: false
    },
    {
      name: 'Check Rating Status',
      method: 'GET',
      url: `/api/shipper-ratings/order/${ORDER_ID}`,
      auth: true
    },
    {
      name: 'Can Rate Shipper',
      method: 'GET',
      url: `/api/shipper-ratings/can-rate/${ORDER_ID}`,
      auth: true
    },
    {
      name: 'Create Shipper Rating',
      method: 'POST',
      url: '/api/shipper-ratings/rate',
      auth: true,
      data: {
        order_id: ORDER_ID,
        rating: 4.5,
        selected_prompts: ['Giao hàng nhanh chóng', 'Thái độ phục vụ tốt'],
        comment: 'Shipper rất nhiệt tình và giao hàng đúng giờ',
        is_anonymous: false
      }
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`📡 ${endpoint.method} ${endpoint.url}`);
    
    try {
      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (endpoint.auth) {
        config.headers.Authorization = `Bearer ${USER_TOKEN}`;
      }

      if (endpoint.data) {
        config.data = endpoint.data;
      }

      const response = await axios(config);
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.code}`);
      console.log(`📋 Message: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 404) {
        console.log(`⚠️  Endpoint not implemented yet`);
      } else if (error.response?.status === 401) {
        console.log(`🔐 Authentication required`);
      }
    }
  }

  console.log('\n🎉 Testing completed!');
}

// Chạy test
testShipperRatingEndpoints().catch(console.error);
