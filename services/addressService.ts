import axios from 'axios';

const API_BASE_URL = 'https://server-shelf-stacker.onrender.com/api';

export type LocationItem = {
  id: string;
  name: string;
  type?: number;
  typeText?: string;
  slug?: string;
  provinceId?: string;
  districtId?: string;
};

export type AddressData = {
  receiver_name: string;
  phone_number: string;
  email?: string;
  province: string;
  district: string;
  ward: string;
  street?: string;
  address_detail: string;
  note?: string;
  is_default: boolean;
  type?: 'office' | 'home';
};

// Autocomplete APIs với open.oapi.vn
export const getProvinces = async (search?: string, page = 0, size = 30): Promise<LocationItem[]> => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const url = `${API_BASE_URL}/addresses/autocomplete/province?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

export const getDistricts = async (provinceId: string, search?: string, page = 0, size = 30): Promise<LocationItem[]> => {
  try {
    if (!provinceId) return [];
    
    const params = new URLSearchParams();
    params.append('provinceId', provinceId);
    if (search) params.append('q', search);
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const url = `${API_BASE_URL}/addresses/autocomplete/district?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
};

export const getWards = async (districtId: string, search?: string, page = 0, size = 30): Promise<LocationItem[]> => {
  try {
    if (!districtId) return [];
    
    const params = new URLSearchParams();
    params.append('districtId', districtId);
    if (search) params.append('q', search);
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const url = `${API_BASE_URL}/addresses/autocomplete/ward?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching wards:', error);
    return [];
  }
};

export const getStreets = async (search?: string): Promise<LocationItem[]> => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    
    const url = `${API_BASE_URL}/addresses/autocomplete/street?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching streets:', error);
    return [];
  }
};

// Address CRUD APIs
export const createAddress = async (token: string, addressData: AddressData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/addresses`, addressData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
};

export const getAddresses = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/addresses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Đảm bảo luôn trả về array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.addresses)) {
      return data.addresses;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.log('getAddresses: No valid array found in response:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return []; // Trả về array rỗng thay vì throw error
  }
};

export const updateAddress = async (token: string, addressId: string, addressData: Partial<AddressData>) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/addresses/${addressId}`, addressData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

export const deleteAddress = async (token: string, addressId: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/addresses/${addressId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
}; 