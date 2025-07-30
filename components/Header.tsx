import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartIconWithBadge from './CartIconWithBadge';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showIcons?: boolean;
}

const Header = ({ title, showBackButton = false, showIcons = true }: HeaderProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const fullName = user?.full_name;
  const isLoggedIn = !!user;
  const displayName = (isLoggedIn && fullName) ? fullName : t('you');
  const { cartCount, cartJustAdded } = useCart();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <View>
          {title ? (
            <Text style={styles.headerTitle}>{title}</Text>
          ) : (
            <>
              <Text style={styles.greeting}>
                {t('welcomeMessage', { name: displayName })}
              </Text>
              <Text style={styles.title}>{t('whatDoYouWantToReadToday')}</Text>
            </>
          )}
        </View>

      </View>
      {showIcons && (
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/cart')}
          >
            <CartIconWithBadge count={cartCount} animated={cartJustAdded} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  greeting: {
    fontSize: 16,
    color: '#888',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
});

export default Header;