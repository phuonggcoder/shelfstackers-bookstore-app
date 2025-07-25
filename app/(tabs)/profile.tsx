import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';


const WelcomeScreen = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.welcomeContainer}>
      <Ionicons name="person-circle-outline" size={100} color="#4A3780" />
      <Text style={styles.welcomeTitle}>{t('profile welcome title')}</Text>
      <Text style={styles.welcomeText}>
        {t('profile welcome text')}
      </Text>
      <Link href="/login" asChild>
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInButtonText}>{t('profile sign in')}</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/register" asChild>
        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>{t('profile register')}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const SettingItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon as any} size={24} color="#4A3780" />
    </View>
    <Text style={styles.settingLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={24} color="#666" />
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.name}>{user?.full_name || t('user name')}</Text>
        <Text style={styles.role}>{t(user?.roles?.[0] || 'role author')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personal info')}</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { }}>
            <Ionicons name="person-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>
              {t('profile info')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => router.push('/vouchers')}>
            <Ionicons name="ticket-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('voucher')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => router.push('/favourite')}>
            <Ionicons name="heart-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('favorite books')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => router.push('/order-history')}>
            <Ionicons name="receipt-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('order history')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => router.push('/payment')}>
            <Ionicons name="card-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('payment method')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => router.push('/address-list')}>
            <Ionicons name="location-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('shipping address')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('security')}</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { }}>
            <Ionicons name="key-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('change password')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { }}>
            <Ionicons name="help-circle-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('forgot password')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { }}>
            <Ionicons name="shield-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('security')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common_settings')}</Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            onPress={() => router.push('/Language')}
          >
            <Ionicons name="language-outline" size={22} color="#3255FB" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('language')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Spacer to ensure button is not hidden */}
        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
};

export default function ProfileTab() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A3780" />
      </View>
    );
  }

  return user ? <SettingsScreen /> : <WelcomeScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: '#4A3780',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4A3780',
    width: '100%',
  },
  registerButtonText: {
    color: '#4A3780',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A3780',
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    color: '#E8E8FF',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ff3742',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});