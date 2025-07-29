import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const API_URL = 'https://server-shelf-stacker-w1ds.onrender.com/auth';
const USER_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api/users';

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
      roles: serverResponse.user.roles || ['user'],
      gender: serverResponse.user.gender,
      avatar: serverResponse.user.avatar,
      birthday: serverResponse.user.birthday,
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

  updateUser: async (updateData: any): Promise<any> => {
    const token = await AsyncStorage.getItem('token');
    const userId = updateData._id || updateData.userId;
    if (!userId) throw new Error('Thiếu userId');
    const response = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/api/auth/update/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    console.log('Status code:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log('🔧 updateUser: Không parse được JSON:', text.slice(0, 100));
      throw new Error('Update user failed: Invalid JSON');
    }
    console.log('🔧 updateUser: response data:', data);
    if (data.user) return data.user;
    if (data.success) return data;
    throw new Error(data.message || 'Update user failed');
  },

  // Upload avatar file lên server, trả về user object đã cập nhật
  uploadUserAvatar: async (userId: string, uri: string, token: string): Promise<any> => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/user-upload/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log('🔧 uploadUserAvatar: Không parse được JSON:', text.slice(0, 100));
      throw new Error('Upload avatar failed: Invalid JSON');
    }
    if (!response.ok || !data.user) throw new Error('Upload avatar failed');
    // Trả về user object đã cập nhật
    return data.user;
  },

  // Lấy thông tin user hiện tại dựa trên token
  getMe: async (token: string): Promise<any> => {
    if (!token) throw new Error('Missing token');
    const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to fetch user info');
    }

    
  },
  changePassword: async (currentPassword: string, newPassword: string, token: string): Promise<string> => {
    try {
      const response = await axios.put(`${USER_URL}/change-password`, {
        currentPassword,
        newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.message || 'Password changed successfully';
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Password change failed');
    }
  }

  
};
