import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Campaign {
  _id: string;
  name: string;
  image?: string;
  books?: { cover_image?: string[]; thumbnail?: string }[];
}

interface EventCampaignGridProps {
  campaigns: Campaign[];
  onShowAll?: () => void;
  defaultImage?: ImageSourcePropType;
}

const DEFAULT_IMAGE = require('../assets/images/logo.png');
const ITEMS_PER_ROW = 5;
const MAX_DISPLAY = 9;

const getCampaignImage = (item: Campaign) => {
  if (item.image) return { uri: item.image };
  if (item.books && item.books.length > 0) {
    const book = item.books[0];
    if (book.cover_image && book.cover_image.length > 0) return { uri: book.cover_image[0] };
    if (book.thumbnail) return { uri: book.thumbnail };
  }
  return DEFAULT_IMAGE;
};

const EventCampaignGrid: React.FC<EventCampaignGridProps> = ({ campaigns, onShowAll, defaultImage }) => {
  // Lấy tối đa 9 campaign đầu tiên
  const displayCampaigns = campaigns.slice(0, MAX_DISPLAY);
  // Dòng 1: 5 item, dòng 2: 4 item + nút xem tất cả
  const row1 = displayCampaigns.slice(0, ITEMS_PER_ROW);
  const row2 = displayCampaigns.slice(ITEMS_PER_ROW, MAX_DISPLAY);
  // Nếu row2 < 4, vẫn show nút xem tất cả ở cuối dòng
  const row2WithButton = [
    ...row2,
    { _id: 'show-all', name: 'Xem tất cả', image: undefined } as Campaign,
  ];

  const renderItem = (item: Campaign, isShowAllBtn = false) => {
    if (isShowAllBtn) {
      return (
        <TouchableOpacity key="show-all" style={styles.item} onPress={onShowAll} activeOpacity={0.7}>
          <View style={[styles.imageWrap, { backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center' }]}> 
            <Text style={{ fontSize: 24, color: '#1976D2', fontWeight: 'bold' }}>+</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>Xem tất cả</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View key={item._id} style={styles.item}>
        <Image
          source={getCampaignImage(item)}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sự kiện nổi bật</Text>
      <View style={styles.row}>
        {row1.map(item => renderItem(item))}
      </View>
      <View style={styles.row}>
        {row2WithButton.map((item, idx) =>
          idx === 4 || item._id === 'show-all'
            ? renderItem(item, true)
            : renderItem(item)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#1976D2',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  item: {
    flex: 1,
    maxWidth: `${100 / ITEMS_PER_ROW}%`,
    alignItems: 'center',
    marginBottom: 8,
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#eee',
    marginBottom: 4,
    overflow: 'hidden',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#eee',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    textAlign: 'center',
    color: '#222',
    minHeight: 32,
  },
});

export default EventCampaignGrid; 