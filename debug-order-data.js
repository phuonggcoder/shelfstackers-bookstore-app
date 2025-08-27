const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'https://server-shelf-stacker-w1ds.onrender.com';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'ORD1756221662387424K3';

async function debugOrderData() {
  console.log('🔍 Debug Order Data...\n');

  try {
    // 1. Lấy thông tin đơn hàng
    console.log('1️⃣ Lấy thông tin đơn hàng');
    const orderResponse = await axios.get(`${BASE_URL}/api/orders/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    
    const order = orderResponse.data.data;
    console.log('✅ Order data retrieved');
    console.log('📊 Order Status:', order.status);
    console.log('📊 Assigned Shipper ID:', order.assigned_shipper_id || 'null');
    console.log('📊 Assigned Shipper Name:', order.assigned_shipper_name || 'null');
    console.log('📊 Assigned Shipper Phone:', order.assigned_shipper_phone || 'null');
    console.log('📊 Payment Status:', order.paymentStatus);
    console.log('📊 Payment Method:', order.paymentMethod);

    // 2. Kiểm tra điều kiện hiển thị ShipperRatingCard
    console.log('\n2️⃣ Kiểm tra điều kiện hiển thị ShipperRatingCard');
    
    const isDelivered = order.status?.toLowerCase() === 'delivered';
    const hasShipper = !!order.assigned_shipper_id;
    
    console.log('✅ Order is delivered:', isDelivered);
    console.log('✅ Has assigned shipper:', hasShipper);
    console.log('✅ Should show ShipperRatingCard:', isDelivered && hasShipper);

    if (!isDelivered) {
      console.log('❌ Order status is not "delivered"');
    }
    
    if (!hasShipper) {
      console.log('❌ No assigned shipper');
    }

    // 3. Kiểm tra shipper rating status
    console.log('\n3️⃣ Kiểm tra shipper rating status');
    try {
      const ratingResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      
      if (ratingResponse.data.data) {
        console.log('✅ Existing rating found:', ratingResponse.data.data.rating, 'stars');
      } else {
        console.log('✅ No existing rating');
      }
    } catch (error) {
      console.log('❌ Error checking rating status:', error.response?.status || error.message);
    }

    // 4. Kiểm tra prompts
    console.log('\n4️⃣ Kiểm tra prompts');
    try {
      const promptsResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/prompts`);
      console.log('✅ Prompts available:', promptsResponse.data.data.length, 'items');
    } catch (error) {
      console.log('❌ Error fetching prompts:', error.response?.status || error.message);
    }

    console.log('\n🎯 Kết luận:');
    if (isDelivered && hasShipper) {
      console.log('✅ ShipperRatingCard SHOULD be visible');
      console.log('💡 Nếu không thấy, có thể do:');
      console.log('   - Component bị lỗi');
      console.log('   - API call thất bại');
      console.log('   - Styling issues');
    } else {
      console.log('❌ ShipperRatingCard will NOT be visible');
      console.log('💡 Cần:');
      if (!isDelivered) console.log('   - Đảm bảo order status là "delivered"');
      if (!hasShipper) console.log('   - Gán shipper cho đơn hàng');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Lỗi authentication - vui lòng kiểm tra USER_TOKEN');
    } else if (error.response?.status === 404) {
      console.log('🔍 Order không tìm thấy - vui lòng kiểm tra ORDER_ID');
    }
  }
}

// Chạy debug
debugOrderData();
