import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useMyRatings, useShipperRatingsList } from '../hooks/useShipperRating';
import { ShipperRating } from '../services/shipperRatingService';
import RatingStars from './RatingStars';

interface ShipperRatingListProps {
  shipperId?: string;
  showUserInfo?: boolean;
  showOrderInfo?: boolean;
  isMyRatings?: boolean;
  onRatingPress?: (rating: ShipperRating) => void;
  onLoadMore?: () => void;
}

const ShipperRatingList: React.FC<ShipperRatingListProps> = ({
  shipperId,
  showUserInfo = true,
  showOrderInfo = true,
  isMyRatings = false,
  onRatingPress,
  onLoadMore
}) => {
  const { t } = useTranslation();
  
  const {
    ratings: shipperRatings,
    loading: shipperLoading,
    error: shipperError,
    hasMore: shipperHasMore,
    loadMore: shipperLoadMore,
    refresh: shipperRefresh
  } = useShipperRatingsList(shipperId || '', 1, 10);

  const {
    ratings: myRatings,
    loading: myLoading,
    error: myError,
    hasMore: myHasMore,
    loadMore: myLoadMore,
    refresh: myRefresh
  } = useMyRatings(1, 10);

  const ratings = isMyRatings ? myRatings : shipperRatings;
  const loading = isMyRatings ? myLoading : shipperLoading;
  const error = isMyRatings ? myError : shipperError;
  const hasMore = isMyRatings ? myHasMore : shipperHasMore;
  const loadMore = isMyRatings ? myLoadMore : shipperLoadMore;
  const refresh = isMyRatings ? myRefresh : shipperRefresh;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return t('yesterday');
      } else if (diffDays < 7) {
        return t('daysAgo', { count: diffDays });
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return t('weeksAgo', { count: weeks });
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return t('monthsAgo', { count: months });
      } else {
        const years = Math.floor(diffDays / 365);
        return t('yearsAgo', { count: years });
      }
    } catch {
      return t('unknownDate');
    }
  };

  const getShipperName = (rating: ShipperRating) => {
    if (typeof rating.shipper_id === 'string') {
      return t('shipper');
    }
    return rating.shipper?.full_name || rating.shipper_id?.full_name || t('shipper');
  };

  const getUserName = (rating: ShipperRating) => {
    if (rating.is_anonymous) {
      return t('anonymousUser');
    }
    if (typeof rating.user_id === 'string') {
      return t('user');
    }
    return rating.user?.name || rating.user_id?.name || t('user');
  };

  const getOrderCode = (rating: ShipperRating) => {
    if (typeof rating.order_id === 'string') {
      return rating.order_id;
    }
    return rating.order?.order_code || rating.order_id?.order_code || t('order');
  };

  const renderRatingItem = ({ item: rating }: { item: ShipperRating }) => (
    <TouchableOpacity
      style={styles.ratingItem}
      onPress={() => onRatingPress?.(rating)}
      disabled={!onRatingPress}
    >
      {/* Header */}
      <View style={styles.ratingHeader}>
        <View style={styles.userInfo}>
          {showUserInfo && (
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color="#667eea" />
            </View>
          )}
          <View style={styles.userDetails}>
            {showUserInfo && (
              <Text style={styles.userName}>{getUserName(rating)}</Text>
            )}
            <View style={styles.ratingMeta}>
              <RatingStars
                rating={rating.rating}
                readonly
                size={16}
                color="#FFD700"
              />
              <Text style={styles.ratingDate}>
                {formatDate(rating.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        
        {rating.is_edited && (
          <View style={styles.editedBadge}>
            <Text style={styles.editedText}>{t('edited')}</Text>
          </View>
        )}
      </View>

      {/* Order Info */}
      {showOrderInfo && (
        <View style={styles.orderInfo}>
          <Ionicons name="receipt-outline" size={14} color="#7f8c8d" />
          <Text style={styles.orderCode}>{getOrderCode(rating)}</Text>
        </View>
      )}

      {/* Selected Prompts */}
      {rating.selected_prompts && rating.selected_prompts.length > 0 && (
        <View style={styles.promptsContainer}>
          {rating.selected_prompts.map((promptId, index) => (
            <View key={index} style={styles.promptChip}>
              <Text style={styles.promptText}>{promptId}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Comment */}
      {rating.comment && (
        <Text style={styles.comment}>{rating.comment}</Text>
      )}

      {/* Anonymous Indicator */}
      {rating.is_anonymous && (
        <View style={styles.anonymousIndicator}>
          <Ionicons name="eye-off" size={12} color="#7f8c8d" />
          <Text style={styles.anonymousText}>{t('anonymousRating')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('noMoreRatings')}</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={64} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>
          {isMyRatings ? t('noMyRatings') : t('noShipperRatings')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isMyRatings ? t('noMyRatingsDescription') : t('noShipperRatingsDescription')}
        </Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
      onLoadMore?.();
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorTitle}>{t('errorLoadingRatings')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={ratings}
      renderItem={renderRatingItem}
      keyExtractor={(item) => item._id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshing={loading}
      onRefresh={refresh}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  ratingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  ratingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  editedBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  editedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  orderCode: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  promptChip: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promptText: {
    fontSize: 11,
    color: '#2c3e50',
  },
  comment: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    marginBottom: 8,
  },
  anonymousIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anonymousText: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default ShipperRatingList;
