import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'promotion' | 'system';
};

// Mock data - replace with real data later
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Đơn hàng đã xác nhận',
    message: 'Đơn hàng #12345 của bạn đã được xác nhận và đang được xử lý',
    time: '2 giờ trước',
    read: false,
    type: 'order',
  },
  {
    id: '2',
    title: 'Ưu đãi đặc biệt',
    message: 'Giảm 20% cho tất cả sách tiểu thuyết cuối tuần này!',
    time: '1 ngày trước',
    read: true,
    type: 'promotion',
  },
];

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return 'receipt-outline';
      case 'promotion':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon(notification.type)} size={24} color="#4A3780" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('notifications')}</Text>
      {mockNotifications.length > 0 ? (
        <FlatList
          data={mockNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>{t('noNotificationsYet')}</Text>
        </View>
      )}
    </View>
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
  listContent: {
    gap: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
    borderColor: '#E8E8FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationMessage: {
    color: '#666',
    marginBottom: 5,
  },
  notificationTime: {
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
});

export default NotificationsScreen;
