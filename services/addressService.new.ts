import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { debounce } from 'lodash';

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const CACHE_PREFIX = 'address_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
}

export interface Ward {
  code: string;
  name: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
}

export interface AddressData {
  province: Province;
  district: District;
  ward: Ward;
  fullAddress: string;
  addressCode: {
    provinceCode: string;
    districtCode: string;
    wardCode: string;
  };
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

class AddressService {
  private static async getCache(key: string) {
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

  private static async setCache(key: string, data: any) {
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

  static async getProvinces(searchText: string = ''): Promise<Province[]> {
    try {
      if (!searchText) {
        const cached = await this.getCache('provinces');
        if (cached) return cached;
      }

      const response = await axios.get(`${BASE_URL}/api/v1/address/provinces`, {
        params: searchText ? { q: searchText } : {},
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('Không có dữ liệu từ server');
      }

      const provinces = response.data?.data || response.data;
      if (!Array.isArray(provinces)) {
        throw new Error('Dữ liệu không đúng định dạng');
      }

      if (!searchText) {
        await this.setCache('provinces', provinces);
      }

      return provinces;
    } catch (error) {
      console.error('Error in getProvinces:', error);
      throw error;
    }
  }

  static async getDistricts(provinceCode: string, searchText: string = ''): Promise<District[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/address/districts`, {
        params: { 'province-code': provinceCode },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('Không có dữ liệu quận/huyện từ server');
      }

      const districts = response.data?.data || response.data;
      if (!Array.isArray(districts)) {
        throw new Error('Dữ liệu quận/huyện không đúng định dạng');
      }

      return districts;
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      if (error.response) {
        console.error('API error response:', error.response.data);
      }
      throw error;
    }
  }

  static async getWards(districtCode: string, searchText: string = ''): Promise<Ward[]> {
    try {
      const cacheKey = `wards_${districtCode}`;
      
      if (!searchText) {
        const cached = await this.getCache(cacheKey);
        if (cached) return cached;
      }

      const response = await axios.get(`${BASE_URL}/api/v1/address/wards`, {
        params: { 
          'district-code': districtCode,
          q: searchText
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('Không có dữ liệu từ server');
      }

      const wards = response.data?.data || [];

      if (!searchText) {
        await this.setCache(cacheKey, wards);
      }

      return wards;
    } catch (error) {
      console.error('Error fetching wards:', error);
      throw error;
    }
  }

  static searchProvinces = debounce(async (query: string): Promise<Province[]> => {
    if (!query || query.length < 2) return [];
    return this.getProvinces(query);
  }, 300);

  static searchDistricts = debounce(async (provinceCode: string, query: string): Promise<District[]> => {
    if (!query || query.length < 2) return [];
    return this.getDistricts(provinceCode, query);
  }, 300);

  static searchWards = debounce(async (districtCode: string, query: string): Promise<Ward[]> => {
    if (!query || query.length < 2) return [];
    return this.getWards(districtCode, query);
  }, 300);

  static async getAddresses(token: string): Promise<UserAddress[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }

  static async addAddress(token: string, addressData: {
    receiver_name: string;
    phone_number: string;
    province: string;
    district: string;
    ward: string;
    address_detail: string;
    is_default?: boolean;
  }): Promise<UserAddress> {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/addresses`,
        addressData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      if (error.response) {
        console.error('API error response:', error.response.data);
      }
      throw error;
    }
  }

  static async updateAddress(
    token: string,
    addressId: string,
    addressData: Partial<UserAddress>
  ): Promise<UserAddress> {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/addresses/${addressId}`,
        addressData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  static async deleteAddress(token: string, addressId: string): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/api/addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  static async setDefaultAddress(token: string, addressId: string): Promise<void> {
    try {
      await axios.patch(
        `${BASE_URL}/api/addresses/${addressId}/default`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }
}

export default AddressService;
