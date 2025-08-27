import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { debounce } from 'lodash';

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const CACHE_PREFIX = 'address_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export interface Province {
  code: string;
  name: string;
  type?: string;
  typeText?: string;
  slug?: string;
  autocompleteType?: 'oapi';
}

export interface District {
  code: string;
  name: string;
  provinceId: string;
  type?: string;
  typeText?: string;
  autocompleteType?: 'oapi';
}

export interface Ward {
  code: string;
  name: string;
  districtId: string;
  type?: string;
  typeText?: string;
  autocompleteType?: 'oapi';
  fullName?: string;
  path?: string;
}

export interface AddressData {
  // Thông tin người nhận (bắt buộc)
  fullName: string;
  phone: string;
  email?: string;
  
  // Thông tin địa chỉ (bắt buộc)
  street: string;
  
  // Thông tin hành chính (ít nhất 1 trong 2: ward HOẶC province)
  province?: {
    code: string;
    name: string;
  };
  district?: {
    code: string;
    name: string;
    provinceId: string;
  };
  ward?: {
    code: string;
    name: string;
    districtId: string;
    fullName?: string;
  };
  
  // Tọa độ (không bắt buộc)
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  
  // Dữ liệu OSM (không bắt buộc)
  osm?: {
    lat: number;
    lng: number;
    displayName: string;
    raw: any;
  };
  
  // Thông tin khác
  adminType?: string;
  isDefault?: boolean;
  note?: string;
  isDraft?: boolean;
  fullAddress?: string;
}

export interface AutocompleteLocation {
  code: string;
  name: string;
  type?: number;
  typeText?: string;
}

export interface AutocompleteDistrict extends AutocompleteLocation {
  provinceId: string;
}

export interface AutocompleteWard extends AutocompleteLocation {
  districtId: string;
}

export interface Autocomplete34 {
  province: AutocompleteLocation;
  district: AutocompleteDistrict;
  ward: AutocompleteWard;
}

export interface UserAddress {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  fullAddress: string;
  note?: string;
  type?: 'home' | 'office';
  isDefault: boolean;
  adminType: 'new';
  autocomplete34: Autocomplete34;
  createdAt: string;
  updatedAt: string;
}

class AddressService {
  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }
    throw lastError;
  }

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

      const provinces = await this.withRetry(async () => {
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

        return provinces;
      });

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
      // Cache key includes both province code and search text for more specific caching
      const cacheKey = searchText ? `districts_${provinceCode}_${searchText}` : `districts_${provinceCode}`;
      const cached = await this.getCache(cacheKey);
      if (cached) {
        console.log('[Cache Hit] Districts for province:', provinceCode);
        return cached;
      }

      console.log('[Cache Miss] Fetching districts for province:', provinceCode);
      const districts = await this.withRetry(async () => {
        const response = await axios.get(`${BASE_URL}/api/v1/address/districts`, {
          params: { 
            'province-code': provinceCode,
            ...(searchText ? { q: searchText } : {})
          },
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

        // Always validate district data structure
        districts.forEach(district => {
          if (!district.code || !district.name) {
            throw new Error('Dữ liệu quận/huyện không hợp lệ: Thiếu code hoặc name');
          }
        });

        return districts;
      });

      // Cache the result if it's a base search or has less than 100 items
      if (!searchText || districts.length < 100) {
        await this.setCache(cacheKey, districts);
        console.log('[Cache Set] Districts for province:', provinceCode);
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

      const wards = await this.withRetry(async () => {
        const response = await axios.get(`${BASE_URL}/api/v1/address/wards`, {
          params: { 
            districtId: districtCode,
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

        return response.data?.data || [];
      });

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

  static async searchAll(query: string): Promise<{
    code: string;
    name: string;
    level: 'province' | 'district' | 'ward';
    displayText: string;
    provinceId?: string;
    districtId?: string;
    parentInfo?: {
      province?: { code: string; name: string; };
      district?: { code: string; name: string; };
    };
  }[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/address/search-all`, {
        params: { q: query },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data?.data || [];
    } catch (error) {
      console.error('Error in searchAll:', error);
      throw error;
    }
  }

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

  static async addAddress(token: string, addressData: AddressData): Promise<UserAddress> {
    try {
      // Validate required fields
      if (!addressData.fullName?.trim()) {
        throw new Error('fullName is required');
      }
      if (!addressData.phone?.trim()) {
        throw new Error('phone is required');
      }
      if (!addressData.street?.trim()) {
        throw new Error('street is required');
      }
      
      // Validate at least one of ward or province
      const hasWard = Boolean(addressData.ward && (addressData.ward.code || addressData.ward.name));
      const hasProvince = Boolean(addressData.province && (addressData.province.code || addressData.province.name));
      if (!hasWard && !hasProvince) {
        throw new Error('At least one of ward or province is required');
      }

      // Prepare payload according to BE schema
      const payload: any = {
        fullName: addressData.fullName.trim(),
        phone: addressData.phone.trim(),
        street: addressData.street.trim(),
        adminType: 'new',
        isDefault: addressData.isDefault || false,
        note: addressData.note || '',
        isDraft: addressData.isDraft || false
      };

      // Add province if provided
      if (addressData.province) {
        payload.province = {
          code: addressData.province.code,
          name: addressData.province.name
        };
      }

      // Add district if provided
      if (addressData.district) {
        payload.district = {
          code: addressData.district.code,
          name: addressData.district.name,
          provinceId: addressData.district.provinceId
        };
      }

      // Add ward if provided
      if (addressData.ward) {
        payload.ward = {
          code: addressData.ward.code,
          name: addressData.ward.name,
          districtId: addressData.ward.districtId,
          fullName: addressData.ward.fullName
        };
      }

          // Add location if provided (GeoJSON format) - chỉ khi có coordinates hợp lệ
    if (addressData.location && 
        addressData.location.coordinates && 
        Array.isArray(addressData.location.coordinates) &&
        addressData.location.coordinates.length === 2 &&
        !Number.isNaN(addressData.location.coordinates[0]) &&
        !Number.isNaN(addressData.location.coordinates[1]) &&
        addressData.location.coordinates[0] !== 0 &&
        addressData.location.coordinates[1] !== 0) {
      payload.location = {
        type: addressData.location.type,
        coordinates: addressData.location.coordinates
      };
    }

          // Add OSM data if provided - chỉ khi có dữ liệu hợp lệ
    if (addressData.osm && 
        addressData.osm.lat && 
        addressData.osm.lng &&
        !Number.isNaN(addressData.osm.lat) &&
        !Number.isNaN(addressData.osm.lng) &&
        addressData.osm.lat !== 0 &&
        addressData.osm.lng !== 0) {
      payload.osm = {
        lat: addressData.osm.lat,
        lng: addressData.osm.lng,
        displayName: addressData.osm.displayName,
        raw: addressData.osm.raw
      };
    }

      console.log('[AddressService] addAddress payload:', payload);

      const response = await axios.post(
        `${BASE_URL}/api/addresses`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[AddressService] addAddress response status:', response.status);
      console.log('[AddressService] addAddress response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      if (error.response) {
        console.error('API error response:', error.response.data);
      }
      throw error;
    }
  }

  // Create a draft (map-only) address. This method skips FE-side validation and sends the minimal payload.
  static async createDraft(token: string, draftData: any): Promise<any> {
    try {
      console.log('[AddressService] createDraft payload', draftData);
      const response = await axios.post(
        `${BASE_URL}/api/addresses`,
        draftData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('[AddressService] createDraft response', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating draft address:', error);
      if (error.response) console.error('API error response:', error.response.data);
      throw error;
    }
  }

  static async updateAddress(
    token: string,
    addressId: string,
    addressData: Partial<{
      fullName: string;
      phone: string;
      email?: string;
      street: string;
      province: Province;
      district: District;
      ward: Ward;
      isDefault?: boolean;
      note?: string;
      type?: 'home' | 'office';
    }>
  ): Promise<UserAddress> {
    try {
      let payload: any = {};

      // Copy basic fields
      if (addressData.fullName) payload.fullName = addressData.fullName;
      if (addressData.phone) payload.phone = addressData.phone;
      if (addressData.email) payload.email = addressData.email;
      if (addressData.street) payload.street = addressData.street;
      if (addressData.note) payload.note = addressData.note;
      if (typeof addressData.isDefault !== 'undefined') {
        payload.isDefault = addressData.isDefault;
      }

      // Always include complete autocomplete34 structure when updating
      if (addressData.province || addressData.district || addressData.ward) {
        payload.autocomplete34 = {
          province: addressData.province ? {
            code: addressData.province.code,
            name: addressData.province.name,
            type: parseInt(addressData.province.type || '0'),
            typeText: addressData.province.typeText || ''
          } : undefined,
          district: addressData.district ? {
            code: addressData.district.code,
            name: addressData.district.name,
            type: parseInt(addressData.district.type || '0'),
            typeText: addressData.district.typeText || '',
            provinceId: addressData.province?.code
          } : undefined,
          ward: addressData.ward ? {
            code: addressData.ward.code,
            name: addressData.ward.name,
            type: parseInt(addressData.ward.type || '0'),
            typeText: addressData.ward.typeText || '',
            districtId: addressData.district?.code
          } : undefined
        };
      }

      // Handle address fields if any are updated
      if (addressData.province || addressData.district || addressData.ward || addressData.street) {
        const province = addressData.province;
        const district = addressData.district;
        const ward = addressData.ward;

        if (province) {
          payload.province = province.name;  // Using name instead of code
          payload.autocomplete34 = {
            ...(payload.autocomplete34 || {}),
            province: {
              code: province.code,
              name: province.name,
              type: parseInt(province.type || '0'),
              typeText: province.typeText || ''
            }
          };
        }

        if (district) {
          payload.district = district.name;  // Using name instead of code
          payload.autocomplete34 = {
            ...(payload.autocomplete34 || {}),
            district: {
              code: district.code,
              name: district.name,
              type: parseInt(district.type || '0'),
              typeText: district.typeText || '',
              provinceId: province?.code
            }
          };
        }

        if (ward) {
          payload.ward = ward.name;  // Using name instead of code
          const wardFullName = district && province ? 
            `${ward.name}, ${district.name}, ${province.name}` : undefined;
          payload.autocomplete34 = {
            ...(payload.autocomplete34 || {}),
            ward: {
              code: ward.code,
              name: ward.name,
              type: parseInt(ward.type || '0'),
              typeText: ward.typeText || '',
              districtId: district?.code,
              fullName: wardFullName
            }
          };
        }

        // Update fullAddress if we have all components
        if (addressData.street && ward && district && province) {
          payload.fullAddress = [
            addressData.street,
            ward.name,
            district.name,
            province.name
          ].filter(Boolean).join(', ');
        }
      }

      const response = await axios.put(
        `${BASE_URL}/api/addresses/${addressId}`,
        payload,
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
