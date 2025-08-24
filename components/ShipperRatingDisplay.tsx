import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useShipperRating } from '../hooks/useShipperRating';
import RatingStars from './RatingStars';

interface ShipperRatingDisplayProps {
  shipperId: string;
  showDetails?: boolean;
  compact?: boolean;
  onViewAllPress?: () => void;
}

const ShipperRatingDisplay: React.FC<ShipperRatingDisplayProps> = ({
  shipperId,
  showDetails = false,
  compact = false,
  onViewAllPress
}) => {
  const { t } = useTranslation();
  const { ratingData, loading, error } = useShipperRating(shipperId);

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingText}>{t('loadingRating')}</Text>
      </View>
    );
  }

  if (error || !ratingData) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Ionicons name="alert-circle-outline" size={24} color="#e74c3c" />
        <Text style={styles.errorText}>
          {error || t('noRatingData')}
        </Text>
      </View>
    );
  }

  const { averageRating, totalRatings, ratingCounts } = ratingData;

  const getRatingPercentage = (starCount: number) => {
    if (totalRatings === 0) return 0;
    return (ratingCounts[starCount as keyof typeof ratingCounts] / totalRatings) * 100;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#27ae60';
    if (rating >= 4.0) return '#f39c12';
    if (rating >= 3.0) return '#e67e22';
    return '#e74c3c';
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Main Rating Display */}
      <View style={styles.mainRating}>
        <View style={styles.ratingInfo}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <RatingStars
            rating={Math.round(averageRating)}
            readonly
            size={compact ? 16 : 20}
            color="#FFD700"
          />
          <Text style={styles.totalRatings}>
            {totalRatings} {t('ratings')}
          </Text>
        </View>
        
        {!compact && (
          <View style={styles.ratingColorIndicator}>
            <View 
              style={[
                styles.colorDot, 
                { backgroundColor: getRatingColor(averageRating) }
              ]} 
            />
          </View>
        )}
      </View>

      {/* Rating Distribution */}
      {showDetails && !compact && (
        <View style={styles.distributionContainer}>
          <Text style={styles.distributionTitle}>{t('ratingDistribution')}</Text>
          {[5, 4, 3, 2, 1].map((stars) => (
            <View key={stars} style={styles.ratingBar}>
              <View style={styles.starLabel}>
                <Text style={styles.starText}>{stars}</Text>
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
              <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${getRatingPercentage(stars)}%`,
                        backgroundColor: getRatingColor(stars)
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.barCount}>
                {ratingCounts[stars as keyof typeof ratingCounts]}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* View All Button */}
      {onViewAllPress && totalRatings > 0 && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>{t('viewAllRatings')}</Text>
          <Ionicons name="chevron-forward" size={16} color="#667eea" />
        </TouchableOpacity>
      )}

      {/* Compact View Additional Info */}
      {compact && totalRatings > 0 && (
        <View style={styles.compactInfo}>
          <Text style={styles.compactRatingText}>
            {averageRating.toFixed(1)} {t('outOf')} 5
          </Text>
          <Text style={styles.compactTotalText}>
            ({totalRatings} {t('reviews')})
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerCompact: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingInfo: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  totalRatings: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  ratingColorIndicator: {
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  distributionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
  },
  starText: {
    fontSize: 12,
    color: '#2c3e50',
    marginRight: 2,
  },
  barContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    fontSize: 12,
    color: '#7f8c8d',
    width: 30,
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginRight: 4,
  },
  compactInfo: {
    alignItems: 'flex-end',
  },
  compactRatingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  compactTotalText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ShipperRatingDisplay;
