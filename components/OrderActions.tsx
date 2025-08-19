import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

type Props = {
  status?: string | null;
  orderId?: string | null;
};

const OrderActions: React.FC<Props> = ({ status, orderId }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const s = (status || '').toString();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.primary} onPress={() => router.replace('/order-history')}>
        <Text style={styles.primaryText}>{t('viewOrderHistory')}</Text>
      </TouchableOpacity>

      {s === 'Pending' && (
        <TouchableOpacity style={styles.secondary} onPress={() => router.replace({ pathname: '/order-detail', params: { orderId } })}>
          <Text style={styles.secondaryText}>{t('contactSupport')}</Text>
        </TouchableOpacity>
      )}

      {s === 'AwaitingPickup' && (
        <TouchableOpacity style={styles.secondary} onPress={() => router.replace({ pathname: '/order-detail', params: { orderId } })}>
          <Text style={styles.secondaryText}>{t('trackOrder')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondary} onPress={() => router.replace('/') }>
        <Text style={styles.secondaryText}>{t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center' },
  primary: { backgroundColor: '#3255FB', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 30, marginBottom: 10, width: '100%', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondary: { borderColor: '#3255FB', borderWidth: 2, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, width: '100%', alignItems: 'center', backgroundColor: '#fff', marginTop: 10 },
  secondaryText: { color: '#3255FB', fontWeight: 'bold', fontSize: 16 },
});

export default OrderActions;
