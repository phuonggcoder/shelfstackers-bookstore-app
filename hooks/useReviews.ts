import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ReviewService, { Review, ReviewSummary } from '../services/reviewService';

export const useReviews = (productId?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadReviews = async (pageNum = 1, refresh = false) => {
    if (!productId) return;
    
    try {
      if (refresh) {
        setLoading(true);
      }
      
      const response = await ReviewService.getProductReviews(productId, pageNum);
      
      if (refresh || pageNum === 1) {
        setReviews(response.reviews);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
      }
      
      setHasMore(response.reviews.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSummary = async () => {
    if (!productId) return;
    
    try {
      const summaryData = await ReviewService.getProductReviewSummary(productId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const checkUserReview = async (orderId?: string) => {
    if (!productId || !orderId || !user) return;
    
    try {
      const review = await ReviewService.checkUserReview(productId, orderId);
      setUserReview(review);
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  const refreshReviews = () => {
    setRefreshing(true);
    loadReviews(1, true);
    loadSummary();
  };

  const loadMoreReviews = () => {
    if (hasMore && !loading) {
      loadReviews(page + 1);
    }
  };

  const createReview = async (data: any) => {
    try {
      const newReview = await ReviewService.createReview(data);
      setUserReview(newReview);
      refreshReviews();
      return newReview;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  };

  const updateReview = async (reviewId: string, data: any) => {
    try {
      const updatedReview = await ReviewService.updateReview(reviewId, data);
      setUserReview(updatedReview);
      setReviews(prev => 
        prev.map(review => 
          review._id === reviewId ? updatedReview : review
        )
      );
      return updatedReview;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await ReviewService.deleteReview(reviewId);
      setUserReview(null);
      setReviews(prev => prev.filter(review => review._id !== reviewId));
      loadSummary();
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  };

  const voteHelpful = async (reviewId: string) => {
    try {
      await ReviewService.voteHelpful(reviewId);
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

  useEffect(() => {
    if (productId) {
      loadReviews();
      loadSummary();
    }
  }, [productId]);

  return {
    reviews,
    summary,
    userReview,
    loading,
    refreshing,
    hasMore,
    loadReviews,
    loadSummary,
    checkUserReview,
    refreshReviews,
    loadMoreReviews,
    createReview,
    updateReview,
    deleteReview,
    voteHelpful,
  };
}; 
