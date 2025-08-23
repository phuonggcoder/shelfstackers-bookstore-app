const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// PayOS webhook handler according to official documentation
// https://payos.vn/docs/du-lieu-tra-ve/webhook/

router.post('/webhook', async (req, res) => {
  try {
    const { code, desc, success, data, signature } = req.body;
    
    console.log('PayOS Webhook received:', {
      code,
      desc,
      success,
      data,
      signature: signature ? 'Present' : 'Missing'
    });
    
    // Verify signature (optional but recommended)
    const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
    if (PAYOS_CHECKSUM_KEY && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', PAYOS_CHECKSUM_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }
    
    // Process webhook data according to PayOS documentation
    if (success && code === '00') {
      // Payment successful
      const {
        orderCode,
        amount,
        description,
        accountNumber,
        reference,
        transactionDateTime,
        currency,
        paymentLinkId,
        code: paymentCode,
        desc: paymentDesc
      } = data;
      
      console.log('Payment successful:', {
        orderCode,
        amount,
        description,
        accountNumber,
        reference,
        transactionDateTime,
        paymentLinkId
      });
      
      // Update order status in database
      // This should match your order model
      try {
        // Find order by orderCode or paymentLinkId
        const order = await Order.findOne({
          $or: [
            { orderCode: orderCode },
            { 'payment.paymentLinkId': paymentLinkId }
          ]
        });
        
        if (order) {
          // Update order status
          order.status = 'paid';
          order.payment_status = 'completed';
          order.payment_details = {
            transaction_id: reference,
            payment_method: 'PAYOS',
            amount: amount,
            currency: currency,
            payment_date: transactionDateTime,
            account_number: accountNumber
          };
          
          await order.save();
          console.log('Order updated successfully:', order._id);
        } else {
          console.error('Order not found for payment:', { orderCode, paymentLinkId });
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
      
    } else {
      // Payment failed or cancelled
      console.log('Payment failed:', { code, desc });
      
      // Update order status to failed
      try {
        const order = await Order.findOne({
          $or: [
            { orderCode: data?.orderCode },
            { 'payment.paymentLinkId': data?.paymentLinkId }
          ]
        });
        
        if (order) {
          order.status = 'payment_failed';
          order.payment_status = 'failed';
          order.payment_details = {
            error_code: code,
            error_message: desc,
            payment_method: 'PAYOS'
          };
          
          await order.save();
          console.log('Order marked as failed:', order._id);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }
    
    // Return 200 to acknowledge webhook receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Test webhook endpoint
router.post('/test-webhook', (req, res) => {
  console.log('Test webhook received:', req.body);
  res.status(200).json({ 
    success: true, 
    message: 'Test webhook received' 
  });
});

module.exports = router;
