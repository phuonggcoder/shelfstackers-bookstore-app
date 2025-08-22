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

  const getColor = (st: string) => {
    switch (st.toLowerCase()) {
      case 'pending':
        return '#f39c12';
      case 'awaitingpickup':
      case 'awaiting_pickup':
        return '#1976D2';
      case 'outfordelivery':
      case 'out_for_delivery':
        return '#FF9800';
      case 'delivered':
        return '#4CAF50';
      case 'returned':
        return '#E91E63';
      case 'cancelled':
      case 'refunded':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getLabel = (st: string) => {
    const key = (st || '').toLowerCase();
    switch (key) {
      case 'pending': return t('pending');
      case 'awaitingpickup':
      case 'awaiting_pickup': return t('awaitingPickup');
      case 'outfordelivery':
      case 'out_for_delivery': return t('outForDelivery');
      case 'delivered': return t('delivered');
      case 'returned': return t('returned');
      case 'cancelled': return t('cancelled');
      case 'refunded': return t('refunded');
      default: return st || t('unknown');
    }
  };

  const color = getColor(s);
  const label = getLabel(s);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.icon, { backgroundColor: color }]}>
        <Ionicons name="checkmark" size={16} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: '#222' }]}>{label}</Text>
        {shipperName ? (
          <Text style={styles.sub}>{t('assignedShipper')}: {shipperName}{shipperAck ? ` (${shipperAck})` : ''}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default OrderStatusBadge;
