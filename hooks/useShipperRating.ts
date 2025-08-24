import { useCallback, useEffect, useState } from 'react';
import ShipperRatingService, {
    CreateShipperRatingData,
    ShipperRating,
    ShipperRatingPrompt,
    ShipperRatingSummary,
    UpdateShipperRatingData
} from '../services/shipperRatingService';

// Hook for managing shipper rating data
export const useShipperRating = (shipperId: string) => {
  const [ratingData, setRatingData] = useState<ShipperRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipperRating = useCallback(async () => {
    if (!shipperId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await ShipperRatingService.getShipperRatingSummary(shipperId);
      setRatingData(result);
    } catch (error) {
      console.error('Error fetching shipper rating:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch rating data');
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  useEffect(() => {
    fetchShipperRating();
  }, [fetchShipperRating]);

  return { 
    ratingData, 
    loading, 
    error, 
    refetch: fetchShipperRating 
  };
};

// Hook for managing rating modal state
export const useRatingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shipperInfo, setShipperInfo] = useState<any>(null);
  const [existingRating, setExistingRating] = useState<ShipperRating | null>(null);
  const [prompts, setPrompts] = useState<ShipperRatingPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);

  const openModal = useCallback(async (order: any, shipper: any, rating: ShipperRating | null = null) => {
    setOrderId(order._id);
    setShipperInfo(shipper);
    setExistingRating(rating);
    setIsOpen(true);
    
    // Load prompts when modal opens
    try {
      setPromptsLoading(true);
      const promptsData = await ShipperRatingService.getPrompts();
      setPrompts(promptsData);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setPromptsLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setOrderId(null);
    setShipperInfo(null);
    setExistingRating(null);
    setPrompts([]);
  }, []);

  return {
    isOpen,
    orderId,
    shipperInfo,
    existingRating,
    prompts,
    promptsLoading,
    openModal,
    closeModal
  };
};

// Hook for managing shipper ratings list
export const useShipperRatingsList = (shipperId: string, page: number = 1, limit: number = 10) => {
  const [ratings, setRatings] = useState<ShipperRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchRatings = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!shipperId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await ShipperRatingService.getShipperRatings(shipperId, pageNum, limit);
      
      if (append) {
        setRatings(prev => [...prev, ...result.ratings]);
      } else {
        setRatings(result.ratings);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching shipper ratings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  }, [shipperId, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = Math.floor(ratings.length / limit) + 1;
      fetchRatings(nextPage, true);
    }
  }, [loading, hasMore, ratings.length, limit, fetchRatings]);

  const refresh = useCallback(() => {
    fetchRatings(1, false);
  }, [fetchRatings]);

  useEffect(() => {
    fetchRatings(1, false);
  }, [fetchRatings]);

  return {
    ratings,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh
  };
};

// Hook for managing user's own ratings
export const useMyRatings = (page: number = 1, limit: number = 10) => {
  const [ratings, setRatings] = useState<ShipperRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchMyRatings = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const result = await ShipperRatingService.getMyRatings(pageNum, limit);
      
      if (append) {
        setRatings(prev => [...prev, ...result.ratings]);
      } else {
        setRatings(result.ratings);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching my ratings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = Math.floor(ratings.length / limit) + 1;
      fetchMyRatings(nextPage, true);
    }
  }, [loading, hasMore, ratings.length, limit, fetchMyRatings]);

  const refresh = useCallback(() => {
    fetchMyRatings(1, false);
  }, [fetchMyRatings]);

  useEffect(() => {
    fetchMyRatings(1, false);
  }, [fetchMyRatings]);

  return {
    ratings,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh
  };
};

// Hook for managing rating submission
export const useRatingSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRating = useCallback(async (ratingData: CreateShipperRatingData) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await ShipperRatingService.createRating(ratingData);
      return result;
    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit rating';
      setError(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRating = useCallback(async (orderId: string, ratingData: UpdateShipperRatingData) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await ShipperRatingService.updateRating(orderId, ratingData);
      return result;
    } catch (error) {
      console.error('Error updating rating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update rating';
      setError(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRating = useCallback(async (orderId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await ShipperRatingService.deleteRating(orderId);
      return result;
    } catch (error) {
      console.error('Error deleting rating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete rating';
      setError(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    error,
    submitRating,
    updateRating,
    deleteRating
  };
};

// Hook for checking if user can rate a shipper
export const useCanRateShipper = (orderId: string) => {
  const [canRate, setCanRate] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [existingRating, setExistingRating] = useState<ShipperRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkCanRate = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await ShipperRatingService.canRateShipper(orderId);
      setCanRate(result.canRate);
      setReason(result.reason || null);
      setExistingRating(result.existingRating || null);
    } catch (error) {
      console.error('Error checking if can rate shipper:', error);
      setError(error instanceof Error ? error.message : 'Failed to check rating eligibility');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    checkCanRate();
  }, [checkCanRate]);

  return {
    canRate,
    reason,
    existingRating,
    loading,
    error,
    refetch: checkCanRate
  };
};
