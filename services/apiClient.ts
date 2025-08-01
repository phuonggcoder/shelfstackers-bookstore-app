import googleAuthService from './googleAuthService';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Lấy access token với auto-refresh
  private async getAccessToken(): Promise<string> {
    try {
      return await googleAuthService.getAccessToken();
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw new Error('Authentication required');
    }
  }

  // Thực hiện request với token
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Lấy access token
      const accessToken = await this.getAccessToken();
      
      // Thêm authorization header
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      };

      // Thực hiện request
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Xử lý 401 (Unauthorized) - token hết hạn
      if (response.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        
        try {
          const newAccessToken = await googleAuthService.refreshAccessToken();
          
          // Thử lại request với token mới
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newAccessToken}`,
            },
          });
          
          return retryResponse;
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Redirect to login hoặc clear tokens
          await googleAuthService.clearTokens();
          throw new Error('Authentication required');
        }
      }

      return response;
    } catch (error: any) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Upload file
  async uploadFile(endpoint: string, formData: FormData): Promise<Response> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Không set Content-Type cho FormData
        },
        body: formData,
      });

      if (response.status === 401) {
        console.log('🔄 Token expired during file upload, attempting refresh...');
        
        try {
          const newAccessToken = await googleAuthService.refreshAccessToken();
          
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
            },
            body: formData,
          });
          
          return retryResponse;
        } catch (refreshError) {
          console.error('❌ Token refresh failed during file upload:', refreshError);
          await googleAuthService.clearTokens();
          throw new Error('Authentication required');
        }
      }

      return response;
    } catch (error: any) {
      console.error('❌ File upload failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ApiClient();

// Export class for custom instances
export { ApiClient };
