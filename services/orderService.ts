import axios from 'axios';
import { getApiUrl, getAuthHeaders } from '../config/api';
import { storageHelper } from '../config/storage';

// Order Management
export const createOrder = async (token: string, orderData: {
  address_id: string;
  payment_method: string;
  voucher_code?: string;
  book_id?: string;
  quantity?: number;
}) => {
  try {
    // Lấy device_id từ storage
    const deviceId = await storageHelper.getOrCreateMobileDeviceId();
    const dataWithDevice = { ...orderData, created_device_id: deviceId };

    const response = await axios.post(getApiUrl('/api/orders'), dataWithDevice, {
      headers: getAuthHeaders(token)
    });
    console.log('createOrder response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('createOrder error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

export const getMyOrders = async (token: string, page = 1, limit = 10, status?: string) => {
  try {
    let url = getApiUrl(`/api/orders/my?page=${page}&limit=${limit}`);
    if (status) url += `&status=${status}`;
    
    const response = await axios.get(url, {
      headers: getAuthHeaders(token)
    });
    console.log('getMyOrders response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getMyOrders error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch orders');
  }
};

export const getOrderDetail = async (token: string, orderId: string) => {
  try {
    const response = await axios.get(getApiUrl(`/api/orders/${orderId}`), {
      headers: getAuthHeaders(token)
    });
    console.log('getOrderDetail response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getOrderDetail error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch order details');
  }
};

export const cancelOrder = async (token: string, orderId: string, cancellationReason: string) => {
  try {
    const response = await axios.patch(getApiUrl(`/api/orders/${orderId}/cancel`), {
      cancellation_reason: cancellationReason
    }, {
      headers: getAuthHeaders(token)
    });
    console.log('cancelOrder response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('cancelOrder error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to cancel order');
  }
};

// Admin functions
export const updateOrderStatus = async (adminToken: string, orderId: string, orderStatus: string) => {
  try {
    const response = await axios.patch(getApiUrl(`/api/orders/${orderId}/status`), {
      order_status: orderStatus
    }, {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update order status');
  }
};

export const getAllOrders = async (adminToken: string, page = 1, limit = 20, status?: string) => {
  try {
    let url = getApiUrl(`/api/orders?page=${page}&limit=${limit}`);
    if (status) url += `&status=${status}`;
    
    const response = await axios.get(url, {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch all orders');
  }
};

export const getOrderStatistics = async (adminToken: string) => {
  try {
    const response = await axios.get(getApiUrl('/api/orders/stats/summary'), {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch order statistics');
  }
}; 