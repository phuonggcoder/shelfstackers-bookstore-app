import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const API_URL = 'https://server-shelf-stacker-w1ds.onrender.com/auth';
const USER_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api/users';

const mapUserResponse = (serverResponse: any): AuthResponse => {
  console.log('🔧 mapUserResponse - serverResponse:', JSON.stringify(serverResponse, null, 2));
  
  // Kiểm tra response có tồn tại không
  if (!serverResponse) {
    console.log('🔧 mapUserResponse - No response received');
    throw new Error('Không nhận được phản hồi từ server');
  }
  
  // Kiểm tra token (có thể là access_token hoặc token)
  const token = serverResponse.access_token || serverResponse.token;
  if (!token) {
    console.log('🔧 mapUserResponse - No token in response');
    console.log('🔧 mapUserResponse - Available keys:', Object.keys(serverResponse));
    throw new Error('Token không hợp lệ');
  }
  
  // Kiểm tra user object
  if (!serverResponse.user) {
    console.log('🔧 mapUserResponse - No user object in response');
    console.log('🔧 mapUserResponse - Available keys:', Object.keys(serverResponse));
    throw new Error('Thông tin người dùng không hợp lệ');
  }
  
  console.log('🔧 mapUserResponse - Valid response structure found');
  console.log('🔧 mapUserResponse - User keys:', Object.keys(serverResponse.user));

  // Check for different token field names
  const token2 = serverResponse.token || serverResponse.access_token;
  if (!token2) {
    throw new Error('No token found in server response');
  }

  // Map response từ server sang định dạng AuthResponse
  const mappedResponse = {
    token: token2,
    user: {
      _id: serverResponse.user._id || serverResponse.user.id, // Thử cả _id và id
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
  
  console.log('🔧 mapUserResponse - mapped response:', JSON.stringify(mappedResponse, null, 2));
  return mappedResponse;
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log('🔧 login - sending credentials:', { email: credentials.email, password: '***' });
      const response = await axios.post(`${API_URL}/login`, credentials);
      
      console.log('🔧 login - response status:', response.status);
      console.log('🔧 login - response data:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      return mapUserResponse(response.data);
    } catch (error: any) {
      console.log('🔧 login - error:', error);
      console.log('🔧 login - error.response:', error.response?.data);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng';
        throw new Error(errorMessage);
      } else if (error.response?.status === 401) {
        throw new Error('Tài khoản không được phép truy cập');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server, vui lòng thử lại sau');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Không thể kết nối đến server, vui lòng kiểm tra kết nối internet');
      } else {
        throw new Error(error.message || 'Đăng nhập thất bại');
      }
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
        email: data.email,
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

    const data = await response.json();
    return data;
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
  },

  // Hàm đăng nhập Google
  loginWithGoogle: async (idToken: string) => {
    try {
      console.log('🔧 Sending Google login request to:', `${USER_URL}/google-signin`);
      
      const response = await fetch(`${USER_URL}/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }),
      });

      console.log('�� Response status:', response.status);
      console.log('🔧 Response headers:', response.headers);

      // Kiểm tra status code
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔧 Server error response:', errorText.slice(0, 200));
        throw new Error(`Server error: ${response.status} - ${errorText.slice(0, 100)}`);
      }

      // Đọc response text trước
      const responseText = await response.text();
      console.log('🔧 Response text:', responseText.slice(0, 200));

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.log('🔧 JSON parse error. Response text:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.slice(0, 100)}`);
      }

      console.log('🔧 Parsed Google login response:', result);

      if (result.success && result.user) {
        // Lưu token vào AsyncStorage
        await AsyncStorage.setItem('token', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        
        return {
          success: true,
          user: result.user,
          token: result.token
        };
      } else {
        return {
          success: false,
          error: result.message || 'Đăng nhập Google thất bại'
        };
      }
    } catch (error: any) {
      console.log('�� Google login error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi đăng nhập Google'
      };
    }
  },

  // Kiểm tra trạng thái verification của user
  checkUserVerification: async (email: string): Promise<{ is_verified: boolean; user?: any }> => {
    try {
      console.log('🔧 checkUserVerification - checking email:', email);
      
      const response = await axios.get(`${USER_URL}/verification-status`, {
        params: { email }
      });
      
      console.log('🔧 checkUserVerification - response:', response.data);
      
      if (response.data.success) {
        return {
          is_verified: response.data.verification?.is_verified || false,
          user: response.data.verification
        };
      } else {
        throw new Error(response.data.message || 'Không thể kiểm tra trạng thái verification');
      }
    } catch (error: any) {
      console.log('🔧 checkUserVerification - error:', error);
      
      if (error.response?.status === 404) {
        // User không tồn tại, coi như chưa verified
        return { is_verified: false };
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Không thể kiểm tra trạng thái verification');
      }
    }
  }
};