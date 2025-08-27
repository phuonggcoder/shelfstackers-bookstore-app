import axios from 'axios';
import { getApiUrl, getAuthHeaders } from '../config/api';

// Payment Management
export const getOrderPayment = async (token: string, orderId: string) => {
  try {
    const response = await axios.get(getApiUrl(`/api/orders/${orderId}/payment`), {
      headers: getAuthHeaders(token)
    });
    console.log('getOrderPayment response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getOrderPayment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch payment info');
  }
};

export const updatePaymentStatus = async (token: string, orderId: string, paymentData: {
  payment_status: string;
  transaction_id?: string;
  notes?: string;
}) => {
  try {
    const response = await axios.patch(getApiUrl(`/api/orders/${orderId}/payment`), paymentData, {
      headers: getAuthHeaders(token)
    });
    console.log('updatePaymentStatus response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('updatePaymentStatus error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update payment status');
  }
};

// Payment method constants
export const PAYMENT_METHODS = {
  COD: 'COD',
  MOMO: 'MOMO',
  ZALOPAY: 'ZALOPAY',
  PAYOS: 'PAYOS',
  VNPAY: 'VNPAY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment method display names
export const PAYMENT_METHOD_NAMES = {
  [PAYMENT_METHODS.COD]: 'Thanh toán khi nhận hàng',
  [PAYMENT_METHODS.MOMO]: 'Ví MoMo',
  [PAYMENT_METHODS.ZALOPAY]: 'ZaloPay',
  [PAYMENT_METHODS.VNPAY]: 'VNPay',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Thẻ tín dụng',
  [PAYMENT_METHODS.PAYOS]: 'PayOS'
} as const;

// Payment method icons (you can add your icon imports here)
export const PAYMENT_METHOD_ICONS = {
  [PAYMENT_METHODS.COD]: '💰',
  [PAYMENT_METHODS.MOMO]: '💜',
  [PAYMENT_METHODS.ZALOPAY]: '💙',
  [PAYMENT_METHODS.VNPAY]: '💚',
  [PAYMENT_METHODS.BANK_TRANSFER]: '🏦',
  [PAYMENT_METHODS.CREDIT_CARD]: '💳'
} as const;

// Create PayOS payment (server should create PayOS checkout / vietqr and return payload)
export const createPayOSPayment = async (token: string, orderId: string, amount: number = 100000) => {
  try {
    console.log('Creating PayOS payment for order:', orderId, 'amount:', amount);
    
    // Call real PayOS API endpoint
    const response = await axios.post(getApiUrl('/api/payments/create'), {
      order_id: orderId,
      payment_method: PAYMENT_METHODS.PAYOS,
      amount: amount,
      currency: 'VND',
      return_url: 'bookshelfstacker://payment-return',
      cancel_url: 'bookshelfstacker://payment-cancel'
    }, {
      headers: getAuthHeaders(token)
    });
    
    console.log('PayOS API response:', response.data);
    
    // Transform backend response to frontend expected format
    if (response.data && response.data.success) {
      const payosData = response.data.payment || response.data.data;
      
      return {
        success: true,
        data: {
          checkout_url: payosData.checkoutUrl || payosData.order_url,
          vietqr_url: payosData.qrCode ? 
            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${payosData.qrCode}` : 
            null,
          bank_info: {
            bankName: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
            accountName: payosData.accountName || 'NGUYEN DUY PHUONG',
            accountNumber: payosData.accountNumber || 'VQRQADXSY7554',
            amount: `${amount.toLocaleString()} VND`,
            description: payosData.description || `Thanh toan don hang ${orderId}`
          },
          payment_id: payosData.paymentLinkId || payosData.payment_id,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      };
    }
    
    throw new Error('Invalid response from PayOS API');
    
  } catch (error: any) {
    console.error('createPayOSPayment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create PayOS payment');
  }
};

// Handle PayOS webhook data (for backend integration)
export const handlePayOSWebhook = (webhookData: any) => {
  // According to PayOS webhook documentation
  const { code, desc, success, data, signature } = webhookData;
  
  if (success && code === '00') {
    // Payment successful
    return {
      success: true,
      orderCode: data.orderCode,
      amount: data.amount,
      description: data.description,
      accountNumber: data.accountNumber,
      reference: data.reference,
      transactionDateTime: data.transactionDateTime,
      currency: data.currency,
      paymentLinkId: data.paymentLinkId,
      code: data.code,
      desc: data.desc
    };
  } else {
    // Payment failed or cancelled
    return {
      success: false,
      code,
      desc
    };
  }
};
