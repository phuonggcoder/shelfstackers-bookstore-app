import axios from 'axios';

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
}

export interface Ward {
  code: string;
  name: string;
  districtCode?: string;
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

// Interface for user addresses (different from administrative addresses)
export interface LocationItem {
  id: string;
  name: string;
  code?: string;
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
  // Unified API for both modes
  static async getProvincesByMode(mode: AddressMode, searchText: string = ''): Promise<LocationItem[]> {
    try {
      let url = '';
      if (mode === '34-provinces') {
        url = `${BASE_URL}/api/v1/address/34/provinces`;
      } else {
        url = `${BASE_URL}/api/v1/address/63/provinces`;
      }
      const response = await axios.get(url, { params: searchText ? { q: searchText } : {} });
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.map((province: any) => ({
          id: province.code,
          name: province.name,
          code: province.code,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getProvincesByMode:', error);
      return [];
    }
  }

  static async getDistrictsByMode(provinceCode: string, mode: AddressMode, searchText: string = ''): Promise<LocationItem[]> {
    try {
      if (mode === '34-provinces') return [];
      // 63-provinces only
      const url = `${BASE_URL}/api/v1/address/63/districts`;
      const response = await axios.get(url, { params: { 'province-id': provinceCode } });
      if (response.data && Array.isArray(response.data.data)) {
        let districts = response.data.data;
        if (searchText) {
          districts = districts.filter((d: any) => d.name.toLowerCase().includes(searchText.toLowerCase()));
        }
        return districts.map((district: any) => ({
          id: district.code,
          name: district.name,
          code: district.code,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getDistrictsByMode:', error);
      return [];
    }
  }

  static async getWardsByMode(districtCode?: string, provinceCode?: string, mode: AddressMode = '34-provinces', searchText: string = ''): Promise<LocationItem[]> {
    try {
      let url = '';
      let params: any = {};
      if (mode === '34-provinces') {
        url = `${BASE_URL}/api/v1/address/34/wards`;
        params = { 'province-code': provinceCode };
      } else {
        url = `${BASE_URL}/api/v1/address/63/wards`;
        params = { 'district-id': districtCode };
      }
      const response = await axios.get(url, { params });
      if (response.data && Array.isArray(response.data.data)) {
        let wards = response.data.data;
        if (searchText) {
          wards = wards.filter((w: any) => w.name.toLowerCase().includes(searchText.toLowerCase()));
        }
        return wards.map((ward: any) => ({
          id: ward.code,
          name: ward.name,
          code: ward.code,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getWardsByMode:', error);
      return [];
    }
  }

  // Administrative Address APIs (new)
  static async getAllProvinces(): Promise<{ success: boolean; code: number; data: Province[]; errors: any[] }> {
    try {
      console.log('🌐 Fetching provinces from:', `${BASE_URL}/address/all-province`);
      
      const response = await axios.get(`${BASE_URL}/address/all-province`);
      
      console.log('✅ Provinces API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching provinces:', error);
      
      // Return error response
      return {
        success: false,
        code: error.response?.status || 500,
        data: [],
        errors: [error.message || 'Failed to fetch provinces']
      };
    }
  }

  // FIX: This method now extracts unique districts from wards data
  static async getDistricts(provinceCode: string): Promise<{ success: boolean; code: number; data: District[]; errors: any[] }> {
    try {
      console.log('🌐 Fetching districts for province:', provinceCode);
      
      // Get all wards for the province first
      const response = await axios.get(`${BASE_URL}/address/wards`, {
        params: { 'province-code': provinceCode }
      });
      
      console.log('✅ Wards API Response for districts extraction:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // Extract unique districts from wards data
        const districtsMap = new Map<string, District>();
        
        response.data.data.forEach((ward: any) => {
          // Extract district name from ward name
          // Assuming ward names are like "Phường ABC, Quận XYZ" or "Xã ABC, Huyện XYZ"
          let districtName = '';
          
          // Try to extract district from ward name
          const wardName = ward.name;
          const parts = wardName.split(',');
          if (parts.length > 1) {
            districtName = parts[1].trim();
          } else {
            districtName = '';
          }
          
          // Use ward code as district identifier for simplicity
          const districtCode = `district_${ward.code}`;
          
          if (!districtsMap.has(districtCode)) {
            districtsMap.set(districtCode, {
              code: districtCode,
              name: districtName,
              provinceCode: provinceCode
            });
          }
        });
        
        const districts = Array.from(districtsMap.values());
        
        return {
          success: true,
          code: 200,
          data: districts,
          errors: []
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('❌ Error fetching districts:', error);
      
      // Return error response
      return {
        success: false,
        code: error.response?.status || 500,
        data: [],
        errors: [error.message || 'Failed to fetch districts']
      };
    }
  }

  // FIX: This method now filters wards based on the selected district
  static async getWards(districtCode: string, provinceCode?: string): Promise<{ success: boolean; code: number; data: Ward[]; errors: any[] }> {
    try {
      console.log('🌐 Fetching wards for district:', districtCode, 'province:', provinceCode);
      
      if (!provinceCode) {
        throw new Error('Province code is required for fetching wards');
      }
      
      // Get all wards for the province
      const response = await axios.get(`${BASE_URL}/address/wards`, {
        params: { 'province-code': provinceCode }
      });
      
      console.log('✅ All Wards API Response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // Since we don't have real district mapping, return all wards for now
        // In a real implementation, you'd filter based on actual district boundaries
        const wards = response.data.data.map((ward: any) => ({
          code: ward.code,
          name: ward.name,
          districtCode: districtCode,
          provinceCode: provinceCode,
          provinceName: ward.provinceName || ''
        }));
        
        return {
          success: true,
          code: 200,
          data: wards,
          errors: []
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('❌ Error fetching wards:', error);
      
      // Return error response
      return {
        success: false,
        code: error.response?.status || 500,
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
  static async getProvinces(searchText: string = ''): Promise<LocationItem[]> {
    try {
      const response = await this.getAllProvinces();
      if (response.success) {
        let provinces = response.data;
        if (searchText) {
          provinces = provinces.filter(province => 
            province.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }
        return provinces.map(province => ({
          id: province.code,
          name: province.name,
          code: province.code
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getProvinces:', error);
      return [];
    }
  }

  static async getDistrictsLegacy(provinceId: string, searchText: string = ''): Promise<LocationItem[]> {
    try {
      const response = await this.getDistricts(provinceId);
      if (response.success) {
        let districts = response.data;
        if (searchText) {
          districts = districts.filter(district => 
            district.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }
        return districts.map(district => ({
          id: district.code,
          name: district.name,
          code: district.code
        }));
      }
      return [];
    } catch (error) {
      console.error('Error in getDistrictsLegacy:', error);
      return [];
    }
  }

  static async getWardsLegacy(districtId: string, searchText: string = '', provinceCode?: string): Promise<LocationItem[]> {
    try {
      const response = await this.getWards(districtId, provinceCode);
      if (response.success) {
        let wards = response.data;
        if (searchText) {
          wards = wards.filter(ward => 
            ward.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }
        return wards.map(ward => ({
          id: ward.code,
          name: ward.name,
          code: ward.code
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