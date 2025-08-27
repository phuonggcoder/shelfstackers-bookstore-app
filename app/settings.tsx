import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import EmailChangeSettings from '../components/EmailChangeSettings';
import VerificationBanner from '../components/VerificationBanner';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { showAlert } = useUnifiedModal();
  const [showEmailChange, setShowEmailChange] = useState(false);

  const handleSignOut = () => {
    showAlert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      'Hủy',
      'warning',
      async () => {
        await signOut();
        router.replace('/(auth)/login');
      }
    );
  };

  const handleEmailChangeSuccess = (newEmail: string) => {
    showAlert(
      'Thành công',
      `Email đã được thay đổi thành: ${newEmail}`,
      'OK',
      'success'
    );
  };

  const settingsItems = [
    {
      id: 'profile',
      title: 'Thông tin cá nhân',
      icon: 'person-outline',
      onPress: () => router.push('/user-detail'),
    },
    {
      id: 'email',
      title: 'Thay đổi email',
      icon: 'mail-outline',
      onPress: () => setShowEmailChange(true),
    },
    {
      id: 'password',
      title: 'Đổi mật khẩu',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/ChangePassword'),
    },
    {
      id: 'notifications',
      title: 'Thông báo',
      icon: 'notifications-outline',
      onPress: () => router.push('/notifications'),
    },
    {
      id: 'language',
      title: 'Ngôn ngữ',
      icon: 'language-outline',
      onPress: () => router.push('/Language'),
    },
    {
      id: 'vouchers',
      title: 'Voucher của tôi',
      icon: 'ticket-outline',
      onPress: () => router.push('/my-vouchers' as any),
    },
    {
      id: 'about',
      title: 'Về ứng dụng',
      icon: 'information-circle-outline',
      onPress: () => {
        showAlert(
          'Về ứng dụng',
          'Shelf Stacker - Ứng dụng mua sắm sách trực tuyến\nPhiên bản: 1.0.0',
          'OK',
          'info'
        );
      },
    },
    {
      id: 'logout',
      title: 'Đăng xuất',
      icon: 'log-out-outline',
      onPress: handleSignOut,
      color: '#e74c3c',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Verification Banner */}
        <VerificationBanner />
        
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || user?.username || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user && !user.is_verified && (
              <View style={styles.verificationStatus}>
                <Ionicons name="warning" size={16} color="#ff6b35" />
                <Text style={styles.verificationText}>Chưa xác thực email</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.settingsList}>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.color || '#333'}
                />
                <Text style={[styles.settingTitle, item.color && { color: item.color }]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showEmailChange}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailChange(false)}
      >
        <EmailChangeSettings
          currentEmail={user?.email || ''}
          onEmailChangeSuccess={handleEmailChangeSuccess}
          onClose={() => setShowEmailChange(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingsList: {
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  verificationText: {
    fontSize: 12,
    color: '#ff6b35',
    marginLeft: 6,
    fontWeight: '500',
  },
});
