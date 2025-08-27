import { useEffect, useState } from 'react';
import ReviewService, { Review } from '../services/reviewService';

interface UseUserReviewProps {
  productId?: string;
  orderId?: string;
  token?: string;
  enabled?: boolean;
}

interface UseUserReviewReturn {
  userReview: Review | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserReview = ({
  productId,
  orderId,
  token,
  enabled = true
}: UseUserReviewProps): UseUserReviewReturn => {
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserReview = async () => {
    if (!productId || !orderId || !token || !enabled) {
      setUserReview(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useUserReview - Checking for productId:', productId, 'orderId:', orderId);
      const review = await ReviewService.checkUserReview(productId, orderId, token);
      console.log('useUserReview - Found review:', review);
      setUserReview(review);
    } catch (err) {
      console.warn('useUserReview - Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserReview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserReview();
  }, [productId, orderId, token, enabled]);

  return {
    userReview,
    loading,
    error,
    refetch: checkUserReview
  };
}; 
