import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Types
export interface Province {
  code: string;
  name: string;
  type: string;
  typeText: string;
  slug?: string;
  autocompleteType?: string;
}

export interface District {
  code: string;
  name: string;
  provinceId: string;
  type: string;
  typeText: string;
}

export interface Ward {
  code: string;
  name: string;
  districtId: string;
  type: string;
  typeText: string;
  fullName?: string;
  path?: string;
}

export interface AddressData {
  province: Province | null;
  district: District | null;
  ward: Ward | null;
}

export interface SearchItem {
  code: string;
  name: string;
  level: 'province' | 'district' | 'ward';
  displayText: string;
  parentInfo?: any;
}

class AddressApiService {
  private static instance: AddressApiService;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): AddressApiService {
    if (!AddressApiService.instance) {
      AddressApiService.instance = new AddressApiService();
    }
    return AddressApiService.instance;
  }

  // Get provinces
  async getProvinces(query = ''): Promise<Province[]> {
    const cacheKey = `provinces_${query}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/address/provinces`, {
        params: { q: query }
      });
      
      const data = response.data.success ? response.data.data : [];
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw new Error('Không thể tải danh sách tỉnh/thành phố');
    }
  }

  // Get districts by province code
  async getDistricts(provinceCode: string, query = ''): Promise<District[]> {
    const cacheKey = `districts_${provinceCode}_${query}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/address/districts`, {
        params: { 
          'province-code': provinceCode,
          q: query 
        }
      });
      
      const data = response.data.success ? response.data.data : [];
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching districts:', error);
      throw new Error('Không thể tải danh sách quận/huyện');
    }
  }

  // Get wards by district code
  async getWards(districtCode: string, query = ''): Promise<Ward[]> {
    const cacheKey = `wards_${districtCode}_${query}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/address/wards`, {
        params: { 
          districtId: districtCode,
          q: query 
        }
      });
      
      const data = response.data.success ? response.data.data : [];
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching wards:', error);
      throw new Error('Không thể tải danh sách phường/xã');
    }
  }

  // Search all (provinces, districts, wards)
  async searchAll(query: string): Promise<SearchItem[]> {
    const cacheKey = `search_${query}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/address/search-all`, {
        params: { q: query }
      });
      
      const data = response.data.success ? response.data.data : [];
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error searching addresses:', error);
      throw new Error('Không thể tìm kiếm địa chỉ');
    }
  }

  // Search by type
  async searchByType(
    type: 'province' | 'district' | 'ward', 
    query: string, 
    parentId?: string
  ): Promise<SearchItem[]> {
    const cacheKey = `search_${type}_${query}_${parentId || ''}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params: any = { type, q: query };
      if (parentId) {
        if (type === 'district') {
          params.provinceId = parentId;
        } else if (type === 'ward') {
          params.districtId = parentId;
        }
      }

      const response = await axios.get(`${API_BASE_URL}/api/v1/address/search`, {
        params
      });
      
      const data = response.data.success ? response.data.data : [];
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      throw new Error(`Không thể tìm kiếm ${type}`);
    }
  }

  // Reverse geocode (if backend supports it)
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/address/reverse`, {
        lat,
        lng
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw new Error('Không thể xác định địa chỉ từ tọa độ');
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache
  clearCacheByKey(key: string): void {
    this.cache.delete(key);
  }

  // Get cache size
  getCacheSize(): number {
    return this.cache.size;
  }

  // Format address for display
  formatAddress(address: AddressData): string {
    const parts = [];
    
    if (address.ward) {
      parts.push(`${address.ward.typeText} ${address.ward.name}`);
    }
    if (address.district) {
      parts.push(`${address.district.typeText} ${address.district.name}`);
    }
    if (address.province) {
      parts.push(`${address.province.typeText} ${address.province.name}`);
    }
    
    return parts.join(', ');
  }

  // Validate address
  validateAddress(address: AddressData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!address.province) {
      errors.push('Vui lòng chọn tỉnh/thành phố');
    }
    if (!address.district) {
      errors.push('Vui lòng chọn quận/huyện');
    }
    if (!address.ward) {
      errors.push('Vui lòng chọn phường/xã');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AddressApiService.getInstance();





