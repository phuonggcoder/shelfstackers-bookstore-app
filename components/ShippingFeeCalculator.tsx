import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ShippingService, { ShippingAddress, ShippingFeeRequest, ShippingFeeResponse } from '../services/shippingService';
import { formatVND } from '../utils/format';

interface ShippingFeeCalculatorProps {
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  weight: number;
  onFeeCalculated?: (fee: number, carrier: string) => void;
  onError?: (error: string) => void;
}

const ShippingFeeCalculator: React.FC<ShippingFeeCalculatorProps> = ({
  fromAddress,
  toAddress,
  weight,
  onFeeCalculated,
  onError
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<ShippingFeeResponse[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    calculateFees();
  }, [fromAddress, toAddress, weight]);

  const calculateFees = async () => {
    if (!fromAddress || !toAddress || weight <= 0) {
      setError('Thông tin địa chỉ hoặc trọng lượng không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request: ShippingFeeRequest = {
        fromAddress,
        toAddress,
        weight,
        carrier: undefined // Get all carriers
      };

      const result = await ShippingService.calculateShippingFeeAPI(request);
      
      if (result.success && result.fees.length > 0) {
        setFees(result.fees);
        setSelectedCarrier(result.fees[0].carrier);
        onFeeCalculated?.(result.fees[0].fee, result.fees[0].carrier);
      } else {
        setError(result.error || 'Không thể tính phí vận chuyển');
        onError?.(result.error || 'Không thể tính phí vận chuyển');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Lỗi khi tính phí vận chuyển';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCarrierSelect = (carrier: string, fee: number) => {
    setSelectedCarrier(carrier);
    onFeeCalculated?.(fee, carrier);
  };

  const getCarrierIcon = (carrier: string) => {
    switch (carrier) {
      case 'GHN':
        return 'car-outline';
      case 'GHTK':
        return 'bicycle-outline';
      case 'VNPOST':
        return 'mail-outline';
      default:
        return 'location-outline';
    }
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'GHN':
        return '#4CAF50';
      case 'GHTK':
        return '#2196F3';
      case 'VNPOST':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#667eea" />
          <Text style={styles.loadingText}>Đang tính phí vận chuyển...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={calculateFees}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phương thức vận chuyển</Text>
      
      {fees.map((fee, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.carrierOption,
            selectedCarrier === fee.carrier && styles.selectedCarrier
          ]}
          onPress={() => handleCarrierSelect(fee.carrier, fee.fee)}
        >
          <View style={styles.carrierInfo}>
            <View style={[styles.carrierIcon, { backgroundColor: getCarrierColor(fee.carrier) }]}>
              <Ionicons name={getCarrierIcon(fee.carrier)} size={20} color="white" />
            </View>
            <View style={styles.carrierDetails}>
              <Text style={styles.carrierName}>{fee.service}</Text>
              <Text style={styles.carrierNote}>{fee.note}</Text>
              <Text style={styles.estimatedTime}>
                Dự kiến: {fee.estimatedDays} ngày
              </Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatVND(fee.fee)}</Text>
            {selectedCarrier === fee.carrier && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  carrierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCarrier: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  carrierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  carrierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carrierDetails: {
    flex: 1,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  carrierNote: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#667eea',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
});

export default ShippingFeeCalculator;
