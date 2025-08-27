import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../components/ConfirmModal';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import ReviewSummary from '../components/ReviewSummary';
import ThankYouModal from '../components/ThankYouModal';
import UserReviewSection from '../components/UserReviewSection';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import { useUserReview } from '../hooks/useUserReview';
import ReviewService, { Review, ReviewSummary as ReviewSummaryType } from '../services/reviewService';
import { getUserId } from '../utils/reviewUtils';

const ProductReviewsScreen = () => {
  const { productId, orderId, orderCode, items, editMode } = useLocalSearchParams<{ 
    productId?: string; 
    orderId?: string; 
    orderCode?: string;
    items?: string;
    editMode?: string;
  }>();
  const { user, token } = useAuth();
  const { showErrorToast, showSuccessToast } = useUnifiedModal();
  const router = useRouter();

  // Parse items from order if available, memoized
  const orderItems = React.useMemo(() => (items ? JSON.parse(items) : []), [items]);
  // State to track if we are in selection mode
  const [selectingOrderItem, setSelectingOrderItem] = useState(orderId && orderItems.length > 0 && !productId);
  // State for selected productId if coming from order
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(productId);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Use custom hook for user review
  const { userReview, refetch: refetchUserReview } = useUserReview({
    productId,
    orderId,
    token: token || undefined,
    enabled: !!(productId && orderId && user)
  });

  // Nếu đã đánh giá, không cho phép tạo mới, chỉ cho sửa/xem lại
  // const canCreateReview = !userReview; // No longer used
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pendingDeleteReviewId, setPendingDeleteReviewId] = useState<string | null>(null);
  const [isUpdateReview, setIsUpdateReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Memoize loadReviews and loadSummary to avoid dependency issues
   const loadReviews = React.useCallback(async (prodId: string, pageNum = 1, refresh = false) => {
     try {
       console.log('ProductReviews - loadReviews - Starting with productId:', prodId, 'pageNum:', pageNum);
       if (refresh) {
         setLoading(true);
       }
       const response = await ReviewService.getProductReviews(prodId, pageNum, 10, token || undefined);
       if (refresh || pageNum === 1) {
         setReviews(response.reviews || []);
       } else {
         setReviews(prev => [...prev, ...(response.reviews || [])]);
       }
       setHasMore((response.reviews?.length || 0) === 10); // Assuming limit is 10
       setPage(pageNum);
     } catch (error) {
       console.error('ProductReviews - Error loading reviews:', error);
       showErrorToast('Lỗi', 'Không thể tải danh sách đánh giá');
     } finally {
       setLoading(false);
       setRefreshing(false);
     }
   }, [token, showErrorToast]);

  const loadSummary = React.useCallback(async (prodId: string) => {
    try {
      const summaryData = await ReviewService.getProductReviewSummary(prodId, token || undefined);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, [token]);

  useEffect(() => {
    // If coming from order, show order items selection first
    if (orderId && orderItems.length > 0 && !selectedProductId) {
      setSelectingOrderItem(true);
      return;
    }
    if (selectedProductId) {
      setLoading(true);
      loadReviews(selectedProductId);
      loadSummary(selectedProductId);
    }
  }, [selectedProductId, user, orderId, orderItems.length, loadReviews, loadSummary]);

  // Auto-show review form if in edit mode and user review is loaded
  useEffect(() => {
    if (editMode === 'true' && userReview && !showReviewForm) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setShowReviewForm(true);
      }, 0);
    }
  }, [editMode, userReview, showReviewForm]);


  const handleRefresh = () => {
    if (!selectedProductId) return;
    setRefreshing(true);
    loadReviews(selectedProductId, 1, true);
    loadSummary(selectedProductId);
    refetchUserReview();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && selectedProductId) {
      loadReviews(selectedProductId, page + 1);
    }
  };

  const handleSubmitReview = async (data: any) => {
    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        await ReviewService.updateReview(userReview._id, data, token || undefined);
        setIsUpdateReview(true);
      } else {
        // Create new review
        await ReviewService.createReview(data, token || undefined);
        setIsUpdateReview(false);
      }
      
      setShowReviewForm(false);
      setShowThankYouModal(true);
      handleRefresh();
    } catch (error) {
      console.error('Error submitting review:', error);
      showErrorToast('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoHome = () => {
    setShowThankYouModal(false);
    router.push('/');
  };

  const handleCloseThankYouModal = () => {
    setShowThankYouModal(false);
  };

  const handleCloseReviewForm = () => {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      setShowReviewForm(false);
    }, 0);
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
    // The userReview is already set by the custom hook
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    setPendingDeleteReviewId(reviewId);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteReviewId) return;
    
    try {
      await ReviewService.deleteReview(pendingDeleteReviewId, token || undefined);
      showSuccessToast('Thành công', 'Đánh giá đã được xóa', 2000);
      handleRefresh();
    } catch (error) {
      console.error('Error deleting review:', error);
      showErrorToast('Lỗi', 'Không thể xóa đánh giá');
    } finally {
      setShowDeleteConfirmModal(false);
      setPendingDeleteReviewId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setPendingDeleteReviewId(null);
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      onVoteHelpful={handleVoteHelpful}
      onEdit={handleEditReview}
      onDelete={handleDeleteReview}
      isOwnReview={user?._id === getUserId(item)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={64} color="#CCC" />
      <Text style={styles.emptyStateText}>Chưa có đánh giá nào</Text>
      <Text style={styles.emptyStateSubtext}>
        Hãy là người đầu tiên đánh giá sản phẩm này
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#3255FB" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  // Auto-select if only one item
  useEffect(() => {
    if (selectingOrderItem && orderItems.length === 1) {
      setSelectedProductId(orderItems[0].book._id);
      setSelectingOrderItem(false);
    }
  }, [selectingOrderItem, orderItems]);

  // Handler for selecting an item from the order
  const handleSelectOrderItem = (item: any) => {
    setSelectedProductId(item.book._id);
    setSelectingOrderItem(false);
  };
  if (selectingOrderItem) {
    // Render order item selection screen
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FlatList
          data={orderItems}
          keyExtractor={item => item.book._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderItemRow || styles.orderItem} onPress={() => handleSelectOrderItem(item)}>
              <View style={styles.bookImageWrapper || { marginRight: 12 }}>
                {item.book.thumbnail || (item.book.cover_image && item.book.cover_image[0]) ? (
                  <Image
                    source={{ uri: item.book.thumbnail || (item.book.cover_image && item.book.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }}
                    style={styles.bookImage}
                  />
                ) : (
                  <View style={[styles.bookImage, styles.placeholderImage]}>
                    <Ionicons name="book-outline" size={24} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemTitle} numberOfLines={2}>{item.book.title}</Text>
                <Text style={styles.orderItemQuantity}>Số lượng: {item.quantity}</Text>
                <Text style={styles.orderItemPrice}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Không có sản phẩm nào trong đơn hàng</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('ProductReviews - Render - reviews length:', reviews.length);
  console.log('ProductReviews - Render - reviews:', reviews);
  console.log('ProductReviews - Render - summary:', summary);
  console.log('ProductReviews - Render - userReview:', userReview);
  console.log('ProductReviews - Render - user:', !!user);
  console.log('ProductReviews - Render - orderId:', orderId);

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
          <>
            {summary && <ReviewSummary summary={summary} />}
            {userReview && (
              <UserReviewSection
                review={userReview}
                orderCode={orderCode}
                onVoteHelpful={handleVoteHelpful}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            )}
            {user && orderId && (
              <View style={styles.reviewActionSection}>
                {!userReview && (
                  <Text style={styles.reviewPromptText}>
                    Chia sẻ trải nghiệm của bạn về sản phẩm này
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.writeReviewButton, userReview && styles.editReviewButton]}
                  onPress={() => setShowReviewForm(true)}
                >
                  <Ionicons name={userReview ? "create" : "pencil"} size={20} color="white" />
                  <Text style={styles.writeReviewText}>
                    {userReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.reviewsTitle}>
              Tất cả đánh giá ({reviews.length})
            </Text>
          </>
        }
        ListEmptyComponent={renderEmptyState()}
        ListFooterComponent={renderFooter()}
      />
      <Modal
        visible={showReviewForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseReviewForm}
      >
        <ReviewForm
          productId={selectedProductId!}
          orderId={orderId!}
          existingReview={userReview || undefined}
          onSubmit={handleSubmitReview}
          onCancel={handleCloseReviewForm}
          isLoading={submitting}
        />
      </Modal>
      <ThankYouModal
        visible={showThankYouModal}
        onClose={handleCloseThankYouModal}
        onGoHome={handleGoHome}
        isUpdate={isUpdateReview}
      />
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirmModal}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  bookImageWrapper: {
    marginRight: 12,
  },
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

  reviewActionSection: {
    marginBottom: 16,
  },
  reviewPromptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 8,
  },
  editReviewButton: {
    backgroundColor: '#27ae60',
  },
  writeReviewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  // Order items selection styles
  orderInfo: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  orderItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemImage: {
    marginRight: 12,
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3255FB',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default ProductReviewsScreen; 
