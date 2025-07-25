import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Campaign } from '../types';
import Header from './Header';
import SearchBar from './SearchBar';

interface HomeTopSectionProps {
  campaigns: Campaign[];
  campaignsLoading: boolean;
  onApplySimpleFilter?: (filter: { price: number; sort: 'az' | 'za' | null }) => void;
}

// Nhận props campaigns, campaignsLoading để truyền vào CampaignIcons
const HomeTopSection = ({ campaigns, campaignsLoading, onApplySimpleFilter }: HomeTopSectionProps) => {
  const { t, i18n } = useTranslation();
  const [, setLang] = React.useState(i18n.language);
  React.useEffect(() => { setLang(i18n.language); }, [i18n.language]);
  const [sliderIndex, setSliderIndex] = React.useState(0);
  const router = useRouter();

  // Lọc campaign
  const promotionCampaigns = (campaigns as any[]).filter(c => c.type === 'promotion' && c.image);
  const eventCampaigns = (campaigns as any[]).filter(c => c.type === 'event' && c.image);

  // Auto slide
  React.useEffect(() => {
    if (promotionCampaigns.length <= 1) return;
    const timer = setInterval(() => {
      setSliderIndex(idx => (idx + 1) % promotionCampaigns.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promotionCampaigns.length]);

  // Show all event (nút cuối)
  const showEvents = eventCampaigns.slice(0, 8);
  const showAllBtn = eventCampaigns.length > 9;

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.section}><SearchBar onApplySimpleFilter={onApplySimpleFilter} /></View>
      {/* Slider promotion */}
      {promotionCampaigns.length > 0 && (
        <View style={{ width: '100%', aspectRatio: 2.5, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <Image
            source={{ uri: promotionCampaigns[sliderIndex].image }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
        </View>
      )}
      {/* Event icons */}
      {eventCampaigns.length > 0 && (
        <FlatList
          data={showEvents}
          keyExtractor={item => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8, marginTop: 4 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ alignItems: 'center', marginRight: 18, width: 60 }}
              onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: item._id } })}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 4 }}
                contentFit="cover"
              />
              <Text numberOfLines={2} style={{ fontSize: 12, textAlign: 'center', color: '#333' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={showAllBtn ? (
            <TouchableOpacity style={{ alignItems: 'center', width: 60 }} onPress={() => router.push('/allcampaigns')}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="ellipsis-horizontal" size={28} color="#888" />
              </View>
              <Text numberOfLines={2} style={{ fontSize: 12, textAlign: 'center', color: '#333' }}>{t('see all')}</Text>
            </TouchableOpacity>
          ) : null}
        />
      )}
      {/* Đã xóa CampaignIcons cũ */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 16,
  },
});

export default HomeTopSection; 