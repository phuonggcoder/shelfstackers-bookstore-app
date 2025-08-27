import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { Campaign } from '../types';

interface Props {
  campaign: Campaign;
}

const CampaignCard = ({ campaign }: Props) => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handlePress = () => {
    router.push({
      pathname: '/campaign/[id]',
      params: { id: campaign._id, name: campaign.name }
    });
  };

  const getCampaignImage = () => {
    // Ưu tiên ảnh cover của campaign nếu có
    if (campaign.image && Array.isArray(campaign.image) && campaign.image[0]) {
      return campaign.image[0];
    }
    // Use first book's image as campaign image, or default
    if (campaign.books && campaign.books.length > 0) {
      const firstBook = campaign.books[0];
      if (firstBook.thumbnail) return firstBook.thumbnail;
      if (firstBook.cover_image && firstBook.cover_image.length > 0) {
        return firstBook.cover_image[0];
      }
    }
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return '#4A90E2';
      case 'auto_status': return '#4ECDC4';
      case 'collection': return '#45B7D1';
      case 'event': return '#96CEB4';
      default: return '#95A5A6';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'promotion': return 'Khuyến mãi';
      case 'auto_status': return 'Tự động';
      case 'collection': return 'Bộ sưu tập';
      case 'event': return 'Sự kiện';
      default: return type;
    }
  };

  const tagsStyles = {
    p: { marginBottom: 4, lineHeight: 16, color: '#666', fontSize: 12 },
    br: { height: 4 },
    h1: { fontSize: 14, fontWeight: 'bold' as const, marginBottom: 6 },
    h2: { fontSize: 13, fontWeight: 'bold' as const, marginBottom: 4 },
    ul: { marginBottom: 4, paddingLeft: 12 },
    li: { marginBottom: 2 },
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Image
        source={{ uri: getCampaignImage() }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.overlay}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(campaign.type) }]}>
          <Text style={styles.typeText}>{getTypeText(campaign.type)}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{campaign.name}</Text>
        {campaign.description && (
          <View style={styles.descriptionContainer}>
            {campaign.description.includes('<') ? (
              <RenderHTML
                contentWidth={width * 0.4 - 24}
                source={{ html: campaign.description }}
                tagsStyles={tagsStyles}
              />
            ) : (
              <Text style={styles.description} numberOfLines={2}>
                {campaign.description}
              </Text>
            )}
          </View>
        )}
        <Text style={styles.bookCount}>{campaign.books?.length || 0} sách</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  bookCount: {
    fontSize: 12,
    color: '#5E5CE6',
    fontWeight: '600',
  },
});

export default CampaignCard; 
