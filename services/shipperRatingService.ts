import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

export interface ShipperRatingPrompt {
  _id: string;
  text: string;
  category: 'positive' | 'negative' | 'neutral';
}

export interface CreateShipperRatingData {
  orderId: string;
  shipperId: string;
  rating: number;
  selectedPrompts?: string[];
  comment?: string;
  isAnonymous?: boolean;
}

export interface UpdateShipperRatingData {
  rating?: number;
  selectedPrompts?: string[];
  comment?: string;
  isAnonymous?: boolean;
}

export interface ShipperRating {
  _id: string;
  order_id: string | {
    _id: string;
    order_code?: string;
  };
  shipper_id: string | {
    _id: string;
    full_name?: string;
    phone_number?: string;
  };
  user_id: string | {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  selected_prompts: string[];
  comment?: string;
  is_anonymous: boolean;
  is_edited: boolean;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
  order?: {
    _id: string;
    order_code?: string;
  };
  shipper?: {
    _id: string;
    full_name?: string;
    phone_number?: string;
  };
  user?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface ShipperRatingSummary {
  averageRating: number;
  totalRatings: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  promptStats: {
    [promptId: string]: number;
  };
}

class ShipperRatingService {
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}, token?: string): Promise<any> {
    const authToken = token || await this.getToken();
    console.log('ShipperRatingService - Making request to:', `${API_BASE_URL}/api${endpoint}`);
    console.log('ShipperRatingService - Token:', authToken ? `${authToken.substring(0, 20)}...` : 'No token');
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    console.log('ShipperRatingService - Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get rating prompts
  async getPrompts(): Promise<ShipperRatingPrompt[]> {
    try {
      const response = await this.makeRequest('/shipper-ratings/prompts');
      return response.data || response.prompts || [];
    } catch (error) {
      console.error('Error fetching prompts:', error);
      throw error;
    }
  }

  // Create a new shipper rating
  async createRating(ratingData: CreateShipperRatingData): Promise<ShipperRating> {
    try {
      const response = await this.makeRequest('/shipper-ratings/rate', {
        method: 'POST',
        body: JSON.stringify(ratingData),
      });
      return response.data || response.rating;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  }

  // Get rating for a specific order
  async getOrderRating(orderId: string): Promise<ShipperRating | null> {
    try {
      const response = await this.makeRequest(`/shipper-ratings/order/${orderId}`);
      return response.data || response.rating || null;
    } catch (error) {
      console.error('Error fetching order rating:', error);
      throw error;
    }
  }

  // Get all ratings for a shipper
  async getShipperRatings(shipperId: string, page: number = 1, limit: number = 10): Promise<{
    ratings: ShipperRating[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const response = await this.makeRequest(
        `/shipper-ratings/shipper/${shipperId}?page=${page}&limit=${limit}`
      );
      return {
        ratings: response.data?.ratings || response.ratings || [],
        total: response.data?.total || response.total || 0,
        page: response.data?.page || response.page || page,
        limit: response.data?.limit || response.limit || limit,
        hasMore: response.data?.hasMore || response.hasMore || false,
      };
    } catch (error) {
      console.error('Error fetching shipper ratings:', error);
      throw error;
    }
  }

  // Get shipper rating summary/statistics
  async getShipperRatingSummary(shipperId: string): Promise<ShipperRatingSummary> {
    try {
      const response = await this.makeRequest(`/shipper-ratings/shipper/${shipperId}/summary`);
      return response.data || response.summary;
    } catch (error) {
      console.error('Error fetching shipper rating summary:', error);
      throw error;
    }
  }

  // Get user's own ratings
  async getMyRatings(page: number = 1, limit: number = 10): Promise<{
    ratings: ShipperRating[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const response = await this.makeRequest(
        `/shipper-ratings/my-ratings?page=${page}&limit=${limit}`
      );
      return {
        ratings: response.data?.ratings || response.ratings || [],
        total: response.data?.total || response.total || 0,
        page: response.data?.page || response.page || page,
        limit: response.data?.limit || response.limit || limit,
        hasMore: response.data?.hasMore || response.hasMore || false,
      };
    } catch (error) {
      console.error('Error fetching my ratings:', error);
      throw error;
    }
  }

  // Update an existing rating
  async updateRating(orderId: string, ratingData: UpdateShipperRatingData): Promise<ShipperRating> {
    try {
      const response = await this.makeRequest(`/shipper-ratings/update/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(ratingData),
      });
      return response.data || response.rating;
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }

  // Delete a rating
  async deleteRating(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/shipper-ratings/delete/${orderId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  }

  // Check if user can rate a shipper for an order
  async canRateShipper(orderId: string): Promise<{
    canRate: boolean;
    reason?: string;
    existingRating?: ShipperRating;
  }> {
    try {
      const response = await this.makeRequest(`/shipper-ratings/can-rate/${orderId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error checking if can rate shipper:', error);
      throw error;
    }
  }
}

export default new ShipperRatingService();
