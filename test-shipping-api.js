const axios = require('axios');

// Configuration
const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const TOKEN = 'your-token-here'; // Replace with actual token
const ADDRESS_ID = '68adc02ba449a6033d74d006'; // Replace with actual address ID

// Test cases
const testCases = [
  {
    name: 'Basic shipping calculation (no voucher)',
    request: {
      address_id: ADDRESS_ID,
      weight: 0.5,
      subtotal: 23000
    }
  },
  {
    name: 'Shipping with order voucher',
    request: {
      address_id: ADDRESS_ID,
      weight: 0.5,
      subtotal: 23000,
      voucher_code_order: 'MAVOUCHER2' // Replace with actual voucher code
    }
  },
  {
    name: 'Shipping with shipping voucher',
    request: {
      address_id: ADDRESS_ID,
      weight: 0.5,
      subtotal: 23000,
      voucher_code_shipping: 'VIPCHOUER' // Replace with actual voucher code
    }
  },
  {
    name: 'Shipping with both vouchers',
    request: {
      address_id: ADDRESS_ID,
      weight: 0.5,
      subtotal: 23000,
      voucher_code_order: 'MAVOUCHER2',
      voucher_code_shipping: 'VIPCHOUER'
    }
  }
];

async function testShippingAPI() {
  console.log('🚀 Testing Shipping API with Total Price Calculation\n');
  
  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log('Request:', JSON.stringify(testCase.request, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/orders/calculate-shipping`, testCase.request, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Response Status:', response.status);
      
      if (response.data.success) {
        console.log('✅ API Response:');
        console.log('  - Fees:', response.data.fees?.length || 0, 'options available');
        
        if (response.data.priceBreakdown) {
          console.log('  - Price Breakdown:');
          console.log(`    Subtotal: ${response.data.priceBreakdown.subtotal.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Order Discount: ${response.data.priceBreakdown.order_discount_amount.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Final Amount: ${response.data.priceBreakdown.final_amount.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Shipping Fee: ${response.data.priceBreakdown.shipping_fee.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Shipping Discount: ${response.data.priceBreakdown.shipping_discount_amount.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Final Shipping Fee: ${response.data.priceBreakdown.final_shipping_fee.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Total Price: ${response.data.priceBreakdown.total_price.toLocaleString('vi-VN')} VNĐ`);
        }
        
        if (response.data.vouchers) {
          console.log('  - Vouchers Applied:');
          if (response.data.vouchers.orderVoucher) {
            console.log(`    Order Voucher: ${response.data.vouchers.orderVoucher.voucher_id} (-${response.data.vouchers.orderVoucher.applied_discount.toLocaleString('vi-VN')} VNĐ)`);
          }
          if (response.data.vouchers.shippingVoucher) {
            console.log(`    Shipping Voucher: ${response.data.vouchers.shippingVoucher.voucher_id} (-${response.data.vouchers.shippingVoucher.applied_discount.toLocaleString('vi-VN')} VNĐ)`);
          }
        }
        
        // Validate calculation
        if (response.data.priceBreakdown) {
          const calculatedTotal = response.data.priceBreakdown.final_amount + response.data.priceBreakdown.final_shipping_fee;
          const apiTotal = response.data.priceBreakdown.total_price;
          
          if (Math.abs(calculatedTotal - apiTotal) < 1) {
            console.log('✅ Price calculation is correct!');
          } else {
            console.log('❌ Price calculation mismatch!');
            console.log(`  Calculated: ${calculatedTotal.toLocaleString('vi-VN')} VNĐ`);
            console.log(`  API Total: ${apiTotal.toLocaleString('vi-VN')} VNĐ`);
          }
        }
      } else {
        console.log('❌ API returned error:', response.data.msg);
      }
      
    } catch (error) {
      console.log('❌ Test failed:');
      if (error.response) {
        console.log('  Status:', error.response.status);
        console.log('  Error:', error.response.data);
      } else {
        console.log('  Error:', error.message);
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

// Run tests
if (TOKEN === 'your-token-here') {
  console.log('❌ Please update TOKEN and ADDRESS_ID in the script before running');
  console.log('Usage: node test-shipping-api.js');
} else {
  testShippingAPI().catch(console.error);
}
