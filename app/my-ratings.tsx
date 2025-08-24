import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShipperRatingList from '../components/ShipperRatingList';
import { useMyRatings } from '../hooks/useShipperRating';

const MyRatingsPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { ratings, loading, error, total } = useMyRatings(1, 10);

  const handleRatingPress = (rating: any) => {
    // Navigate to order detail if needed
    if (rating.order_id) {
      const orderId = typeof rating.order_id === 'string' 
        ? rating.order_id 
        : rating.order_id._id;
      router.push({
        pathname: '/order-detail',
        params: { orderId }
      });
    }
  };

  if (loading && ratings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('myShipperRatings')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loadingRatings')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myShipperRatings')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.summaryTitle}>{t('ratingSummary')}</Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{total}</Text>
              <Text style={styles.statLabel}>{t('totalRatings')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {ratings.length > 0 
                  ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                  : '0.0'
                }
              </Text>
              <Text style={styles.statLabel}>{t('averageRating')}</Text>
            </View>
          </View>
        </View>

        {/* Ratings List */}
        <View style={styles.ratingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('myRatings')}</Text>
            {ratings.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                {t('showingRatings', { count: ratings.length, total })}
              </Text>
            )}
          </View>
          
          <ShipperRatingList
            isMyRatings={true}
            showUserInfo={false}
            showOrderInfo={true}
            onRatingPress={handleRatingPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
  },
  summarySection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  ratingsSection: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

export default MyRatingsPage;
