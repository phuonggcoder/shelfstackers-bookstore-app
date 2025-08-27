import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Helper function to make API requests
async function makeRequest(endpoint: string, options: { method?: string; data?: any } = {}) {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(options.data && { body: JSON.stringify(options.data) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export interface ShipperRating {
  _id: string;
  order_id: string;
  user_id: string;
  shipper_id: string;
  rating: number;
  selected_prompts: string[];
  comment: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingPrompt {
  id: string;
  text: string;
  type: 'positive' | 'negative';
}

export interface CanRateResponse {
  canRate: boolean;
  reason?: string;
  existingRating?: ShipperRating;
  order?: {
    _id: string;
    order_id: string;
    assigned_shipper_id: string;
  };
}

class ShipperRatingService {
  // Lấy danh sách prompts đánh giá
  async getPrompts(): Promise<RatingPrompt[]> {
    try {
      const response = await makeRequest('/shipper-ratings/prompts');
      return response.data;
    } catch (error) {
      console.error('Error fetching prompts:', error);
      throw error;
    }
  }

  // Kiểm tra có thể đánh giá shipper không (compatibility endpoint)
  async canRateShipper(orderId: string): Promise<CanRateResponse> {
    try {
      const response = await makeRequest(`/shipper-ratings/can-rate/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking if can rate shipper:', error);

      if (error.message?.includes('401')) {
        return {
          canRate: false,
          reason: 'Unauthorized: Please login to rate shipper'
        };
      }

      // Handle 404 error gracefully - endpoint might not be implemented yet
      if (error.message?.includes('404') || error.message?.includes('HTTP error! status: 404')) {
        console.warn('Shipper rating can-rate endpoint returned 404, using order endpoint as fallback.');
        // Fallback to order endpoint
        return this.checkRatingStatus(orderId);
      }

      throw error;
    }
  }

  // Kiểm tra trạng thái đánh giá (fallback method)
  async checkRatingStatus(orderId: string): Promise<CanRateResponse> {
    try {
      const response = await makeRequest(`/shipper-ratings/order/${orderId}`);
      
      // If we get a rating back, user cannot rate (already rated)
      if (response.data && response.data._id) {
        return {
          canRate: false,
          reason: 'Already rated this order',
          existingRating: response.data
        };
      }

      // If no rating exists, user can rate
      return {
        canRate: true,
        reason: 'Can rate this order'
      };
    } catch (error: any) {
      console.error('Error checking rating status:', error);

      if (error.message?.includes('401')) {
        return {
          canRate: false,
          reason: 'Unauthorized: Please login to rate shipper'
        };
      }

      // Handle 404 error gracefully - no rating exists
      if (error.message?.includes('404') || error.message?.includes('HTTP error! status: 404')) {
        return {
          canRate: true,
          reason: 'No existing rating found'
        };
      }

      throw error;
    }
  }

  // Lấy đánh giá của một đơn hàng cụ thể
  async getOrderRating(orderId: string): Promise<ShipperRating | null> {
    try {
      const response = await makeRequest(`/shipper-ratings/order/${orderId}`);
      return response.data;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null; // No rating exists
      }
      throw error;
    }
  }

  // Tạo đánh giá shipper
  async createRating(ratingData: {
    order_id: string;
    rating: number;
    selected_prompts: string[];
    comment: string;
    is_anonymous: boolean;
  }): Promise<ShipperRating> {
    try {
      const response = await makeRequest('/shipper-ratings/rate', {
        method: 'POST',
        data: ratingData
      });
      return response.data;
    } catch (error) {
      console.error('Error creating shipper rating:', error);
      throw error;
    }
  }

  // Cập nhật đánh giá (chỉ trong vòng 24h)
  async updateRating(orderId: string, updateData: {
    rating?: number;
    selected_prompts?: string[];
    comment?: string;
    is_anonymous?: boolean;
  }): Promise<ShipperRating> {
    try {
      const response = await makeRequest(`/shipper-ratings/update/${orderId}`, {
        method: 'PUT',
        data: updateData
      });
      return response.data;
    } catch (error) {
      console.error('Error updating shipper rating:', error);
      throw error;
    }
  }

  // Xóa đánh giá (chỉ trong vòng 24h)
  async deleteRating(orderId: string): Promise<void> {
    try {
      await makeRequest(`/shipper-ratings/delete/${orderId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting shipper rating:', error);
      throw error;
    }
  }

  // Shipper xem đánh giá của mình
  async getMyRatings(page: number = 1, limit: number = 10): Promise<{
    ratings: ShipperRating[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: {
      total_ratings: number;
      avg_rating: number;
      total_orders: number;
    };
    delivered_orders: number;
  }> {
    try {
      const response = await makeRequest(`/shipper-ratings/my-ratings?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my ratings:', error);
      throw error;
    }
  }

  // User xem rating của shipper (public)
  async getShipperStats(shipperId: string): Promise<{
    shipper_info: {
      id: string;
      full_name: string;
      phone: string;
    };
    stats: {
      total_ratings: number;
      avg_rating: number;
      delivered_orders: number;
      rating_distribution: { [key: number]: number };
    };
  }> {
    try {
      const response = await makeRequest(`/shipper-ratings/shipper/${shipperId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shipper stats:', error);
      throw error;
    }
  }
}

export default new ShipperRatingService();
