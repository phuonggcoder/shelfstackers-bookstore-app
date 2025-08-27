// Test script để kiểm tra logic giới hạn chỉnh sửa một lần
// Chạy: node test-edit-limit-logic.js

// Mock helper function (copy từ components)
const canEditRating = (rating) => {
  if (!rating?.created_at) return false;
  
  // Nếu đã có updated_at, nghĩa là đã chỉnh sửa rồi -> không cho phép chỉnh sửa nữa
  if (rating.updated_at && rating.updated_at !== rating.created_at) {
    return false;
  }
  
  const createdAt = new Date(rating.created_at);
  const now = new Date();
  const timeDiff = now.getTime() - createdAt.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff <= 24;
};

// Test data
const testCases = [
  {
    name: "Đánh giá mới tạo (< 24h, chưa chỉnh sửa)",
    rating: {
      _id: "rating1",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Giống created_at
      rating: 4,
      selected_prompts: ["Giao hàng nhanh chóng", "Thái độ phục vụ tốt"],
      comment: "Rất hài lòng"
    },
    expected: true,
    description: "Có thể chỉnh sửa vì < 24h và chưa chỉnh sửa"
  },
  {
    name: "Đánh giá đã chỉnh sửa một lần",
    rating: {
      _id: "rating2",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 giờ trước (đã chỉnh sửa)
      rating: 5,
      selected_prompts: ["Giao hàng nhanh chóng", "Thái độ phục vụ tốt", "Đóng gói cẩn thận"],
      comment: "Đã cập nhật: Rất xuất sắc!"
    },
    expected: false,
    description: "Không thể chỉnh sửa vì đã chỉnh sửa một lần rồi"
  },
  {
    name: "Đánh giá cũ (> 24h, chưa chỉnh sửa)",
    rating: {
      _id: "rating3",
      created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 giờ trước
      updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // Giống created_at
      rating: 3,
      selected_prompts: ["Giao hàng chậm"],
      comment: "Giao hàng hơi chậm"
    },
    expected: false,
    description: "Không thể chỉnh sửa vì > 24h"
  },
  {
    name: "Đánh giá cũ (> 24h, đã chỉnh sửa)",
    rating: {
      _id: "rating4",
      created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 giờ trước
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 giờ trước (đã chỉnh sửa)
      rating: 4,
      selected_prompts: ["Giao hàng nhanh chóng"],
      comment: "Đã cập nhật: Thực ra cũng ổn"
    },
    expected: false,
    description: "Không thể chỉnh sửa vì > 24h và đã chỉnh sửa"
  },
  {
    name: "Đánh giá không có created_at",
    rating: {
      _id: "rating5",
      rating: 4,
      selected_prompts: ["Giao hàng nhanh chóng"],
      comment: "Không có thời gian tạo"
    },
    expected: false,
    description: "Không thể chỉnh sửa vì không có created_at"
  },
  {
    name: "Đánh giá null",
    rating: null,
    expected: false,
    description: "Không thể chỉnh sửa vì rating là null"
  }
];

// Run tests
function runTests() {
  console.log('🧪 Testing Edit Limit Logic...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`📝 Test ${index + 1}: ${testCase.name}`);
    console.log(`📋 Description: ${testCase.description}`);
    
    const result = canEditRating(testCase.rating);
    const passed = result === testCase.expected;
    
    console.log(`🔍 Input:`, JSON.stringify(testCase.rating, null, 2));
    console.log(`✅ Expected: ${testCase.expected}`);
    console.log(`🎯 Actual: ${result}`);
    console.log(`📊 Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (passed) {
      passedTests++;
    }
    
    console.log('---\n');
  });
  
  console.log(`📈 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Logic is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the logic.');
  }
}

// Run tests
runTests();
