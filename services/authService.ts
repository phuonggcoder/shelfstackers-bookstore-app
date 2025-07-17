import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const API_URL = 'https://server-shelf-stacker.onrender.com/auth';

const mapUserResponse = (serverResponse: any): AuthResponse => {
  if (!serverResponse || !serverResponse.token || !serverResponse.user) {
    throw new Error('Invalid response format from server');
  }

  // Map response từ server sang định dạng AuthResponse
  return {
    token: serverResponse.token,
    user: {
      _id: serverResponse.user.id, // Map id -> _id
      username: serverResponse.user.username,
      email: serverResponse.user.email,
      full_name: serverResponse.user.full_name || '',
      phone_number: serverResponse.user.phone_number,
      roles: serverResponse.user.roles || ['user']
    }
  };
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      return mapUserResponse(response.data);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/register`, data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Sau khi đăng ký thành công, thực hiện đăng nhập
      const loginResponse = await axios.post(`${API_URL}/login`, {
        username: data.username,
        password: data.password
      });

      return mapUserResponse(loginResponse.data);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Registration failed');
    }
  },

  validateToken: async (token: string): Promise<boolean> => {
    try {
      if (!token) return false;
      
      const response = await axios.get(`${API_URL}/validate-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },

  updateUser: async (userId: string, updateData: any, token: string): Promise<AuthResponse> => {
    try {
      const response = await axios.put(`${API_URL}/update/${userId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return mapUserResponse(response.data);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Update user failed');
    }
  }
};
