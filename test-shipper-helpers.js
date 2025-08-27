// Test script để verify shipper helper functions
// Chạy: node test-shipper-helpers.js

// Mock helper functions (copy từ utils/shipperHelpers.ts)
const getShipperInfo = (assignedShipperId) => {
  if (!assignedShipperId) return null;
  
  // Nếu là object (backend đã populate)
  if (typeof assignedShipperId === 'object' && assignedShipperId._id) {
    return {
      _id: assignedShipperId._id,
      full_name: assignedShipperId.full_name || '',
      phone_number: assignedShipperId.phone_number || '',
      username: assignedShipperId.username || ''
    };
  }
  
  // Nếu là string (backend chưa populate)
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

const hasShipper = (assignedShipperId) => {
  return getShipperInfo(assignedShipperId) !== null;
};

const getShipperDisplayName = (assignedShipperId) => {
  const shipperInfo = getShipperInfo(assignedShipperId);
  if (!shipperInfo) return 'Unknown Shipper';
  
  return shipperInfo.full_name || shipperInfo.username || 'Unknown Shipper';
};

// Test data từ backend logs
const testData = {
  // Backend mới - object với đầy đủ thông tin
  populatedShipper: {
    _id: "68a6e9ed5103b702f20595b6",
    full_name: "Cao Hoàng Nguyên",
    phone_number: "0563182308",
    username: "nguyen11111"
  },
  
  // Backend cũ - string ID
  stringShipperId: "68a6e9ed5103b702f20595b6",
  
  // Empty object
  emptyObject: {},
  
  // Null/undefined
  nullValue: null,
  undefinedValue: undefined
};

// Test functions
function runTests() {
  console.log('🧪 Testing Shipper Helper Functions...\n');
  
  // Test 1: Backend mới - populated object
  console.log('📝 Test 1: Backend mới - populated object');
  console.log('Input:', JSON.stringify(testData.populatedShipper, null, 2));
  console.log('getShipperInfo():', JSON.stringify(getShipperInfo(testData.populatedShipper), null, 2));
  console.log('getShipperName():', getShipperName(testData.populatedShipper));
  console.log('getShipperPhone():', getShipperPhone(testData.populatedShipper));
  console.log('getShipperId():', getShipperId(testData.populatedShipper));
  console.log('hasShipper():', hasShipper(testData.populatedShipper));
  console.log('getShipperDisplayName():', getShipperDisplayName(testData.populatedShipper));
  console.log('✅ Expected: "Cao Hoàng Nguyên"\n');
  
  // Test 2: Backend cũ - string ID
  console.log('📝 Test 2: Backend cũ - string ID');
  console.log('Input:', testData.stringShipperId);
  console.log('getShipperInfo():', JSON.stringify(getShipperInfo(testData.stringShipperId), null, 2));
  console.log('getShipperName():', getShipperName(testData.stringShipperId));
  console.log('getShipperPhone():', getShipperPhone(testData.stringShipperId));
  console.log('getShipperId():', getShipperId(testData.stringShipperId));
  console.log('hasShipper():', hasShipper(testData.stringShipperId));
  console.log('getShipperDisplayName():', getShipperDisplayName(testData.stringShipperId));
  console.log('✅ Expected: "Unknown Shipper" (vì không có full_name)\n');
  
  // Test 3: Empty object
  console.log('📝 Test 3: Empty object');
  console.log('Input:', testData.emptyObject);
  console.log('getShipperInfo():', getShipperInfo(testData.emptyObject));
  console.log('getShipperName():', getShipperName(testData.emptyObject));
  console.log('getShipperPhone():', getShipperPhone(testData.emptyObject));
  console.log('getShipperId():', getShipperId(testData.emptyObject));
  console.log('hasShipper():', hasShipper(testData.emptyObject));
  console.log('getShipperDisplayName():', getShipperDisplayName(testData.emptyObject));
  console.log('✅ Expected: null/Unknown Shipper\n');
  
  // Test 4: Null value
  console.log('📝 Test 4: Null value');
  console.log('Input:', testData.nullValue);
  console.log('getShipperInfo():', getShipperInfo(testData.nullValue));
  console.log('getShipperName():', getShipperName(testData.nullValue));
  console.log('getShipperPhone():', getShipperPhone(testData.nullValue));
  console.log('getShipperId():', getShipperId(testData.nullValue));
  console.log('hasShipper():', hasShipper(testData.nullValue));
  console.log('getShipperDisplayName():', getShipperDisplayName(testData.nullValue));
  console.log('✅ Expected: null/Unknown Shipper\n');
  
  // Test 5: Undefined value
  console.log('📝 Test 5: Undefined value');
  console.log('Input:', testData.undefinedValue);
  console.log('getShipperInfo():', getShipperInfo(testData.undefinedValue));
  console.log('getShipperName():', getShipperName(testData.undefinedValue));
  console.log('getShipperPhone():', getShipperPhone(testData.undefinedValue));
  console.log('getShipperId():', getShipperId(testData.undefinedValue));
  console.log('hasShipper():', hasShipper(testData.undefinedValue));
  console.log('getShipperDisplayName():', getShipperDisplayName(testData.undefinedValue));
  console.log('✅ Expected: null/Unknown Shipper\n');
  
  // Test 6: Edge case - object với username nhưng không có full_name
  console.log('📝 Test 6: Object với username nhưng không có full_name');
  const usernameOnlyShipper = {
    _id: "68a6e9ed5103b702f20595b6",
    username: "nguyen11111",
    phone_number: "0563182308"
  };
  console.log('Input:', JSON.stringify(usernameOnlyShipper, null, 2));
  console.log('getShipperName():', getShipperName(usernameOnlyShipper));
  console.log('getShipperDisplayName():', getShipperDisplayName(usernameOnlyShipper));
  console.log('✅ Expected: "nguyen11111"\n');
  
  console.log('✨ All tests completed!');
}

// Run tests
runTests();
