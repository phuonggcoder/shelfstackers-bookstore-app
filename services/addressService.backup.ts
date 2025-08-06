import axios from 'axios';

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

export interface Province {
  code: string;
  name: string;
}

// Merged province info for new 34-province API
export interface MergedProvince {
  code: string;
  name: string;
  isMerged: boolean;
  mergedWith: string[];
}



export interface Ward {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
}



// Interface for user addresses (different from administrative addresses)


export interface AddressData {
  province: Province;
  ward: Ward;
  fullAddress: string;
  addressCode: {
    provinceCode: string;
    wardCode: string;
  };
}

export interface UserAddress {
  _id: string;
  receiver_name: string;
  phone_number: string;
  email?: string;
  province: string;
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
  // Unified API for both modes
  // Get merged provinces (new API)
  // static async getProvincesMerged(searchText: string = ''): Promise<MergedProvince[]> {
  //   try {
  //     const response = await axios.get(`${BASE_URL}/api/address/provinces-merged`, {
  //       params: searchText ? { q: searchText } : {}
  //     });
  //     if (response.data && Array.isArray(response.data.data)) {
  //       return response.data.data.map((province: any) => ({
  //         code: province.code,
  //         name: province.name,
  //         isMerged: province.isMerged,
  //         mergedWith: province.mergedWith || []
  //       }));
  //     }
  //     return [];
  //   } catch (error) {
  //     console.error('Error in getProvincesMerged:', error);
  //     return [];
  //   }
  // }

  // Get wards by province code - 34 province API
  static async getWardsByProvince(provinceCode: string, searchText: string = ''): Promise<Ward[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/address/34/wards`, {
        params: {
          'province-code': provinceCode,
          ...(searchText ? { q: searchText } : {})
        }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error in getWardsByProvince:', error);
      return [];
    }
  }

  // Search address with 34 province API
  static async searchAddress(query: string): Promise<any[]> {
    if (!query || query.length < 2) return [];
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/address/34/search`, {
        params: { q: query }
      });
      return response.data?.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error in searchAddress:', error);
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