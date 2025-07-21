import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Campaign } from '../types';
import CampaignIcons from './CampaignIcons';
import CategoryFilters from './CategoryFilters';
import Header from './Header';
import SearchBar from './SearchBar';

interface HomeTopSectionProps {
  campaigns: Campaign[];
  campaignsLoading: boolean;
  onApplySimpleFilter?: (filter: { price: number; sort: 'az' | 'za' | null }) => void;
}

// Nhận props campaigns, campaignsLoading để truyền vào CampaignIcons
const HomeTopSection = ({ campaigns, campaignsLoading, onApplySimpleFilter }: HomeTopSectionProps) => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.section}><SearchBar onApplySimpleFilter={onApplySimpleFilter} /></View>
      <View style={styles.section}><CategoryFilters /></View>
      {/* Campaigns Section */}
      {!campaignsLoading && campaigns && campaigns.length > 0 && (
        <View style={styles.section}>
          <CampaignIcons 
            title="Danh Mục" 
            campaigns={campaigns} 
          />
        </View>
      )}
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