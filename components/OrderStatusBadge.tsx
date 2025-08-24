import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  status?: string | null;
  shipperName?: string | null;
  shipperAck?: string | null;
  style?: any;
};

const OrderStatusBadge: React.FC<Props> = ({ status, shipperName, shipperAck, style }) => {
  const { t } = useTranslation();
  const s = (status || '').toString();

  const getStatusConfig = (st: string) => {
    const normalized = st.toLowerCase();
    switch (normalized) {
      case 'pending':
        return {
          color: '#f39c12',
          icon: 'time-outline',
          label: t('pending'),
          description: t('orderPendingDescription')
        };
      case 'awaitingpickup':
      case 'awaiting_pickup':
        return {
          color: '#1976D2',
          icon: 'bag-outline',
          label: t('awaitingPickup'),
          description: t('orderAwaitingPickupDescription')
        };
      case 'outfordelivery':
      case 'out_for_delivery':
        return {
          color: '#FF9800',
          icon: 'bicycle-outline',
          label: t('outForDelivery'),
          description: t('orderOutForDeliveryDescription')
        };
      case 'delivered':
        return {
          color: '#4CAF50',
          icon: 'checkmark-circle-outline',
          label: t('delivered'),
          description: t('orderDeliveredDescription')
        };
      case 'returned':
        return {
          color: '#E91E63',
          icon: 'arrow-undo-outline',
          label: t('returned'),
          description: t('orderReturnedDescription')
        };
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_admin':
        return {
          color: '#e74c3c',
          icon: 'close-circle-outline',
          label: t('cancelled'),
          description: t('orderCancelledDescription')
        };
      case 'refunded':
        return {
          color: '#9C27B0',
          icon: 'card-outline',
          label: t('refunded'),
          description: t('orderRefundedDescription')
        };
      default:
        return {
          color: '#95a5a6',
          icon: 'help-circle-outline',
          label: st || t('unknown'),
          description: t('orderUnknownDescription')
        };
    }
  };

  const statusConfig = getStatusConfig(s);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.icon, { backgroundColor: statusConfig.color }]}>
        <Ionicons name={statusConfig.icon as any} size={16} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: '#222' }]}>{statusConfig.label}</Text>
        <Text style={styles.description}>{statusConfig.description}</Text>
        {shipperName && (
          <Text style={styles.sub}>
            {t('assignedShipper')}: {shipperName}
            {shipperAck ? ` (${shipperAck})` : ''}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    paddingVertical: 4
  },
  icon: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  info: { 
    flex: 1 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '700',
    marginBottom: 2
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  sub: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 2 
  },
});

export default OrderStatusBadge;
