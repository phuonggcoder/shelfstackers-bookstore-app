// Debug logic cho ShipperRatingCard component
console.log('🔍 Debug ShipperRatingCard Logic...\n');

// Dữ liệu mẫu từ hình ảnh
const orderData = {
  status: 'Delivered', // hoặc 'delivered'
  assigned_shipper_id: null, // hoặc có giá trị
  assigned_shipper_name: null, // hoặc có giá trị
  assigned_shipper_phone: null // hoặc có giá trị
};

console.log('📊 Dữ liệu đơn hàng:');
console.log('Status:', orderData.status);
console.log('Assigned Shipper ID:', orderData.assigned_shipper_id);
console.log('Assigned Shipper Name:', orderData.assigned_shipper_name);
console.log('Assigned Shipper Phone:', orderData.assigned_shipper_phone);

// Kiểm tra điều kiện hiển thị
console.log('\n🔍 Kiểm tra điều kiện hiển thị:');

const isDelivered = orderData.status?.toLowerCase() === 'delivered';
const hasShipper = !!orderData.assigned_shipper_id;

console.log('✅ Order is delivered:', isDelivered);
console.log('✅ Has assigned shipper:', hasShipper);
console.log('✅ Should show ShipperRatingCard:', isDelivered && hasShipper);

if (!isDelivered) {
  console.log('❌ Order status is not "delivered"');
  console.log('💡 Cần đảm bảo order.status === "delivered" hoặc "Delivered"');
}

if (!hasShipper) {
  console.log('❌ No assigned shipper');
  console.log('💡 Cần gán shipper cho đơn hàng (assigned_shipper_id)');
}

console.log('\n🎯 Kết luận:');
if (isDelivered && hasShipper) {
  console.log('✅ ShipperRatingCard sẽ hiển thị');
} else {
  console.log('❌ ShipperRatingCard sẽ KHÔNG hiển thị');
  console.log('💡 Để hiển thị, cần:');
  console.log('   1. Order status = "delivered"');
  console.log('   2. Có assigned_shipper_id');
}

// Test với các trường hợp khác nhau
console.log('\n🧪 Test các trường hợp:');

const testCases = [
  { status: 'Delivered', shipperId: 'shipper123', expected: true },
  { status: 'delivered', shipperId: 'shipper123', expected: true },
  { status: 'Delivered', shipperId: null, expected: false },
  { status: 'Shipped', shipperId: 'shipper123', expected: false },
  { status: 'Pending', shipperId: 'shipper123', expected: false },
];

testCases.forEach((testCase, index) => {
  const shouldShow = testCase.status.toLowerCase() === 'delivered' && !!testCase.shipperId;
  console.log(`Case ${index + 1}: Status="${testCase.status}", Shipper="${testCase.shipperId}" -> ${shouldShow ? '✅ SHOW' : '❌ HIDE'} (Expected: ${testCase.expected ? 'SHOW' : 'HIDE'})`);
});
