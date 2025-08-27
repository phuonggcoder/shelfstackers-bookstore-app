import axios from 'axios';
import { getApiUrl, getAuthHeaders } from '../config/api';

export type VoucherType = 'discount' | 'shipping';
export type DiscountType = 'fixed' | 'percentage';

export interface Voucher {
  _id: string;
  voucher_id: string;
  voucher_type: VoucherType;
  discount_type?: DiscountType; // Chỉ cho discount voucher
  discount_value?: number; // Chỉ cho discount voucher
  shipping_discount?: number; // Chỉ cho shipping voucher
  min_order_value: number;
  max_discount_value?: number; // Chỉ cho percentage discount
  usage_limit: number;
  usage_count: number;
  max_per_user: number;
  start_date: string;
  end_date: string;
  used_by: Array<{
    user: string;
    order: string;
    used_at: string;
    discount_amount: number;
  }>;
  is_active: boolean;
  is_deleted: boolean;
  description: string;
  isValid?: boolean;
  remainingUsage?: number;
}

export interface VoucherValidationRequest {
  voucher_id: string;
  user_id: string;
  order_value: number;
  shipping_cost?: number;
}

export interface VoucherValidationResponse {
  success: boolean;
  valid: boolean;
  voucher?: Voucher;
  discount_amount?: number;
  final_amount?: number;
  message: string;
}

export interface MultipleVoucherValidationRequest {
  vouchers: Array<{
    voucher_id: string;
    voucher_type: VoucherType;
  }>;
  user_id: string;
  order_value: number;
  shipping_cost: number;
}

export interface MultipleVoucherValidationResponse {
  success: boolean;
  results: Array<{
    voucher_id: string;
    voucher_type: VoucherType;
    valid: boolean;
    discount_amount: number;
    message: string;
  }>;
  summary: {
    order_value: number;
    total_discount: number;
    final_amount: number;
    vouchers_applied: number;
  };
}

export interface VoucherUsageRequest {
  voucher_id: string;
  user_id: string;
  order_id: string;
  order_value: number;
  shipping_cost?: number;
}

export interface MultipleVoucherUsageRequest {
  vouchers: Array<{
    voucher_id: string;
    voucher_type: VoucherType;
  }>;
  user_id: string;
  order_id: string;
  order_value: number;
  shipping_cost: number;
}

// Voucher Management
export const getAvailableVouchers = async (token?: string, minOrderValue?: number, voucherType?: VoucherType) => {
  try {
    let url = getApiUrl('/api/vouchers/available');
    const params = new URLSearchParams();
    
    if (voucherType) {
      params.append('voucher_type', voucherType);
    }
    if (minOrderValue) {
      params.append('min_order_value', minOrderValue.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Public endpoint - không cần auth headers (Backend đã được fix)
    const response = await axios.get(url);
    
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

// Validate single voucher (Public endpoint - không cần auth)
export const validateVoucher = async (token: string, voucherCode: string, orderValue: number): Promise<VoucherValidationResponse> => {
  try {
    const request: VoucherValidationRequest = {
      voucher_id: voucherCode,
      user_id: '', // Will be set by backend
      order_value: orderValue,
    };
    
    // Public endpoint - không cần auth headers
    const response = await axios.post(getApiUrl('/api/vouchers/validate'), request);
    console.log('validateVoucher response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('validateVoucher error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to validate voucher');
  }
};

// Validate multiple vouchers (Public endpoint - không cần auth)
export const validateMultipleVouchers = async (token: string, request: MultipleVoucherValidationRequest): Promise<MultipleVoucherValidationResponse> => {
  try {
    // Public endpoint - không cần auth headers
    const response = await axios.post(getApiUrl('/api/vouchers/validate-multiple'), request);
    console.log('validateMultipleVouchers response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('validateMultipleVouchers error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to validate multiple vouchers');
  }
};

// Use single voucher (Public endpoint - không cần auth)
export const useVoucher = async (token: string, request: VoucherUsageRequest) => {
  try {
    // Public endpoint - không cần auth headers
    const response = await axios.post(getApiUrl('/api/vouchers/use'), request);
    console.log('useVoucher response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('useVoucher error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to use voucher');
  }
};

// Use multiple vouchers (Public endpoint - không cần auth)
export const useMultipleVouchers = async (token: string, request: MultipleVoucherUsageRequest) => {
  try {
    // Public endpoint - không cần auth headers
    const response = await axios.post(getApiUrl('/api/vouchers/use-multiple'), request);
    console.log('useMultipleVouchers response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('useMultipleVouchers error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to use multiple vouchers');
  }
};

// Get user's voucher usage history (Public endpoint - không cần auth)
export const getUserVoucherUsage = async (token: string, userId: string, page = 1, limit = 10) => {
  try {
    // Public endpoint - không cần auth headers
    const response = await axios.get(getApiUrl(`/api/vouchers/my-usage/${userId}?page=${page}&limit=${limit}`));
    console.log('getUserVoucherUsage response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getUserVoucherUsage error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch user voucher usage');
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

// Order Integration Endpoints (Yêu cầu User Authentication)

export interface OrderVoucherValidationRequest {
  voucher_id: string;
  cart_total: number;
}

export interface OrderVoucherValidationResponse {
  valid: boolean;
  voucher?: {
    id: string;
    voucher_id: string;
    voucher_type: VoucherType;
    discount_type?: DiscountType;
    discount_value?: number;
    min_order_value: number;
    max_discount_value?: number;
  };
  discount_amount: number;
  original_amount: number;
  final_amount: number;
}

// Validate voucher trong order context (Yêu cầu User Authentication)
export const validateVoucherInOrder = async (token: string, request: OrderVoucherValidationRequest): Promise<OrderVoucherValidationResponse> => {
  try {
    const response = await axios.post(getApiUrl('/api/orders/validate-voucher'), request, {
      headers: getAuthHeaders(token)
    });
    console.log('validateVoucherInOrder response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('validateVoucherInOrder error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to validate voucher in order');
  }
}; 
