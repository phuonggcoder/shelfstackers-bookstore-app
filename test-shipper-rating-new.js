const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'your_order_id';

async function testShipperRating() {
  console.log('🧪 Testing Shipper Rating System...\n');

  try {
    // 1. Lấy prompts đánh giá
    console.log('1️⃣ Lấy danh sách prompts đánh giá');
    const promptsResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/prompts`);
    console.log('✅ Prompts:', promptsResponse.data.data.length, 'items');
    console.log('Sample prompts:', promptsResponse.data.data.slice(0, 3).map(p => p.text));

    // 2. Kiểm tra trạng thái đánh giá
    console.log('\n2️⃣ Kiểm tra trạng thái đánh giá');
    const statusResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Status response:', statusResponse.data.success);
    if (statusResponse.data.data) {
      console.log('📝 Đã có đánh giá:', statusResponse.data.data.rating, 'sao');
    } else {
      console.log('📝 Chưa có đánh giá');
    }

    // 3. Tạo đánh giá mới
    console.log('\n3️⃣ Tạo đánh giá shipper');
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
    console.log('✅ Tạo đánh giá thành công:', createResponse.data.message);
    console.log('📊 Rating ID:', createResponse.data.data._id);

    // 4. Cập nhật đánh giá
    console.log('\n4️⃣ Cập nhật đánh giá');
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
    console.log('✅ Cập nhật đánh giá thành công:', updateResponse.data.message);
    console.log('📊 Rating mới:', updateResponse.data.data.rating, 'sao');

    // 5. Kiểm tra lại trạng thái
    console.log('\n5️⃣ Kiểm tra lại trạng thái đánh giá');
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Final status:', finalStatusResponse.data.data ? 'Có đánh giá' : 'Không có đánh giá');
    if (finalStatusResponse.data.data) {
      console.log('📊 Rating cuối:', finalStatusResponse.data.data.rating, 'sao');
      console.log('💬 Comment:', finalStatusResponse.data.data.comment);
    }

    console.log('\n🎉 Tất cả test đánh giá shipper thành công!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Chạy test
testShipperRating();
