import axios from 'axios';

// Base API configuration with fallback
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://server-shelf-stacker-w1ds.onrender.com';

// Alternative endpoints to try if main ones fail
const FALLBACK_ENDPOINTS = {
  '34-provinces': [
    '/api/v1/address/34/provinces',
    '/api/address/34/provinces',
    '/address/34/provinces',
    '/api/v1/provinces/34',
  ],
  '63-provinces': [
    '/api/v1/address/63/provinces',
    '/api/address/63/provinces', 
    '/address/63/provinces',
    '/api/v1/provinces/63',
  ]
};

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types for API responses based on your backend structure
export interface Province {
  code: string;
  name: string;
  type?: string;
  slug?: string;
  autocompleteType?: 'old' | 'new';
}

export interface District {
  code: string;
  name: string;
  provinceId?: string;
  type?: string;
  autocompleteType?: 'old' | 'new';
}

export interface Ward {
  code: string;
  name: string;
  districtId?: string;
  provinceCode?: string;
  provinceName?: string;
  type?: string;
  placeType?: string;
  hasMerger?: boolean;
  oldUnits?: any[];
  mergerDetails?: any;
  autocompleteType?: 'old' | 'new';
}

export interface LocationItem {
  id: string;
  name: string;
  code?: string;
  type?: string;
  autocompleteType?: 'old' | 'new';
  [key: string]: any;
}

export interface BackendApiResponse<T> {
  success: boolean;
  code: number;
  data: T;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface UserAddress {
  _id: string;
  receiver_name: string;
  phone_number: string;
  email?: string;
  province: string;
  district: string;
  ward: string;
  street?: string;
  address_detail: string;
  note?: string;
  type?: string;
  is_default: boolean;
  createdAt: string;
  updatedAt: string;
}

type AddressMode = '34-provinces' | '63-provinces';

class AddressService {
  // Get all provinces for a specific mode
  static async getAllProvinces(mode: '34-provinces' | '63-provinces' = '63-provinces'): Promise<ApiResponse<Province[]>> {
    try {
      const endpoint = mode === '34-provinces' ? '/api/v1/address/34/provinces' : '/api/v1/address/63/provinces';
      console.log(`🌐 Fetching ${mode} from: ${BASE_URL}${endpoint}`);
      
      const response = await api.get(endpoint);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: 'Provinces fetched successfully'
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('❌ Error fetching provinces:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get districts by province code (only for 63-provinces mode)
  static async getDistricts(provinceCode: string, mode: '34-provinces' | '63-provinces' = '63-provinces'): Promise<ApiResponse<District[]>> {
    try {
      if (mode === '34-provinces') {
        // 34-provinces mode doesn't have districts
        return {
          success: true,
          data: [],
          message: '34-provinces mode does not have districts level'
        };
      }
      
      const endpoint = '/api/v1/address/63/districts';
      const response = await api.get(endpoint, {
        params: { 'province-id': provinceCode }
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: 'Districts fetched successfully'
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('❌ Error fetching districts:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get wards by district code (63-provinces) or province code (34-provinces)
  static async getWards(
    districtCode: string, 
    provinceCode?: string, 
    mode: '34-provinces' | '63-provinces' = '63-provinces'
  ): Promise<ApiResponse<Ward[]>> {
    try {
      let endpoint: string;
      let params: Record<string, string>;
      
      if (mode === '34-provinces') {
        // For 34-provinces, get wards by province code
        endpoint = '/api/v1/address/34/wards';
        params = { 'province-code': provinceCode || districtCode };
      } else {
        // For 63-provinces, get wards by district code
        endpoint = '/api/v1/address/63/wards';
        params = { 'district-id': districtCode };
      }
      
      const response = await api.get(endpoint, { params });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: 'Wards fetched successfully'
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('❌ Error fetching wards:', error);
      return {
          type: item.type,
          autocompleteType: item.autocompleteType || (mode === '34-provinces' ? 'new' : 'old')
        }))
      };
    } catch (error: any) {
      console.error('Error fetching wards:', error);
      return {
        success: false,
        data: [],
        errors: [error.message || 'Failed to fetch wards']
      };
    }
  }

  static async searchAddress(query: string): Promise<{ success: boolean; code: number; data: any[]; errors: any[] }> {
    try {
      console.log('🌐 Searching address with query:', query);
      
      const response = await axios.get(`${BASE_URL}/address/search`, {
        params: { q: query }
      });
      
      console.log('✅ Search API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error searching address:', error);
      
      // Return error response
      return {
        success: false,
        code: error.response?.status || 500,
        data: [],
        errors: [error.message || 'Failed to search address']
      };
    }
  }

  // Legacy methods for backward compatibility (used by AutocompleteInput and other components)
  static async getProvinces(searchText: string = '', mode: '34-provinces' | '63-provinces' = '34-provinces'): Promise<LocationItem[]> {
    try {
      const response = await this.getAllProvinces(mode);
      if (response.success) {
        let provinces = response.data;
        if (searchText) {
          provinces = provinces.filter(province => 
            province.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }
        return provinces.map(province => ({
          id: province.code || province.id,
          name: province.name,
          code: province.code || province.id
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getProvinces:', error);
      return [];
    }
  }

  static async getDistrictsLegacy(
    provinceId: string, 
    searchText: string = '', 
    mode: '34-provinces' | '63-provinces' = '34-provinces'
  ): Promise<LocationItem[]> {
    try {
      const response = await this.getDistricts(provinceId, mode);
      if (response.success) {
        let districts = response.data;
        if (searchText) {
          districts = districts.filter(district => 
            district.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }
        return districts.map(district => ({
          id: district.code || district.id,
          name: district.name,
          code: district.code || district.id
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getDistrictsLegacy:', error);
      return [];
    }
  }

  static async getWardsLegacy(
    districtId: string, 
    searchText: string = '', 
    provinceCode: string = '',
    mode: '34-provinces' | '63-provinces' = '34-provinces'
  ): Promise<LocationItem[]> {
    try {
      const response = await this.getWards(districtId, provinceCode, mode);
      if (response.success) {
        let wards = response.data;
        if (searchText) {
          wards = wards.filter(ward => 
            ward.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }
        return wards.map(ward => ({
          id: ward.code || ward.id,
          name: ward.name,
          code: ward.code || ward.id
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getWardsLegacy:', error);
      return [];
    }
  }

  // User Address APIs (for managing user's saved addresses)
  static async getAddresses(token: string): Promise<UserAddress[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.addresses || response.data || [];
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }

  static async addAddress(token: string, addressData: {
    name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    address: string;
    is_default?: boolean;
  }): Promise<UserAddress> {
    try {
      const response = await axios.post(`${BASE_URL}/api/addresses`, addressData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  static async createAddress(token: string, addressData: {
    receiver_name: string;
    phone_number: string;
    province: string;
    district: string;
    ward: string;
    address_detail: string;
    is_default?: boolean;
    type?: string;
  }): Promise<UserAddress> {
    try {
      const response = await axios.post(`${BASE_URL}/api/addresses`, addressData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  static async updateAddress(token: string, addressId: string, addressData: {
    name?: string;
    phone?: string;
    province?: string;
    district?: string;
    ward?: string;
    address?: string;
    is_default?: boolean;
  }): Promise<UserAddress> {
    try {
      const response = await axios.put(`${BASE_URL}/api/addresses/${addressId}`, addressData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  static async deleteAddress(token: string, addressId: string): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/api/addresses/${addressId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  static async setDefaultAddress(token: string, addressId: string): Promise<void> {
    try {
      await axios.patch(`${BASE_URL}/api/addresses/${addressId}/default`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }
}

export default AddressService;