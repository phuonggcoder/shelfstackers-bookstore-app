const axios = require('axios');

// Configuration
const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const TOKEN = 'your-token-here'; // Replace with actual token
const ADDRESS_ID = '68adc02ba449a6033d74d006'; // Replace with actual address ID
const BOOK_ID = '68469fcc4f01d3e4ebde4c05'; // Replace with actual book ID

// Test cases for order creation with total price calculation
const testCases = [
  {
    name: 'COD Payment - No voucher',
    request: {
      address_id: ADDRESS_ID,
      payment_method: 'COD',
      book_id: BOOK_ID,
      quantity: 1
    },
    expected: {
      payment_method: 'COD',
      includes_shipping: true,
      total_correct: true
    }
  },
  {
    name: 'PayOS Payment - With order voucher',
    request: {
      address_id: ADDRESS_ID,
      payment_method: 'PAYOS',
      book_id: BOOK_ID,
      quantity: 1,
      voucher_code_order: 'MAVOUCHER2' // Replace with actual voucher code
    },
    expected: {
      payment_method: 'PAYOS',
      includes_shipping: true,
      includes_order_discount: true,
      total_correct: true
    }
  },
  {
    name: 'ZaloPay Payment - With shipping voucher',
    request: {
      address_id: ADDRESS_ID,
      payment_method: 'ZALOPAY',
      book_id: BOOK_ID,
      quantity: 1,
      voucher_code_shipping: 'VIPCHOUER' // Replace with actual voucher code
    },
    expected: {
      payment_method: 'ZALOPAY',
      includes_shipping: true,
      includes_shipping_discount: true,
      total_correct: true
    }
  },
  {
    name: 'COD Payment - With both vouchers',
    request: {
      address_id: ADDRESS_ID,
      payment_method: 'COD',
      book_id: BOOK_ID,
      quantity: 1,
      voucher_code_order: 'MAVOUCHER2',
      voucher_code_shipping: 'VIPCHOUER'
    },
    expected: {
      payment_method: 'COD',
      includes_shipping: true,
      includes_order_discount: true,
      includes_shipping_discount: true,
      total_correct: true
    }
  }
];

async function testOrderPaymentTotal() {
  console.log('🚀 Testing Order Payment Total Calculation\n');
  
  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log('Request:', JSON.stringify(testCase.request, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/orders`, testCase.request, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      console.log('✅ Response Status:', response.status);
      
      if (response.data.success) {
        const order = response.data.order;
        const payment = response.data.payment;
        
        console.log('✅ Order created successfully:');
        console.log(`  - Order ID: ${order.order_id}`);
        console.log(`  - Total Amount: ${order.total_amount.toLocaleString('vi-VN')} VNĐ`);
        console.log(`  - Ship Amount: ${order.ship_amount.toLocaleString('vi-VN')} VNĐ`);
        console.log(`  - Discount Amount: ${order.discount_amount.toLocaleString('vi-VN')} VNĐ`);
        
        console.log('✅ Payment details:');
        console.log(`  - Payment Method: ${payment.payment_method}`);
        console.log(`  - Payment Amount: ${payment.amount.toLocaleString('vi-VN')} VNĐ`);
        console.log(`  - Payment Status: ${payment.payment_status}`);
        
        // Check if total price includes shipping
        const includesShipping = order.ship_amount > 0;
        console.log(`  - Includes Shipping: ${includesShipping ? '✅' : '❌'}`);
        
        // Check if payment amount matches order total
        const amountMatches = payment.amount === order.total_amount;
        console.log(`  - Payment Amount Matches Order Total: ${amountMatches ? '✅' : '❌'}`);
        
        // Check voucher application
        if (testCase.request.voucher_code_order) {
          const hasOrderDiscount = order.discount_amount > 0;
          console.log(`  - Order Voucher Applied: ${hasOrderDiscount ? '✅' : '❌'}`);
        }
        
        if (testCase.request.voucher_code_shipping) {
          const hasShippingDiscount = order.ship_amount < (order.total_amount - order.discount_amount);
          console.log(`  - Shipping Voucher Applied: ${hasShippingDiscount ? '✅' : '❌'}`);
        }
        
        // Validate total price calculation
        const expectedTotal = order.total_amount;
        const actualTotal = payment.amount;
        
        if (expectedTotal === actualTotal) {
          console.log('✅ Total price calculation is correct!');
        } else {
          console.log('❌ Total price calculation mismatch!');
          console.log(`  Expected: ${expectedTotal.toLocaleString('vi-VN')} VNĐ`);
          console.log(`  Actual: ${actualTotal.toLocaleString('vi-VN')} VNĐ`);
        }
        
        // Check payment gateway integration
        if (payment.payment_method === 'PAYOS' && response.data.payosPay) {
          console.log('✅ PayOS payment created:');
          console.log(`  - Checkout URL: ${response.data.payosPay.checkoutUrl || 'N/A'}`);
        }
        
        if (payment.payment_method === 'ZALOPAY' && response.data.zaloPay) {
          console.log('✅ ZaloPay payment created:');
          console.log(`  - Order URL: ${response.data.zaloPay.order_url || 'N/A'}`);
          console.log(`  - QR Code: ${response.data.zaloPay.qr_code ? 'Available' : 'N/A'}`);
        }
        
      } else {
        console.log('❌ Order creation failed:', response.data.msg);
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

// Test shipping calculation API
async function testShippingCalculation() {
  console.log('🚀 Testing Shipping Calculation API\n');
  
  const shippingTestCases = [
    {
      name: 'Basic shipping calculation',
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
        voucher_code_order: 'MAVOUCHER2'
      }
    },
    {
      name: 'Shipping with shipping voucher',
      request: {
        address_id: ADDRESS_ID,
        weight: 0.5,
        subtotal: 23000,
        voucher_code_shipping: 'VIPCHOUER'
      }
    }
  ];
  
  for (const testCase of shippingTestCases) {
    console.log(`📦 Test: ${testCase.name}`);
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
        console.log('✅ Shipping calculation successful:');
        
        if (response.data.priceBreakdown) {
          const breakdown = response.data.priceBreakdown;
          console.log('  - Price Breakdown:');
          console.log(`    Subtotal: ${breakdown.subtotal.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Order Discount: ${breakdown.order_discount_amount.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Final Amount: ${breakdown.final_amount.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Shipping Fee: ${breakdown.shipping_fee.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Shipping Discount: ${breakdown.shipping_discount_amount.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Final Shipping Fee: ${breakdown.final_shipping_fee.toLocaleString('vi-VN')} VNĐ`);
          console.log(`    Total Price: ${breakdown.total_price.toLocaleString('vi-VN')} VNĐ`);
          
          // Validate calculation
          const calculatedTotal = breakdown.final_amount + breakdown.final_shipping_fee;
          const apiTotal = breakdown.total_price;
          
          if (Math.abs(calculatedTotal - apiTotal) < 1) {
            console.log('✅ Price calculation is correct!');
          } else {
            console.log('❌ Price calculation mismatch!');
            console.log(`  Calculated: ${calculatedTotal.toLocaleString('vi-VN')} VNĐ`);
            console.log(`  API Total: ${apiTotal.toLocaleString('vi-VN')} VNĐ`);
          }
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
        
      } else {
        console.log('❌ Shipping calculation failed:', response.data.msg);
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
  console.log('❌ Please update TOKEN, ADDRESS_ID, and BOOK_ID in the script before running');
  console.log('Usage: node test-order-payment-total.js');
} else {
  console.log('🧪 Running Order Payment Total Tests...\n');
  
  // Run shipping calculation tests first
  testShippingCalculation()
    .then(() => {
      console.log('\n🧪 Running Order Creation Tests...\n');
      return testOrderPaymentTotal();
    })
    .then(() => {
      console.log('✅ All tests completed!');
    })
    .catch(console.error);
}
