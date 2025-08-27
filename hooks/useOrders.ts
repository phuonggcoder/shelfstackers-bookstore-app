import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, getOrderDetail } from '../services/orderService';
import OrderStatusService from '../services/orderStatusService';

export const useOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await getMyOrders(token);
      const mappedOrders = (response.orders || []).map((order: any) => {
        // Ưu tiên order_status từ backend, fallback về status cũ
        const status = order.order_status || order.status;
        
        // Kiểm tra thay đổi trạng thái
        OrderStatusService.checkStatusChange(order._id, status);
        
        return {
          _id: order._id,
          order_id: order.order_id,
          orderCode: order.order_id || order._id,
          status: status,
          totalAmount: order.total_amount,
          items: (order.order_items || []).map((oi: any) => ({
            book: oi.book_id,
            quantity: oi.quantity,
            price: oi.price
          })),
          address: order.address_id,
          shipping_address_snapshot: order.shipping_address_snapshot,
          payment_id: order.payment_id,
          assigned_shipper_id: order.assigned_shipper_id,
          assigned_shipper_name: order.assigned_shipper_name,
          shipper_ack: order.shipper_ack,
          refund_requested: order.refund_requested,
          refund_status: order.refund_status,
          refund_reason: order.refund_reason,
          createdAt: order.order_date || order.createdAt,
          updatedAt: order.updatedAt,
        };
      });
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const refreshOrders = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    refreshing,
    loadOrders,
    refreshOrders
  };
};

export const useOrderDetail = (orderId: string) => {
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOrderDetail = useCallback(async () => {
    if (!token || !orderId) return;
    
    try {
      setLoading(true);
      const response = await getOrderDetail(token, orderId);
      const order = response.order || response;
      const shippingAddressRaw = order.shipping_address_snapshot || order.address_id || {};
      
      // Ưu tiên order_status từ backend, fallback về status cũ
      const status = order.order_status || order.status;
      
      // Kiểm tra thay đổi trạng thái
      OrderStatusService.checkStatusChange(order._id, status);
      
      const mappedOrder = {
        _id: order._id,
        orderCode: order.order_id || order._id,
        status: status,
        totalAmount: order.total_amount,
        subtotal: order.subtotal || order.total_amount,
        shippingFee: order.ship_amount || order.shipping_fee || 0,
        discount_amount: order.discount_amount || 0,
        items: (order.order_items || []).map((oi: any) => ({
          book: oi.book_id,
          quantity: oi.quantity,
          price: oi.price
        })),
        paymentMethod: order.payment_id?.payment_method || order.payment_method || 'COD',
        paymentStatus: order.payment_id?.payment_status || order.payment_status || 'pending',
        payment_id: order.payment_id,
        shippingAddress: {
          receiverName: shippingAddressRaw.full_name || shippingAddressRaw.receiver_name || '',
          phoneNumber: shippingAddressRaw.phone || shippingAddressRaw.phone_number || '',
          addressDetail: shippingAddressRaw.address || shippingAddressRaw.address_detail || '',
          street: shippingAddressRaw.street || '',
          ward: typeof shippingAddressRaw.ward === 'object' ? shippingAddressRaw.ward.name : shippingAddressRaw.ward || '',
          district: typeof shippingAddressRaw.district === 'object' ? shippingAddressRaw.district.name : shippingAddressRaw.district || '',
          province: typeof shippingAddressRaw.province === 'object' ? shippingAddressRaw.province.name : shippingAddressRaw.province || '',
          fullAddress: shippingAddressRaw.fullAddress || ''
        },
        // Shipper information
        assigned_shipper_id: order.assigned_shipper_id,
        assigned_shipper_name: order.assigned_shipper_name || order.assigned_shipper_id?.full_name || '',
        assigned_shipper_phone: order.assigned_shipper_phone || order.assigned_shipper_id?.phone_number || '',
        shipper_note: order.shipper_note || '',
        shipper_ack: order.shipper_ack || '',
        // Refund information
        refund_requested: order.refund_requested || false,
        refund_status: order.refund_status || null,
        refund_reason: order.refund_reason || '',
        createdAt: order.order_date || order.createdAt,
        updatedAt: order.updatedAt,
        orderHistory: order.order_history || [],
      };
      
      setOrder(mappedOrder);
    } catch (error) {
      console.error('Error loading order detail:', error);
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  const refreshOrderDetail = useCallback(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  return {
    order,
    loading,
    loadOrderDetail,
    refreshOrderDetail
  };
}; 
