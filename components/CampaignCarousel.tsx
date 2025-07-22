import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Campaign } from '../types';
import CampaignCard from './CampaignCard';

type Props = {
  title: string;
  campaigns: Campaign[];
};

const CampaignCarousel = ({ title, campaigns }: Props) => {
  const router = useRouter();
  
  if (!campaigns || campaigns.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          onPress={() => {
            router.push('/allcampaigns');
          }}
        >
          <Feather name="arrow-right" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={campaigns}
        renderItem={({ item }) => <CampaignCard campaign={item} />}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={175}
        decelerationRate="fast"
        disableIntervalMomentum
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default memo(CampaignCarousel); 