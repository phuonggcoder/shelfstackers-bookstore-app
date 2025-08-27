const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Adjust to your server URL
const ADMIN_TOKEN = 'your-admin-token'; // Replace with actual admin token
const USER_TOKEN = 'your-user-token'; // Replace with actual user token

// Test data
const TEST_USER_ID = 'user123';
const TEST_ORDER_ID = 'order456';

// Helper function to make API calls
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${endpoint}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test voucher system
const testVoucherSystem = async () => {
  console.log('🎫 Testing Voucher System...\n');

  try {
    // ==================== ADMIN TESTS ====================

    console.log('👨‍💼 ADMIN TESTS:');
    console.log('=====================================');

    // 1. Create Discount Voucher
    console.log('\n1. Creating Discount Voucher...');
    const discountVoucher = await makeRequest('POST', '/api/vouchers', {
      voucher_id: 'SUMMER2024',
      voucher_type: 'discount',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_value: 100000,
      max_discount_value: 50000,
      usage_limit: 100,
      max_per_user: 1,
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: '2024-12-31T23:59:59.000Z',
      description: 'Giảm 20% tối đa 50k'
    }, ADMIN_TOKEN);

    // 2. Create Shipping Voucher
    console.log('\n2. Creating Shipping Voucher...');
    const shippingVoucher = await makeRequest('POST', '/api/vouchers', {
      voucher_id: 'FREESHIP',
      voucher_type: 'shipping',
      shipping_discount: 25000,
      min_order_value: 200000,
      usage_limit: 200,
      max_per_user: 2,
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: '2024-12-31T23:59:59.000Z',
      description: 'Miễn phí ship 25k'
    }, ADMIN_TOKEN);

    // 3. Create Fixed Discount Voucher
    console.log('\n3. Creating Fixed Discount Voucher...');
    const fixedVoucher = await makeRequest('POST', '/api/vouchers', {
      voucher_id: 'FIXED30K',
      voucher_type: 'discount',
      discount_type: 'fixed',
      discount_value: 30000,
      min_order_value: 150000,
      usage_limit: 50,
      max_per_user: 1,
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: '2024-12-31T23:59:59.000Z',
      description: 'Giảm cố định 30k'
    }, ADMIN_TOKEN);

    // 4. Get All Vouchers (Admin)
    console.log('\n4. Getting All Vouchers...');
    await makeRequest('GET', '/api/vouchers?page=1&limit=10', null, ADMIN_TOKEN);

    // ==================== USER TESTS ====================

    console.log('\n👤 USER TESTS:');
    console.log('=====================================');

    // 5. Get Available Vouchers
    console.log('\n5. Getting Available Vouchers...');
    const availableVouchers = await makeRequest('GET', '/api/vouchers/available');

    // 6. Validate Single Voucher
    console.log('\n6. Validating Single Voucher...');
    const validationResult = await makeRequest('POST', '/api/vouchers/validate', {
      voucher_id: 'SUMMER2024',
      user_id: TEST_USER_ID,
      order_value: 250000
    });

    // 7. Validate Multiple Vouchers
    console.log('\n7. Validating Multiple Vouchers...');
    const multipleValidation = await makeRequest('POST', '/api/vouchers/validate-multiple', {
      vouchers: [
        { voucher_id: 'SUMMER2024', voucher_type: 'discount' },
        { voucher_id: 'FREESHIP', voucher_type: 'shipping' }
      ],
      user_id: TEST_USER_ID,
      order_value: 250000,
      shipping_cost: 30000
    });

    // 8. Use Single Voucher
    console.log('\n8. Using Single Voucher...');
    const singleUsage = await makeRequest('POST', '/api/vouchers/use', {
      voucher_id: 'FIXED30K',
      user_id: TEST_USER_ID,
      order_id: TEST_ORDER_ID,
      order_value: 200000
    });

    // 9. Use Multiple Vouchers
    console.log('\n9. Using Multiple Vouchers...');
    const multipleUsage = await makeRequest('POST', '/api/vouchers/use-multiple', {
      vouchers: [
        { voucher_id: 'SUMMER2024', voucher_type: 'discount' },
        { voucher_id: 'FREESHIP', voucher_type: 'shipping' }
      ],
      user_id: TEST_USER_ID,
      order_id: 'order789',
      order_value: 300000,
      shipping_cost: 35000
    });

    // 10. Get User Voucher Usage History
    console.log('\n10. Getting User Voucher Usage History...');
    await makeRequest('GET', `/api/vouchers/my-usage/${TEST_USER_ID}?page=1&limit=10`);

    // ==================== ERROR TESTS ====================

    console.log('\n❌ ERROR TESTS:');
    console.log('=====================================');

    // 11. Test Invalid Voucher
    console.log('\n11. Testing Invalid Voucher...');
    try {
      await makeRequest('POST', '/api/vouchers/validate', {
        voucher_id: 'INVALID',
        user_id: TEST_USER_ID,
        order_value: 250000
      });
    } catch (error) {
      console.log('✅ Expected error for invalid voucher');
    }

    // 12. Test Insufficient Order Value
    console.log('\n12. Testing Insufficient Order Value...');
    try {
      await makeRequest('POST', '/api/vouchers/validate', {
        voucher_id: 'SUMMER2024',
        user_id: TEST_USER_ID,
        order_value: 50000 // Below min_order_value
      });
    } catch (error) {
      console.log('✅ Expected error for insufficient order value');
    }

    // 13. Test Duplicate Voucher Usage
    console.log('\n13. Testing Duplicate Voucher Usage...');
    try {
      await makeRequest('POST', '/api/vouchers/use', {
        voucher_id: 'FIXED30K', // Already used above
        user_id: TEST_USER_ID,
        order_id: 'order999',
        order_value: 200000
      });
    } catch (error) {
      console.log('✅ Expected error for duplicate voucher usage');
    }

    // ==================== EDGE CASES ====================

    console.log('\n🔍 EDGE CASES:');
    console.log('=====================================');

    // 14. Test Percentage Discount with Max Limit
    console.log('\n14. Testing Percentage Discount with Max Limit...');
    const maxDiscountTest = await makeRequest('POST', '/api/vouchers/validate', {
      voucher_id: 'SUMMER2024',
      user_id: TEST_USER_ID,
      order_value: 500000 // Should hit max_discount_value of 50k
    });

    // 15. Test Shipping Discount with Actual Cost
    console.log('\n15. Testing Shipping Discount with Actual Cost...');
    const shippingTest = await makeRequest('POST', '/api/vouchers/validate', {
      voucher_id: 'FREESHIP',
      user_id: TEST_USER_ID,
      order_value: 250000,
      shipping_cost: 15000 // Less than shipping_discount
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
};

// Run tests
if (require.main === module) {
  testVoucherSystem();
}

module.exports = { testVoucherSystem };
