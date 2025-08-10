import axios from 'axios';

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

export interface Province {
  code: string;
  name: string;
}

export interface Ward {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
}

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
  // Core API methods for 34-province system
  static async getProvinces(searchText: string = ''): Promise<Province[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/address/34/provinces`, {
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
    } catch (error) {
      console.error('Error in getProvinces:', error);
      throw error;
    }
  }

  static async getWards(provinceCode: string): Promise<Ward[]> {
    try {
      const response = await axios.get(`${BASE_URL}/address/wards`, {
        params: { 'province-code': provinceCode }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching wards:', error);
      return [];
    }
  }

  static async searchAddress(query: string): Promise<any[]> {
    if (!query || query.length < 2) return [];
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/address/34/search`, {
        params: { q: query }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error in searchAddress:', error);
      return [];
    }
  }



  // User Address Management APIs
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
