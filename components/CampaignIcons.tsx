import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Campaign } from '../types';

type Props = {
  title: string;
  campaigns: Campaign[];
};

const CampaignIcons = ({ title, campaigns }: Props) => {
  const router = useRouter();
  
  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  const getCampaignIcon = (campaign: Campaign) => {
    // Dựa vào name và type của campaign để chọn icon phù hợp
    const name = campaign.name.toLowerCase();
    
    if (name.includes('flash') || name.includes('sale')) {
      return { name: 'flash', color: '#FF6B6B' };
    }
    if (name.includes('day') || name.includes('d.day')) {
      return { name: 'calendar', color: '#FF6B6B' };
    }
    if (name.includes('điểm danh') || name.includes('check')) {
      return { name: 'game-controller', color: '#FF6B6B' };
    }
    if (name.includes('mã giảm') || name.includes('discount')) {
      return { name: 'pricetag', color: '#4A90E2' };
    }
    if (name.includes('mới') || name.includes('new')) {
      return { name: 'star', color: '#FFA500' };
    }
    if (name.includes('sgk') || name.includes('sách giáo khoa')) {
      return { name: 'library', color: '#4A90E2' };
    }
    if (name.includes('sỉ') || name.includes('wholesale')) {
      return { name: 'cart', color: '#FF6B6B' };
    }
    if (name.includes('manga') || name.includes('anime')) {
      return { name: 'heart', color: '#8B4513' };
    }
    
    // Dựa vào type của campaign để chọn icon phù hợp
    switch (campaign.type) {
      case 'promotion':
        return { name: 'pricetag', color: '#FF6B6B' };
      case 'event':
        return { name: 'calendar', color: '#4ECDC4' };
      case 'collection':
        return { name: 'library', color: '#45B7D1' };
      case 'auto_status':
        return { name: 'flash', color: '#96CEB4' };
      default:
        return { name: 'star', color: '#95A5A6' };
    }
  };

  const getCampaignColor = (campaign: Campaign) => {
    // Dựa vào name và type của campaign để chọn màu phù hợp
    const name = campaign.name.toLowerCase();
    
    if (name.includes('flash') || name.includes('sale')) {
      return '#FF6B6B';
    }
    if (name.includes('day') || name.includes('d.day')) {
      return '#FF6B6B';
    }
    if (name.includes('điểm danh') || name.includes('check')) {
      return '#FF6B6B';
    }
    if (name.includes('mã giảm') || name.includes('discount')) {
      return '#4A90E2';
    }
    if (name.includes('mới') || name.includes('new')) {
      return '#FFA500';
    }
    if (name.includes('sgk') || name.includes('sách giáo khoa')) {
      return '#4A90E2';
    }
    if (name.includes('sỉ') || name.includes('wholesale')) {
      return '#FF6B6B';
    }
    if (name.includes('manga') || name.includes('anime')) {
      return '#8B4513';
    }
    
    // Dựa vào type của campaign để chọn màu phù hợp
    switch (campaign.type) {
      case 'promotion':
        return '#FF6B6B';
      case 'event':
        return '#4ECDC4';
      case 'collection':
        return '#45B7D1';
      case 'auto_status':
        return '#96CEB4';
      default:
        return '#95A5A6';
    }
  };

  const handleCampaignPress = (campaign: Campaign) => {
    router.push({
      pathname: '/campaign/[id]',
      params: { id: campaign._id, name: campaign.name }
    });
  };

  const renderCampaignIcon = ({ item: campaign }: { item: Campaign }) => {
    const icon = getCampaignIcon(campaign);
    const bgColor = getCampaignColor(campaign);
    
    return (
      <TouchableOpacity 
        style={[styles.iconContainer, { backgroundColor: bgColor }]}
        onPress={() => handleCampaignPress(campaign)}
      >
        <Ionicons name={icon.name as any} size={20} color="#fff" />
        <Text style={styles.iconText} numberOfLines={2}>
          {campaign.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          onPress={() => {
            router.push('/allcampaigns');
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#333" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={campaigns}
        renderItem={renderCampaignIcon}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.iconList}
        snapToInterval={80}
        decelerationRate="fast"
        disableIntervalMomentum
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  iconList: {
    paddingRight: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 10,
  },
});

export default memo(CampaignIcons); 