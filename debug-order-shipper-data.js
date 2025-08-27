// Debug script để kiểm tra dữ liệu order và shipper
// Chạy: node debug-order-shipper-data.js

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'your_order_id';

async function debugOrderShipperData() {
  console.log('🔍 Debug Order Shipper Data...\n');

  if (!USER_TOKEN || USER_TOKEN === 'your_user_token') {
    console.log('❌ Vui lòng cung cấp USER_TOKEN hợp lệ');
    console.log('Cách sử dụng:');
    console.log('USER_TOKEN=your_token ORDER_ID=your_order_id node debug-order-shipper-data.js');
    return;
  }

  try {
    // 1. Lấy order detail
    console.log('1️⃣ Lấy order detail...');
    const orderResponse = await axios.get(`${BASE_URL}/api/orders/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    
    const order = orderResponse.data.order || orderResponse.data;
    console.log('✅ Order data received');
    
    // 2. Kiểm tra assigned_shipper_id
    console.log('\n2️⃣ Kiểm tra assigned_shipper_id:');
    console.log('assigned_shipper_id:', JSON.stringify(order.assigned_shipper_id, null, 2));
    console.log('Type:', typeof order.assigned_shipper_id);
    console.log('Is null:', order.assigned_shipper_id === null);
    console.log('Is undefined:', order.assigned_shipper_id === undefined);
    
    // 3. Kiểm tra order status
    console.log('\n3️⃣ Kiểm tra order status:');
    console.log('status:', order.status);
    console.log('order_status:', order.order_status);
    console.log('Is delivered:', (order.status || order.order_status || '').toLowerCase() === 'delivered');
    
    // 4. Test helper functions
    console.log('\n4️⃣ Test helper functions:');
    
    // Mock helper functions
    const getShipperInfo = (assignedShipperId) => {
      if (!assignedShipperId) return null;
      
      if (typeof assignedShipperId === 'object' && assignedShipperId._id) {
        return {
          _id: assignedShipperId._id,
          full_name: assignedShipperId.full_name || '',
          phone_number: assignedShipperId.phone_number || '',
          username: assignedShipperId.username || ''
        };
      }
      
      if (typeof assignedShipperId === 'string') {
        return {
          _id: assignedShipperId,
          full_name: '',
          phone_number: '',
          username: ''
        };
      }
      
      return null;
    };

    const getShipperName = (assignedShipperId) => {
      const shipperInfo = getShipperInfo(assignedShipperId);
      return shipperInfo?.full_name || shipperInfo?.username || 'Unknown Shipper';
    };

    const getShipperPhone = (assignedShipperId) => {
      const shipperInfo = getShipperInfo(assignedShipperId);
      return shipperInfo?.phone_number || '';
    };

    const getShipperId = (assignedShipperId) => {
      const shipperInfo = getShipperInfo(assignedShipperId);
      return shipperInfo?._id || '';
    };

    // Test với dữ liệu thực
    console.log('getShipperInfo():', JSON.stringify(getShipperInfo(order.assigned_shipper_id), null, 2));
    console.log('getShipperName():', getShipperName(order.assigned_shipper_id));
    console.log('getShipperPhone():', getShipperPhone(order.assigned_shipper_id));
    console.log('getShipperId():', getShipperId(order.assigned_shipper_id));
    
    // 5. Kiểm tra điều kiện hiển thị
    console.log('\n5️⃣ Kiểm tra điều kiện hiển thị:');
    const shipperName = getShipperName(order.assigned_shipper_id);
    const isDelivered = (order.status || order.order_status || '').toLowerCase() === 'delivered';
    const hasShipper = getShipperInfo(order.assigned_shipper_id) !== null;
    
    console.log('shipperName:', shipperName);
    console.log('isDelivered:', isDelivered);
    console.log('hasShipper:', hasShipper);
    console.log('Will show shipper info:', !!shipperName);
    console.log('Will show ShipperRatingCard:', isDelivered && hasShipper);
    
    // 6. Kết luận
    console.log('\n6️⃣ Kết luận:');
    if (!order.assigned_shipper_id) {
      console.log('❌ Không có shipper được gán cho order này');
    } else if (typeof order.assigned_shipper_id === 'string') {
      console.log('⚠️ Backend chưa populate assigned_shipper_id (vẫn là string)');
    } else if (typeof order.assigned_shipper_id === 'object') {
      console.log('✅ Backend đã populate assigned_shipper_id thành object');
      if (order.assigned_shipper_id.full_name) {
        console.log('✅ Có full_name:', order.assigned_shipper_id.full_name);
      } else {
        console.log('⚠️ Không có full_name trong object');
      }
    }
    
    if (!isDelivered) {
      console.log('⚠️ Order chưa được giao (status không phải "delivered")');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Token không hợp lệ hoặc đã hết hạn');
    }
  }
}

// Run debug
debugOrderShipperData();
