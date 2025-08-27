const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'https://server-shelf-stacker-w1ds.onrender.com';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'your_order_id';

async function testShipperRatingComplete() {
  console.log('🧪 Testing Complete Shipper Rating System...\n');

  try {
    // 1. Lấy prompts đánh giá
    console.log('1️⃣ Lấy danh sách prompts đánh giá');
    const promptsResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/prompts`);
    console.log('✅ Prompts:', promptsResponse.data.data.length, 'items');
    console.log('Sample prompts:', promptsResponse.data.data.slice(0, 3).map(p => p.text));

    // 2. Kiểm tra có thể đánh giá (compatibility endpoint)
    console.log('\n2️⃣ Kiểm tra có thể đánh giá shipper');
    try {
      const canRateResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/can-rate/${ORDER_ID}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      console.log('✅ Can rate response:', canRateResponse.data.success);
      if (canRateResponse.data.data.canRate) {
        console.log('📝 Có thể đánh giá');
      } else {
        console.log('📝 Không thể đánh giá:', canRateResponse.data.data.reason);
      }
    } catch (error) {
      console.log('❌ Can-rate endpoint error:', error.response?.status || error.code);
      if (error.response?.status === 404) {
        console.log('⚠️  Can-rate endpoint chưa implement, sử dụng order endpoint');
      }
    }

    // 3. Kiểm tra trạng thái đánh giá
    console.log('\n3️⃣ Kiểm tra trạng thái đánh giá');
    const statusResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Status response:', statusResponse.data.success);
    if (statusResponse.data.data) {
      console.log('📝 Đã có đánh giá:', statusResponse.data.data.rating, 'sao');
      console.log('💬 Comment:', statusResponse.data.data.comment);
    } else {
      console.log('📝 Chưa có đánh giá');
    }

    // 4. Tạo đánh giá mới (chỉ nếu chưa có)
    if (!statusResponse.data.data) {
      console.log('\n4️⃣ Tạo đánh giá shipper mới');
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
    } else {
      console.log('\n4️⃣ Bỏ qua tạo đánh giá (đã có đánh giá)');
    }

    // 5. Cập nhật đánh giá (nếu có)
    if (statusResponse.data.data) {
      console.log('\n5️⃣ Cập nhật đánh giá');
      const updateData = {
        rating: 5.0,
        selected_prompts: ['Giao hàng nhanh chóng', 'Thái độ phục vụ tốt', 'Đóng gói cẩn thận'],
        comment: 'Cập nhật: Shipper rất xuất sắc! Giao hàng nhanh và cẩn thận.',
        is_anonymous: false
      };

      try {
        const updateResponse = await axios.put(`${BASE_URL}/api/shipper-ratings/update/${ORDER_ID}`, updateData, {
          headers: { 
            'Authorization': `Bearer ${USER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Cập nhật đánh giá thành công:', updateResponse.data.message);
        console.log('📊 Rating mới:', updateResponse.data.data.rating, 'sao');
      } catch (error) {
        console.log('❌ Cập nhật thất bại:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('\n5️⃣ Bỏ qua cập nhật (chưa có đánh giá)');
    }

    // 6. Kiểm tra lại trạng thái
    console.log('\n6️⃣ Kiểm tra lại trạng thái đánh giá');
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Final status:', finalStatusResponse.data.data ? 'Có đánh giá' : 'Không có đánh giá');
    if (finalStatusResponse.data.data) {
      console.log('📊 Rating cuối:', finalStatusResponse.data.data.rating, 'sao');
      console.log('💬 Comment:', finalStatusResponse.data.data.comment);
      console.log('🏷️  Prompts:', finalStatusResponse.data.data.selected_prompts);
    }

    // 7. Test xóa đánh giá (optional - comment out để giữ lại)
    /*
    console.log('\n7️⃣ Xóa đánh giá (optional)');
    try {
      const deleteResponse = await axios.delete(`${BASE_URL}/api/shipper-ratings/delete/${ORDER_ID}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      console.log('✅ Xóa đánh giá thành công:', deleteResponse.data.message);
    } catch (error) {
      console.log('❌ Xóa thất bại:', error.response?.data?.message || error.message);
    }
    */

    console.log('\n🎉 Tất cả test đánh giá shipper hoàn thành!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Lỗi authentication - vui lòng kiểm tra USER_TOKEN');
    } else if (error.response?.status === 404) {
      console.log('🔍 Endpoint không tìm thấy - vui lòng kiểm tra BASE_URL');
    } else if (error.response?.status === 500) {
      console.log('⚡ Lỗi server - vui lòng kiểm tra backend');
    }
    
    process.exit(1);
  }
}

// Helper function để test với token thực
async function testWithRealToken() {
  console.log('🔑 Testing with real token...');
  
  // Thay thế bằng token thực từ login
  const realToken = 'your_real_jwt_token_here';
  const realOrderId = 'your_real_order_id_here';
  
  process.env.USER_TOKEN = realToken;
  process.env.ORDER_ID = realOrderId;
  
  await testShipperRatingComplete();
}

// Chạy test
if (process.argv.includes('--real-token')) {
  testWithRealToken();
} else {
  testShipperRatingComplete();
}
