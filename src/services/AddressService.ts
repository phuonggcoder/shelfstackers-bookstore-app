import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { debounce } from 'lodash';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const CACHE_PREFIX = 'address_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

class AddressService {
  private axios;

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
  }

  // Cache helpers
  private async getCache(key: string) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, data: any) {
    try {
      await AsyncStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  // Network check
  private async checkNetwork() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      throw new Error('Không có kết nối mạng');
    }
  }

  // API methods with caching
  async getProvinces(query = '') {
    await this.checkNetwork();

    const cacheKey = query ? `provinces_${query}` : 'provinces';
    
    // Check cache if no query
    if (!query) {
      const cached = await this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.axios.get('/provinces', {
      params: {
        q: query,
        page: 0,
        size: 30
      }
    });

    const provinces = response.data.data;

    if (!query) {
      await this.setCache(cacheKey, provinces);
    }

    return provinces;
  }

  async getDistricts(provinceId: string, query = '') {
    await this.checkNetwork();

    const cacheKey = query ? 
      `districts_${provinceId}_${query}` : 
      `districts_${provinceId}`;
    
    if (!query) {
      const cached = await this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.axios.get('/districts', {
      params: {
        provinceId,
        q: query,
        page: 0,
        size: 30
      }
    });

    const districts = response.data.data;

    if (!query) {
      await this.setCache(cacheKey, districts);
    }

    return districts;
  }

  async getWards(districtId: string, query = '') {
    await this.checkNetwork();

    const cacheKey = query ? 
      `wards_${districtId}_${query}` : 
      `wards_${districtId}`;
    
    if (!query) {
      const cached = await this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.axios.get('/wards', {
      params: {
        districtId,
        q: query,
        page: 0,
        size: 30
      }
    });

    const wards = response.data.data;

    if (!query) {
      await this.setCache(cacheKey, wards);
    }

    return wards;
  }

  // Debounced search methods
  searchProvinces = debounce(async (query: string) => {
    if (query.length < 2) return [];
    return this.getProvinces(query);
  }, 300);

  searchDistricts = debounce(async (provinceId: string, query: string) => {
    if (query.length < 2) return [];
    return this.getDistricts(provinceId, query);
  }, 300);

  searchWards = debounce(async (districtId: string, query: string) => {
    if (query.length < 2) return [];
    return this.getWards(districtId, query);
  }, 300);

  // Offline support
  async getOfflineProvinces() {
    try {
      const cached = await this.getCache('provinces');
      return cached || [];
    } catch {
      return [];
    }
  }
}

export default new AddressService();
