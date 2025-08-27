import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
    MultipleVoucherUsageRequest,
    MultipleVoucherValidationRequest,
    MultipleVoucherValidationResponse,
    useMultipleVouchers
} from '../services/voucherService';

interface UseVoucherProps {
  orderValue: number;
  shippingCost: number;
}

interface UseVoucherReturn {
  voucherResult: MultipleVoucherValidationResponse | null;
  isApplying: boolean;
  isUsing: boolean;
  applyVouchers: (request: MultipleVoucherValidationRequest) => Promise<boolean>;
  useVouchers: (orderId: string) => Promise<boolean>;
  clearVouchers: () => void;
  getTotalDiscount: () => number;
  getFinalAmount: () => number;
  getAppliedVouchersCount: () => number;
}

export const useVoucher = ({ orderValue, shippingCost }: UseVoucherProps): UseVoucherReturn => {
  const { user, token } = useAuth();
  const [voucherResult, setVoucherResult] = useState<MultipleVoucherValidationResponse | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isUsing, setIsUsing] = useState(false);

  const applyVouchers = useCallback(async (request: MultipleVoucherValidationRequest): Promise<boolean> => {
    if (!token || !user?._id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng voucher');
      return false;
    }

    setIsApplying(true);
    try {
      const result = await useMultipleVouchers(token, request);
      
      if (result.success) {
        setVoucherResult(result);
        return true;
      } else {
        Alert.alert('Lỗi', 'Không thể áp dụng voucher');
        return false;
      }
    } catch (error: any) {
      console.error('Error applying vouchers:', error);
      Alert.alert('Lỗi', error.message || 'Không thể áp dụng voucher');
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [token, user?._id]);

  const useVouchers = useCallback(async (orderId: string): Promise<boolean> => {
    if (!voucherResult || !token || !user?._id) {
      return false;
    }

    const validVouchers = voucherResult.results.filter(v => v.valid);
    if (validVouchers.length === 0) {
      return false;
    }

    setIsUsing(true);
    try {
      const request: MultipleVoucherUsageRequest = {
        vouchers: validVouchers.map(v => ({
          voucher_id: v.voucher_id,
          voucher_type: v.voucher_type,
        })),
        user_id: user._id,
        order_id: orderId,
        order_value: orderValue,
        shipping_cost: shippingCost,
      };

      const result = await useMultipleVouchers(token, request);
      
      if (result.success) {
        // Clear voucher result after successful usage
        setVoucherResult(null);
        return true;
      } else {
        Alert.alert('Lỗi', 'Không thể sử dụng voucher');
        return false;
      }
    } catch (error: any) {
      console.error('Error using vouchers:', error);
      Alert.alert('Lỗi', error.message || 'Không thể sử dụng voucher');
      return false;
    } finally {
      setIsUsing(false);
    }
  }, [voucherResult, token, user?._id, orderValue, shippingCost]);

  const clearVouchers = useCallback(() => {
    setVoucherResult(null);
  }, []);

  const getTotalDiscount = useCallback((): number => {
    if (!voucherResult) return 0;
    return voucherResult.summary.total_discount;
  }, [voucherResult]);

  const getFinalAmount = useCallback((): number => {
    if (!voucherResult) return orderValue + shippingCost;
    return voucherResult.summary.final_amount;
  }, [voucherResult, orderValue, shippingCost]);

  const getAppliedVouchersCount = useCallback((): number => {
    if (!voucherResult) return 0;
    return voucherResult.results.filter(v => v.valid).length;
  }, [voucherResult]);

  return {
    voucherResult,
    isApplying,
    isUsing,
    applyVouchers,
    useVouchers,
    clearVouchers,
    getTotalDiscount,
    getFinalAmount,
    getAppliedVouchersCount,
  };
};
