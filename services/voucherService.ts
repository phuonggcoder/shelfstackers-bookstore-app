import axios from 'axios';
import { getApiUrl, getAuthHeaders } from '../config/api';

export type Voucher = {
  _id: string;
  voucher_id: string;
  voucher_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount_value?: number;
  usage_limit: number;
  max_per_user: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  notes?: string;
  title?: string;
  description?: string;
};



// Voucher Management
export const getAvailableVouchers = async (token: string, minOrderValue?: number) => {
  try {
    // Try new endpoint first
    const response = await axios.get(getApiUrl('/api/vouchers/available'), {
      headers: getAuthHeaders(token)
    });
    
    console.log('getAvailableVouchers response:', response.data);
    
    // Handle different response structures
    if (response.data && response.data.vouchers) {
      return { vouchers: response.data.vouchers };
    } else if (Array.isArray(response.data)) {
      return { vouchers: response.data };
    } else {
      return { vouchers: [] };
    }
  } catch (error: any) {
    console.error('getAvailableVouchers error:', error.response?.data || error.message);
    // Return empty array instead of throwing error
    return { vouchers: [] };
  }
};

export const getVoucherDetails = async (token: string, voucherId: string) => {
  try {
    const response = await axios.get(getApiUrl(`/api/vouchers/${voucherId}`), {
      headers: getAuthHeaders(token)
    });
    console.log('getVoucherDetails response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getVoucherDetails error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch voucher details');
  }
};

export const validateVoucher = async (token: string, voucherCode: string, orderTotal: number) => {
  try {
    const response = await axios.post(getApiUrl('/api/vouchers/validate'), {
      voucher_code: voucherCode,
      order_total: orderTotal
    }, {
      headers: getAuthHeaders(token)
    });
    console.log('validateVoucher response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('validateVoucher error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to validate voucher');
  }
};

// Admin functions (if needed)
export const getAllVouchersAdmin = async (adminToken: string, page = 1, limit = 20, isActive = true) => {
  try {
    const response = await axios.get(getApiUrl(`/api/vouchers?page=${page}&limit=${limit}&is_active=${isActive}`), {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch all vouchers');
  }
};

export const createVoucherAdmin = async (adminToken: string, voucherData: any) => {
  try {
    const response = await axios.post(getApiUrl('/api/vouchers'), voucherData, {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create voucher');
  }
};

export const updateVoucherAdmin = async (adminToken: string, voucherId: string, updateData: any) => {
  try {
    const response = await axios.put(getApiUrl(`/api/vouchers/${voucherId}`), updateData, {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update voucher');
  }
};

export const deleteVoucherAdmin = async (adminToken: string, voucherId: string) => {
  try {
    const response = await axios.delete(getApiUrl(`/api/vouchers/${voucherId}`), {
      headers: getAuthHeaders(adminToken)
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete voucher');
  }
}; 