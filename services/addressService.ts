import axios from 'axios';

const API_BASE_URL = 'https://server-shelf-stacker.onrender.com/api/addresses';

export type LocationItem = {
  code: string;
  name: string;
};

export type AddressData = {
  receiver_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  address_detail: string;
  is_default: boolean;
  type: 'office' | 'home';
};

// Autocomplete APIs
export const getProvinces = async (search?: string): Promise<LocationItem[]> => {
  try {
    const url = search 
      ? `${API_BASE_URL}/autocomplete/province?q=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/autocomplete/province`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

export const getDistricts = async (provinceCode: string, search?: string): Promise<LocationItem[]> => {
  try {
    const url = search 
      ? `${API_BASE_URL}/autocomplete/district?province_code=${provinceCode}&q=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/autocomplete/district?province_code=${provinceCode}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

export const getWards = async (districtCode: string, search?: string): Promise<LocationItem[]> => {
  try {
    const url = search 
      ? `${API_BASE_URL}/autocomplete/ward?district_code=${districtCode}&q=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/autocomplete/ward?district_code=${districtCode}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw error;
  }
};

export const getStreets = async (search?: string): Promise<LocationItem[]> => {
  try {
    const url = search 
      ? `${API_BASE_URL}/autocomplete/street?q=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/autocomplete/street`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching streets:', error);
    throw error;
  }
};

// Address CRUD APIs
export const createAddress = async (token: string, addressData: AddressData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}`, addressData, {
      headers: {
        Authorization: `Bearer ${token}`,
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
    const response = await axios.get(`${API_BASE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
};

export const updateAddress = async (token: string, addressId: string, addressData: Partial<AddressData>) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${addressId}`, addressData, {
      headers: {
        Authorization: `Bearer ${token}`,
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
    const response = await axios.delete(`${API_BASE_URL}/${addressId}`, {
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