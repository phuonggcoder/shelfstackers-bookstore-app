import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAvatar } from '../../context/AvatarContext';
import EmailUpdateModal from '../../components/EmailUpdateModal';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ children }: { children: React.ReactNode }) => {
  const scaleAnim = useRef(new Animated.Value(0.1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Reset lại mỗi lần tab được focus
      scaleAnim.setValue(0.1);
      contentOpacity.setValue(0);
      setShowContent(false);
      Animated.timing(scaleAnim, {
        toValue: 16, // scale lớn hơn để che phủ toàn bộ màn hình
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        setShowContent(true);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, [])
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={{
          position: 'absolute',
          left: width / 2 - 40,
          top: height / 2 - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#1890FF',
          transform: [{ scale: scaleAnim }],
          zIndex: 1,
        }}
      />
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: contentOpacity,
          zIndex: 2,
        }}
        pointerEvents={showContent ? 'auto' : 'none'}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const WelcomeScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // compute a friendly display name when available (use fields declared in User type)
  let displayName = '';
  if (user) {
    const full = (user.full_name || user.username || '').toString().trim();
    if (full) {
      const parts = full.split(' ').filter(Boolean);
      displayName = parts.length > 0 ? parts[0] : full;
    }
  }

  return (
    <AnimatedSplash>
      <View style={{ alignItems: 'center', width: '100%' }}>
        <Ionicons name="person-circle-outline" size={100} color="#fff" style={{ marginBottom: 24 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' }}>
          {t('welcomeMessage')}{displayName ? `, ${displayName}` : ''}
        </Text>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 30 }}>
          {t('loginToManage')}
        </Text>
        <Link href="/login" asChild>
          <TouchableOpacity style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 40, marginBottom: 15, width: '80%' }}>
            <Text style={{ color: '#1890FF', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{t('login')}</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/register" asChild>
          <TouchableOpacity style={{ backgroundColor: 'transparent', borderRadius: 10, borderWidth: 2, borderColor: '#fff', paddingVertical: 15, paddingHorizontal: 40, width: '80%' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{t('signUp')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AnimatedSplash>
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
  const navigation = useNavigation();
  const router = useRouter();
  const { avatarUri } = useAvatar();
  const [localDetail, setLocalDetail] = React.useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [showEmailUpdate, setShowEmailUpdate] = useState(false);

  useEffect(() => {
    const loadName = async () => {
      const lastName = await AsyncStorage.getItem('user_lastName');
      const firstName = await AsyncStorage.getItem('user_firstName');
      if (lastName || firstName) {
        setDisplayName(`${lastName || ''} ${firstName || ''}`.trim());
      } else {
        setDisplayName(user?.username || '');
      }
    };
    loadName();
  }, [user]);

  React.useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('userDetailLocal');
      if (saved) {
        setLocalDetail(JSON.parse(saved));
      } else {
        setLocalDetail(null);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigation.navigate('index' as never); // Tab Home
  };

  const handleEmailUpdateSuccess = () => {
    // Refresh user data if needed
    console.log('Email updated successfully');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        {/* Avatar và tên lấy từ API (context user) */}
        <Image
          source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=' + user?.username }}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.name}>{displayName}</Text>
        {user?.roles && (
          <Text style={styles.role}>{Array.isArray(user.roles) ? user.roles.join(', ') : user.roles}</Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalInfo')}</Text>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => navigation.navigate('user-detail' as never)}>
            <Ionicons name="person-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('profile')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => setShowEmailUpdate(true)}>
            <Ionicons name="mail-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>Cập nhật email</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={()=>navigation.navigate('vouchers' as never)}>
            <Ionicons name="ticket-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('coupon')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => navigation.navigate('favourite' as never)}>
            <Ionicons name="heart-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('favorite')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => navigation.navigate('order-history' as never)}>
            <Ionicons name="receipt-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('orderHistory')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => router.push('/my-reviews' as any)}>
            <Ionicons name="star-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('myReviews.myReviews')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => router.push('/my-ratings' as any)}>
            <Ionicons name="car-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('myShipperRatings')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          {/* <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => navigation.navigate('payment' as never)}>
            <Ionicons name="card-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('paymentMethod')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity> */}
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => navigation.navigate('address-list' as never)}>
            <Ionicons name="location-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('deliveryAddress')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security')}</Text>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}}  onPress={() => navigation.navigate('ChangePassword' as never)}>
            <Ionicons name="key-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('changePassword')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => {}}>
            <Ionicons name="help-circle-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
            <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('forgotPassword')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
          </TouchableOpacity>
                     {/* <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => {}}>
             <Ionicons name="shield-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
             <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('security')}</Text>
             <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
           </TouchableOpacity> */}
         </View>

         <View style={styles.section}>
           <Text style={styles.sectionTitle}>{t('generalSettings')}</Text>
           <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:16}} onPress={() => navigation.navigate('Language' as never)}>
             <Ionicons name="language-outline" size={22} color="#3255FB" style={{marginRight:12}}/>
             <Text style={{fontSize:16,fontWeight:'600',color:'#222'}}>{t('language')}</Text>
             <Ionicons name="chevron-forward" size={20} color="#888" style={{marginLeft:'auto'}}/>
           </TouchableOpacity>
         </View>

         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
           <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
           <Text style={styles.logoutText}>{t('logout')}</Text>
         </TouchableOpacity>
        
                 {/* Spacer to ensure button is not hidden */}
         <View style={{ height: 20 }} />
       </View>

       {/* Email Update Modal */}
       <EmailUpdateModal
         visible={showEmailUpdate}
         onClose={() => setShowEmailUpdate(false)}
         onSuccess={handleEmailUpdateSuccess}
         currentEmail={user?.email || ''}
       />
     </ScrollView>
   );
 };

export default function ProfileScreen() {
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
  username: {
    fontSize: 14,
    color: '#E8E8FF',
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
