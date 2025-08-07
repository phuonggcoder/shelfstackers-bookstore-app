import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewCard from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import ReviewService, { Review } from '../services/reviewService';
import { getProductId } from '../utils/reviewUtils';

const MyReviewsScreen = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const router = useRouter();
  const { showErrorToast, showSuccessToast, showDeleteDialog } = useUnifiedModal();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
      }
      
      console.log('MyReviewsScreen - loadReviews - Token from AuthContext:', token ? `${token.substring(0, 20)}...` : 'No token');
      console.log('MyReviewsScreen - loadReviews - User:', user);
      
      // Test với mock data trước để xem UI có hoạt động không
      if (!token) {
        console.log('MyReviewsScreen - No token, showing empty state');
        setReviews([]);
        setHasMore(false);
        setPage(pageNum);
        return;
      }

      // Gọi API thực - nếu backend chưa implement sẽ trả về empty response
      const response = await ReviewService.getUserReviews(pageNum, 10, token || undefined);
      
      if (refresh || pageNum === 1) {
        setReviews(response.reviews);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
      }
      
      setHasMore(response.reviews.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading reviews:', error);
      showErrorToast(t('error'), t('myReviews.cannotLoadReviews'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadReviews(page + 1);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    try {
      await ReviewService.voteHelpful(reviewId, token || undefined);
      // Update the review in the list
      setReviews(prev => 
        prev.map(review => 
          review._id === reviewId 
            ? { ...review, helpful_votes: review.helpful_votes + 1 }
            : review
        )
      );
    } catch (error) {
      console.error('Error voting helpful:', error);
    }
  };

  const handleEditReview = (review: Review) => {
    // Navigate to product reviews screen with edit mode
    const productId = getProductId(review);
    
    router.push({
      pathname: '/product-reviews',
      params: { 
        productId,
        editMode: 'true'
      }
    });
  };

  const handleDeleteReview = async (reviewId: string) => {
    showDeleteDialog(
      async () => {
        try {
          await ReviewService.deleteReview(reviewId, token || undefined);
          showSuccessToast(t('success'), t('myReviews.reviewDeleted'), 2000);
          handleRefresh();
        } catch (error) {
          console.error('Error deleting review:', error);
          showErrorToast(t('error'), t('myReviews.cannotDeleteReview'));
        }
      }
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      onVoteHelpful={handleVoteHelpful}
      onEdit={handleEditReview}
      onDelete={handleDeleteReview}
      isOwnReview={true}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('myReviews.myReviews')}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={64} color="#CCC" />
      <Text style={styles.emptyStateText}>{t('myReviews.noReviewsYet')}</Text>
      <Text style={styles.emptyStateSubtext}>
        {t('myReviews.noReviewsMessage')}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#3255FB" />
        <Text style={styles.loadingText}>{t('myReviews.loadingMore')}</Text>
      </View>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>{t('myReviews.loadingReviews')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3255FB']}
            tintColor="#3255FB"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <Text style={styles.reviewsTitle}>
            {t('myReviews.myReviewsWithCount', { count: reviews.length })}
          </Text>
        }
        ListEmptyComponent={renderEmptyState()}
        ListFooterComponent={renderFooter()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
  },
  listContainer: {
    padding: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default MyReviewsScreen; 