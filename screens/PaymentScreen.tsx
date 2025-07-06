import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type PaymentMethod = 'card' | 'momo' | 'cod';

const PaymentScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const renderPaymentMethodOption = (method: PaymentMethod, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.paymentMethodOption,
        selectedMethod === method && styles.selectedPaymentMethod,
      ]}
      onPress={() => setSelectedMethod(method)}
    >
      <Ionicons name={icon as any} size={24} color={selectedMethod === method ? '#4A3780' : '#666'} />
      <Text style={[
        styles.paymentMethodLabel,
        selectedMethod === method && styles.selectedPaymentMethodLabel,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Phương thức thanh toán</Text>
      
      <View style={styles.paymentMethodsContainer}>
        {renderPaymentMethodOption('card', 'Thẻ tín dụng', 'card-outline')}
        {renderPaymentMethodOption('momo', 'Momo', 'wallet-outline')}
        {renderPaymentMethodOption('cod', 'Thanh toán khi nhận hàng', 'cash-outline')}
      </View>

      {selectedMethod === 'card' && (
        <View style={styles.cardDetailsContainer}>
          <Text style={styles.sectionTitle}>Thông tin thẻ</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Số thẻ"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="MM/YY"
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="CVV"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>
      )}

      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tạm tính</Text>
          <Text style={styles.summaryValue}>500,000 ₫</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
          <Text style={styles.summaryValue}>30,000 ₫</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>530,000 ₫</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payButtonText}>Thanh toán ngay</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  paymentMethodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 5,
  },
  selectedPaymentMethod: {
    borderColor: '#4A3780',
    backgroundColor: '#F8F9FF',
  },
  paymentMethodLabel: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  selectedPaymentMethodLabel: {
    color: '#4A3780',
  },
  cardDetailsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.47,
  },
  summaryContainer: {
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3780',
  },
  payButton: {
    backgroundColor: '#4A3780',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
