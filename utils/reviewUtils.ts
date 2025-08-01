import { Review } from '../services/reviewService';

/**
 * Extract ID from a field that might be a string or an object with _id
 */
export const extractId = (field: string | { _id: string } | any): string => {
  if (typeof field === 'string') {
    return field;
  }
  if (field && typeof field === 'object' && field._id) {
    return field._id;
  }
  return String(field);
};

/**
 * Extract product ID from review
 */
export const getProductId = (review: Review): string => {
  return extractId(review.product_id);
};

/**
 * Extract order ID from review
 */
export const getOrderId = (review: Review): string => {
  return extractId(review.order_id);
};

/**
 * Extract user ID from review
 */
export const getUserId = (review: Review): string => {
  return extractId(review.user_id);
};

/**
 * Get user name from review (handles both populated and non-populated user data)
 */
export const getUserName = (review: Review): string => {
  if (review.user) {
    return review.user.name;
  }
  if (typeof review.user_id === 'object' && review.user_id.name) {
    return review.user_id.name;
  }
  return 'Người dùng';
};

/**
 * Get user avatar from review (handles both populated and non-populated user data)
 */
export const getUserAvatar = (review: Review): string | undefined => {
  if (review.user?.avatar) {
    return review.user.avatar;
  }
  if (typeof review.user_id === 'object' && review.user_id.avatar) {
    return review.user_id.avatar;
  }
  return undefined;
};

/**
 * Get product title from review (handles both populated and non-populated product data)
 */
export const getProductTitle = (review: Review): string => {
  if (review.product?.title) {
    return review.product.title;
  }
  if (typeof review.product_id === 'object' && review.product_id.title) {
    return review.product_id.title;
  }
  return 'Sản phẩm';
}; 