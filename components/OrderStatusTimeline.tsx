import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

interface OrderStatusTimelineProps {
  currentStatus: string;
  orderDate?: string;
  deliveredDate?: string;
  cancelledDate?: string;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  orderDate,
  deliveredDate,
  cancelledDate
}) => {
  const { t } = useTranslation();

  const getStatusConfig = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending':
        return {
          icon: 'time-outline',
          color: '#f39c12',
          label: t('pending'),
          description: t('orderPendingDescription')
        };
      case 'awaitingpickup':
      case 'awaiting_pickup':
        return {
          icon: 'bag-outline',
          color: '#1976D2',
          label: t('awaitingPickup'),
          description: t('orderAwaitingPickupDescription')
        };
      case 'outfordelivery':
      case 'out_for_delivery':
        return {
          icon: 'bicycle-outline',
          color: '#FF9800',
          label: t('outForDelivery'),
          description: t('orderOutForDeliveryDescription')
        };
      case 'delivered':
        return {
          icon: 'checkmark-circle-outline',
          color: '#4CAF50',
          label: t('delivered'),
          description: t('orderDeliveredDescription')
        };
      case 'returned':
        return {
          icon: 'arrow-undo-outline',
          color: '#E91E63',
          label: t('returned'),
          description: t('orderReturnedDescription')
        };
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_admin':
        return {
          icon: 'close-circle-outline',
          color: '#e74c3c',
          label: t('cancelled'),
          description: t('orderCancelledDescription')
        };
      case 'refunded':
        return {
          icon: 'card-outline',
          color: '#9C27B0',
          label: t('refunded'),
          description: t('orderRefundedDescription')
        };
      default:
        return {
          icon: 'help-circle-outline',
          color: '#95a5a6',
          label: status || t('unknown'),
          description: t('orderUnknownDescription')
        };
    }
  };

  const getStatusOrder = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending': return 1;
      case 'awaitingpickup':
      case 'awaiting_pickup': return 2;
      case 'outfordelivery':
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      case 'returned': return 5;
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_admin': return 0; // Có thể hủy ở bất kỳ bước nào
      case 'refunded': return 6;
      default: return -1;
    }
  };

  const currentStatusOrder = getStatusOrder(currentStatus);
  const currentConfig = getStatusConfig(currentStatus);

  const timelineSteps = [
    {
      status: 'pending',
      config: getStatusConfig('pending'),
      order: 1,
      date: orderDate
    },
    {
      status: 'awaitingpickup',
      config: getStatusConfig('awaitingpickup'),
      order: 2
    },
    {
      status: 'outfordelivery',
      config: getStatusConfig('outfordelivery'),
      order: 3
    },
    {
      status: 'delivered',
      config: getStatusConfig('delivered'),
      order: 4,
      date: deliveredDate
    }
  ];

  const isStepCompleted = (stepOrder: number) => {
    return currentStatusOrder >= stepOrder;
  };

  const isStepActive = (stepOrder: number) => {
    return currentStatusOrder === stepOrder;
  };

  const isStepCancelled = () => {
    return currentStatus.toLowerCase().includes('cancelled');
  };

  const isStepRefunded = () => {
    return currentStatus.toLowerCase() === 'refunded';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('orderStatus')}</Text>
      
      {/* Current Status Highlight */}
      <View style={styles.currentStatusContainer}>
        <View style={[styles.currentStatusIcon, { backgroundColor: currentConfig.color }]}>
          <Ionicons name={currentConfig.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.currentStatusInfo}>
          <Text style={styles.currentStatusLabel}>{currentConfig.label}</Text>
          <Text style={styles.currentStatusDescription}>{currentConfig.description}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {timelineSteps.map((step, index) => {
          const isCompleted = isStepCompleted(step.order);
          const isActive = isStepActive(step.order);
          const isLast = index === timelineSteps.length - 1;
          
          return (
            <View key={step.status} style={styles.timelineStep}>
              <View style={styles.timelineStepContent}>
                <View style={[
                  styles.timelineIcon,
                  isCompleted && { backgroundColor: step.config.color },
                  isActive && { backgroundColor: step.config.color },
                  !isCompleted && !isActive && { backgroundColor: '#e9ecef' }
                ]}>
                  <Ionicons 
                    name={isCompleted ? 'checkmark' : step.config.icon as any} 
                    size={16} 
                    color={isCompleted || isActive ? '#fff' : '#95a5a6'} 
                  />
                </View>
                
                <View style={styles.timelineStepInfo}>
                  <Text style={[
                    styles.timelineStepLabel,
                    isCompleted && { color: step.config.color },
                    isActive && { color: step.config.color, fontWeight: 'bold' }
                  ]}>
                    {step.config.label}
                  </Text>
                  <Text style={styles.timelineStepDescription}>
                    {step.config.description}
                  </Text>
                  {step.date && (
                    <Text style={styles.timelineStepDate}>
                      {new Date(step.date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
              
              {!isLast && (
                <View style={[
                  styles.timelineLine,
                  isCompleted && { backgroundColor: step.config.color }
                ]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Cancelled or Refunded Status */}
      {(isStepCancelled() || isStepRefunded()) && (
        <View style={styles.specialStatusContainer}>
          <View style={[styles.specialStatusIcon, { backgroundColor: currentConfig.color }]}>
            <Ionicons name={currentConfig.icon as any} size={20} color="#fff" />
          </View>
          <View style={styles.specialStatusInfo}>
            <Text style={[styles.specialStatusLabel, { color: currentConfig.color }]}>
              {currentConfig.label}
            </Text>
            <Text style={styles.specialStatusDescription}>
              {currentConfig.description}
            </Text>
            {cancelledDate && (
              <Text style={styles.specialStatusDate}>
                {new Date(cancelledDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  currentStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentStatusInfo: {
    flex: 1,
  },
  currentStatusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  currentStatusDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineStep: {
    marginBottom: 16,
  },
  timelineStepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineStepInfo: {
    flex: 1,
  },
  timelineStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  timelineStepDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  timelineStepDate: {
    fontSize: 11,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e9ecef',
    marginLeft: 15,
    marginTop: 4,
  },
  specialStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  specialStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  specialStatusInfo: {
    flex: 1,
  },
  specialStatusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  specialStatusDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  specialStatusDate: {
    fontSize: 11,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default OrderStatusTimeline;
