import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS, PAYMENT_METHOD_NAMES, PaymentMethod } from '../services/paymentService';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const paymentMethods = Object.values(PAYMENT_METHODS);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn phương thức thanh toán</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.methodItem,
              selectedMethod === method && styles.selectedMethod
            ]}
            onPress={() => onSelectMethod(method)}
          >
            <View style={styles.methodContent}>
              <Text style={styles.methodIcon}>{PAYMENT_METHOD_ICONS[method]}</Text>
              <View style={styles.methodInfo}>
                <Text style={[
                  styles.methodName,
                  selectedMethod === method && styles.selectedMethodText
                ]}>
                  {PAYMENT_METHOD_NAMES[method]}
                </Text>
                {method === PAYMENT_METHODS.COD && (
                  <Text style={styles.methodDescription}>
                    Thanh toán khi nhận hàng
                  </Text>
                )}
                {method === PAYMENT_METHODS.MOMO && (
                  <Text style={styles.methodDescription}>
                    Thanh toán qua ví MoMo
                  </Text>
                )}
                {method === PAYMENT_METHODS.ZALOPAY && (
                  <Text style={styles.methodDescription}>
                    Thanh toán qua ZaloPay
                  </Text>
                )}
                {method === PAYMENT_METHODS.VNPAY && (
                  <Text style={styles.methodDescription}>
                    Thanh toán qua VNPay
                  </Text>
                )}
                {method === PAYMENT_METHODS.BANK_TRANSFER && (
                  <Text style={styles.methodDescription}>
                    Chuyển khoản ngân hàng
                  </Text>
                )}
                {method === PAYMENT_METHODS.CREDIT_CARD && (
                  <Text style={styles.methodDescription}>
                    Thanh toán bằng thẻ tín dụng
                  </Text>
                )}
              </View>
            </View>
            <View style={[
              styles.radioButton,
              selectedMethod === method && styles.selectedRadio
            ]}>
              {selectedMethod === method && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedMethod: {
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedMethodText: {
    color: '#007AFF',
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
});

export default PaymentMethodSelector; 