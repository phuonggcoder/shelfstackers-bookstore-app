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
  districtCode: string;
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

class AddressService {
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

  static async getDistricts(provinceCode: string): Promise<{ success: boolean; code: number; data: District[]; errors: any[] }> {
    try {
      console.log('🌐 Fetching districts for province:', provinceCode);
      
      const response = await axios.get(`${BASE_URL}/address/districts`, {
        params: { 'provice-code': provinceCode }
      });
      
      console.log('✅ Districts API Response:', response.data);
      return response.data;
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

  static async getWards(districtCode: string, provinceCode?: string): Promise<{ success: boolean; code: number; data: Ward[]; errors: any[] }> {
    try {
      console.log('🌐 Fetching wards for district:', districtCode, 'province:', provinceCode);
      
      const params: any = { 'districts-code': districtCode };
      if (provinceCode) {
        params['province-code'] = provinceCode;
      }
      
      const response = await axios.get(`${BASE_URL}/address/wards`, {
        params
      });
      
      console.log('✅ Wards API Response:', response.data);
      return response.data;
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