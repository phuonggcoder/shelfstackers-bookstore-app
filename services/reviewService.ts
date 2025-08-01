import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

export interface ReviewMedia {
  url: string;
  type: 'image' | 'video';
  public_id?: string;
  size?: number;
  duration?: number;
}

export interface CreateReviewData {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string;
  images?: string[];
  videos?: string[];
  media?: ReviewMedia[];
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[];
  videos?: string[];
  media?: ReviewMedia[];
}

export interface Review {
  _id: string;
  user_id: string | {
    _id: string;
    name: string;
    avatar?: string;
  };
  product_id: string | {
    _id: string;
    title: string;
    image?: string;
  };
  order_id: string | {
    _id: string;
    order_code?: string;
  };
  rating: number;
  comment?: string;
  images: string[];
  videos: string[];
  media: ReviewMedia[];
  is_verified_purchase: boolean;
  helpful_votes: number;
  is_edited: boolean;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
  user?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product?: {
    _id: string;
    title: string;
    image?: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

class ReviewService {
  private async makeRequest(endpoint: string, options: RequestInit = {}, token?: string): Promise<any> {
    const authToken = token || await this.getToken();
    console.log('ReviewService - Making request to:', `${API_BASE_URL}/api${endpoint}`);
    console.log('ReviewService - Token:', authToken ? `${authToken.substring(0, 20)}...` : 'No token');
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    console.log('ReviewService - Response status:', response.status);
    console.log('ReviewService - Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ReviewService - Error response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('ReviewService - Response data:', responseData);
    return responseData;
  }

  private async getToken(): Promise<string> {
    try {
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('token');
      console.log('ReviewService - getToken - Token from AsyncStorage:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    } catch (error) {
      console.error('ReviewService - getToken - Error:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  // Tạo review mới
  async createReview(data: CreateReviewData, token?: string): Promise<Review> {
    const response = await this.makeRequest('/v1/review', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    return response.review;
  }

  // Cập nhật review
  async updateReview(reviewId: string, data: UpdateReviewData, token?: string): Promise<Review> {
    const response = await this.makeRequest(`/v1/review/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
    return response.review;
  }

  // Lấy review theo ID
  async getReview(reviewId: string): Promise<Review> {
    const response = await this.makeRequest(`/v1/review/${reviewId}`);
    return response.review;
  }

  // Lấy danh sách review của sản phẩm
  async getProductReviews(productId: string, page: number = 1, limit: number = 10, token?: string): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      console.log('ReviewService - getProductReviews - Calling endpoint for productId:', productId);
      const response = await this.makeRequest(`/v1/review/product/${productId}?${params}`, {}, token);
      console.log('ReviewService - getProductReviews - Response:', response);
      return response;
    } catch (error: any) {
      console.error('ReviewService - getProductReviews - Error:', error);
      
      // Nếu lỗi 500 hoặc endpoint chưa implement, trả về empty response
      if (error.message.includes('500') || error.message.includes('404')) {
        console.warn('ReviewService - Backend endpoint /v1/review/product/${productId} chưa được implement hoặc lỗi, trả về empty response');
        return {
          reviews: [],
          total: 0,
          page,
          limit
        };
      }
      
      throw error;
    }
  }

  // Lấy review của user
  async getUserReviews(page: number = 1, limit: number = 10, token?: string): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      console.log('ReviewService - getUserReviews - Calling endpoint with params:', params.toString());
      
      // TODO: Backend cần implement endpoint này
      // Hiện tại endpoint /v1/review/user chưa có, sẽ trả về empty response
      const response = await this.makeRequest(`/v1/review/user?${params}`, {}, token);
      console.log('ReviewService - getUserReviews - Response:', response);
      return response;
    } catch (error: any) {
      console.error('ReviewService - getUserReviews - Error:', error);
      
      // Nếu lỗi 500 (endpoint chưa implement), trả về empty response
      if (error.message.includes('500')) {
        console.warn('ReviewService - Backend endpoint /v1/review/user chưa được implement, trả về empty response');
        return {
          reviews: [],
          total: 0,
          page,
          limit
        };
      }
      
      throw error;
    }
  }

  // Lấy thống kê review của sản phẩm
  async getProductReviewSummary(productId: string, token?: string): Promise<ReviewSummary> {
    try {
      console.log('ReviewService - getProductReviewSummary - Calling endpoint for productId:', productId);
      const response = await this.makeRequest(`/v1/review/product/${productId}/summary`, {}, token);
      console.log('ReviewService - getProductReviewSummary - Response:', response);
      return response.summary;
    } catch (error: any) {
      console.error('ReviewService - getProductReviewSummary - Error:', error);
      
      // Nếu lỗi 500 hoặc endpoint chưa implement, trả về default summary
      if (error.message.includes('500') || error.message.includes('404')) {
        console.warn('ReviewService - Backend endpoint /v1/review/product/${productId}/summary chưa được implement, trả về default summary');
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }
      
      throw error;
    }
  }

  // Xóa review
  async deleteReview(reviewId: string, token?: string): Promise<void> {
    await this.makeRequest(`/v1/review/${reviewId}`, {
      method: 'DELETE',
    }, token);
  }

  // Upload media cho review
  async uploadMedia(mediaUrl: string): Promise<{
    url: string;
    type: 'image' | 'video';
    public_id: string;
    size?: number;
    duration?: number;
  }> {
    const response = await this.makeRequest('/review-upload/single', {
      method: 'POST',
      body: JSON.stringify({ mediaUrl }),
    });
    return response;
  }

  // Upload nhiều media
  async uploadMultipleMedia(mediaUrls: string[]): Promise<{
    url: string;
    type: 'image' | 'video';
    public_id: string;
    size?: number;
    duration?: number;
  }[]> {
    const response = await this.makeRequest('/review-upload/media', {
      method: 'POST',
      body: JSON.stringify({ mediaUrls }),
    });
    return response.media;
  }

  // Xóa media
  async deleteMedia(publicId: string): Promise<void> {
    await this.makeRequest(`/review-upload/media/${publicId}`, {
      method: 'DELETE',
    });
  }

  // Vote hữu ích cho review
  async voteHelpful(reviewId: string, token?: string): Promise<void> {
    await this.makeRequest(`/v1/review/${reviewId}/helpful`, {
      method: 'POST',
    }, token);
  }

  // Kiểm tra user đã review sản phẩm chưa
  async checkUserReview(productId: string, orderId: string, token?: string): Promise<Review | null> {
    try {
      const params = new URLSearchParams({ productId, orderId });
      const response = await this.makeRequest(`/v1/review/check?${params}`, {}, token);
      return response.review;
    } catch (error: any) {
      console.error('ReviewService - checkUserReview - Error:', error);
      
      // Nếu lỗi 404 hoặc 500 (endpoint chưa implement), trả về null
      if (error.message.includes('404') || error.message.includes('500')) {
        console.warn('ReviewService - Backend endpoint /v1/review/check chưa được implement, trả về null');
        return null;
      }
      
      throw error;
    }
  }
}

export default new ReviewService(); 