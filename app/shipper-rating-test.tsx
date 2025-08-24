import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShipperRatingDisplay from '../components/ShipperRatingDisplay';
import ShipperRatingList from '../components/ShipperRatingList';
import ShipperRatingModal from '../components/ShipperRatingModal';
import { useRatingModal } from '../hooks/useShipperRating';

const ShipperRatingTestPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { openModal, closeModal, isOpen, prompts, promptsLoading } = useRatingModal();

  // Sample data for testing
  const sampleShipperId = 'shipper123';
  const sampleOrder = {
    _id: 'order123',
    orderCode: 'ORD-123456',
    assigned_shipper_id: sampleShipperId,
    assigned_shipper_name: 'Nguyễn Văn A',
    assigned_shipper_phone: '0123456789'
  };

  const handleTestRating = () => {
    const shipperData = {
      _id: sampleShipperId,
      full_name: 'Nguyễn Văn A',
      phone_number: '0123456789'
    };
    
    openModal(sampleOrder, shipperData, null);
  };

  const handleRatingSubmit = () => {
    console.log('Rating submitted successfully');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipper Rating Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Rating Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Display Test</Text>
          <ShipperRatingDisplay
            shipperId={sampleShipperId}
            showDetails={true}
            compact={false}
          />
        </View>

        {/* Test Rating List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating List Test</Text>
          <ShipperRatingList
            shipperId={sampleShipperId}
            showUserInfo={true}
            showOrderInfo={true}
            isMyRatings={false}
          />
        </View>

        {/* Test My Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Ratings Test</Text>
          <ShipperRatingList
            isMyRatings={true}
            showUserInfo={false}
            showOrderInfo={true}
          />
        </View>

        {/* Test Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Rating Modal</Text>
          <TouchableOpacity style={styles.testButton} onPress={handleTestRating}>
            <Ionicons name="star" size={20} color="white" />
            <Text style={styles.testButtonText}>Test Rating Modal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <ShipperRatingModal
        isOpen={isOpen}
        onClose={closeModal}
        orderId={sampleOrder._id}
        shipperInfo={{
          _id: sampleShipperId,
          full_name: 'Nguyễn Văn A',
          phone_number: '0123456789'
        }}
        existingRating={null}
        prompts={prompts}
        promptsLoading={promptsLoading}
        onRatingSubmit={handleRatingSubmit}
      />
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
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ShipperRatingTestPage;
