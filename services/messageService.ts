import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Types
export interface Conversation {
  conversationId: string;
  participants: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
  }>;
  ticket: {
    subject: string;
    category: string;
    priority: string;
    status: string;
    orderId?: string;
    description: string;
  };
  metadata: {
    messageCount: number;
    lastMessageAt: string;
    lastMessageBy: string;
    assignedTo?: string;
    tags: string[];
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  content: string;
  type: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  status: string;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  subject: string;
  category: 'general' | 'order' | 'payment' | 'technical' | 'refund' | 'other';
  description: string;
  orderId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  conversation: Conversation;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConversationResponse {
  success: boolean;
  conversation: Conversation;
}

export interface MessageResponse {
  success: boolean;
  message: Message;
}

class MessageService {
  private baseUrl = `${API_BASE_URL}/api/messages`;

  // Tạo conversation mới
  async createConversation(data: CreateConversationRequest): Promise<ConversationResponse> {
    try {
      console.log('🔧 Creating conversation:', data);
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log('✅ Create conversation response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create conversation');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Create conversation error:', error);
      throw new Error(error.message || 'Không thể tạo cuộc trò chuyện');
    }
  }

  // Lấy danh sách conversations
  async getConversations(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  } = {}): Promise<ConversationsResponse> {
    try {
      console.log('🔧 Getting conversations with params:', params);
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      
      const url = `${this.baseUrl}/conversations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      console.log('✅ Get conversations response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get conversations');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Get conversations error:', error);
      throw new Error(error.message || 'Không thể lấy danh sách cuộc trò chuyện');
    }
  }

  // Lấy chi tiết conversation và messages
  async getConversationWithMessages(
    conversationId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<MessagesResponse> {
    try {
      console.log('🔧 Getting conversation with messages:', { conversationId, params });
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `${this.baseUrl}/conversations/${conversationId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      console.log('✅ Get conversation with messages response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get conversation');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Get conversation with messages error:', error);
      throw new Error(error.message || 'Không thể lấy chi tiết cuộc trò chuyện');
    }
  }

  // Gửi tin nhắn
  async sendMessage(
    conversationId: string,
    data: SendMessageRequest
  ): Promise<MessageResponse> {
    try {
      console.log('🔧 Sending message:', { conversationId, data });
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log('✅ Send message response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      throw new Error(error.message || 'Không thể gửi tin nhắn');
    }
  }

  // Đánh dấu tin nhắn đã đọc
  async markMessageAsRead(messageId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Marking message as read:', messageId);
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      console.log('✅ Mark message as read response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark message as read');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Mark message as read error:', error);
      throw new Error(error.message || 'Không thể đánh dấu tin nhắn đã đọc');
    }
  }

  // Cập nhật trạng thái conversation (chỉ cho admin/support)
  async updateConversationStatus(
    conversationId: string,
    status: string
  ): Promise<ConversationResponse> {
    try {
      console.log('🔧 Updating conversation status:', { conversationId, status });
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/admin/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      
      const result = await response.json();
      console.log('✅ Update conversation status response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update conversation status');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Update conversation status error:', error);
      throw new Error(error.message || 'Không thể cập nhật trạng thái cuộc trò chuyện');
    }
  }

  // Phân công conversation (chỉ cho admin)
  async assignConversation(
    conversationId: string,
    assignedTo: string
  ): Promise<ConversationResponse> {
    try {
      console.log('🔧 Assigning conversation:', { conversationId, assignedTo });
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/admin/conversations/${conversationId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedTo }),
      });
      
      const result = await response.json();
      console.log('✅ Assign conversation response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to assign conversation');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Assign conversation error:', error);
      throw new Error(error.message || 'Không thể phân công cuộc trò chuyện');
    }
  }

  // Lấy tất cả conversations (admin view)
  async getAllConversations(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
  } = {}): Promise<ConversationsResponse> {
    try {
      console.log('🔧 Getting all conversations (admin):', params);
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);
      
      const url = `${this.baseUrl}/admin/conversations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      console.log('✅ Get all conversations response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get all conversations');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Get all conversations error:', error);
      throw new Error(error.message || 'Không thể lấy tất cả cuộc trò chuyện');
    }
  }

  // Lấy thống kê support (admin)
  async getSupportStats(): Promise<{
    success: boolean;
    stats: {
      totalConversations: number;
      openConversations: number;
      resolvedConversations: number;
      averageResponseTime: number;
      conversationsByCategory: Record<string, number>;
      conversationsByPriority: Record<string, number>;
    };
  }> {
    try {
      console.log('🔧 Getting support stats');
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseUrl}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      console.log('✅ Get support stats response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get support stats');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Get support stats error:', error);
      throw new Error(error.message || 'Không thể lấy thống kê hỗ trợ');
    }
  }

  // Upload file đính kèm
  async uploadAttachment(file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  }): Promise<{
    success: boolean;
    url: string;
    filename: string;
  }> {
    try {
      console.log('🔧 Uploading attachment:', file);
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const result = await response.json();
      console.log('✅ Upload attachment response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload attachment');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Upload attachment error:', error);
      throw new Error(error.message || 'Không thể tải lên file đính kèm');
    }
  }

  // Helper methods
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }
}

export default new MessageService();
