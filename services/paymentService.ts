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