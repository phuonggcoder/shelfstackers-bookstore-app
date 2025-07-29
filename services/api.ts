import axios from 'axios';
import { Book, Category } from '../types';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/api/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await response.json();
  return data.filter((cat: Category) => cat.isVisible);
};

export const getBooks = async (): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/api/books/all`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.books || [];
};

export const getBookById = async (id: string): Promise<Book> => {
  const response = await fetch(`${API_BASE_URL}/api/books/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch book');
  }
  return response.json();
};

export const getBooksByCategory = async (categoryId: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/api/books/category/${categoryId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch books by category');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.books || [];
};

// CART
export const getCart = async (token: string) => {
  console.log('getCart called with token:', token ? 'present' : 'missing');
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('getCart response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getCart error response:', errorText);
      throw new Error(`Failed to fetch cart: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('getCart success result:', result);
    return result;
  } catch (error) {
    console.error('getCart catch error:', error);
    throw error;
  }
};

export const addToCart = async (token: string, book_id: string, quantity: number) => {
  console.log('addToCart called with:', { book_id, quantity, token: token ? 'present' : 'missing' });
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ book_id, quantity }),
    });
    console.log('addToCart response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('addToCart error response:', errorText);
      throw new Error(`Failed to add to cart: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('addToCart success result:', result);
    return result;
  } catch (error) {
    console.error('addToCart catch error:', error);
    throw error;
  }
};

export const updateCartQuantity = async (token: string, book_id: string, quantity: number) => {
  console.log('updateCartQuantity called with:', { book_id, quantity, token: token ? 'present' : 'missing' });
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ book_id, quantity }),
    });
    console.log('updateCartQuantity response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('updateCartQuantity error response:', errorText);
      throw new Error(`Failed to update cart: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('updateCartQuantity success result:', result);
    return result;
  } catch (error) {
    console.error('updateCartQuantity catch error:', error);
    throw error;
  }
};

export const removeFromCart = async (token: string, book_id: string) => {
  console.log('removeFromCart called with:', { book_id, token: token ? 'present' : 'missing' });
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ book_id }),
    });
    console.log('removeFromCart response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('removeFromCart error response:', errorText);
      throw new Error(`Failed to remove from cart: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('removeFromCart success result:', result);
    return result;
  } catch (error) {
    console.error('removeFromCart catch error:', error);
    throw error;
  }
};

export const clearCart = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to clear cart');
  return response.json();
};

export const addToWishlist = async (token: string, bookId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/wishlist/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error('addToWishlist error:', response.status, text);
    throw new Error('Failed to add to wishlist: ' + text);
  }
  return response.json();
};

export const removeFromWishlist = async (token: string, bookId: string) => {
  console.log('removeFromWishlist called with:', { bookId, token: token ? 'present' : 'missing' });
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/remove/${bookId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('removeFromWishlist response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('removeFromWishlist error response:', errorText);
      throw new Error(`Failed to remove from wishlist: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('removeFromWishlist success result:', result);
    return result;
  } catch (error) {
    console.error('removeFromWishlist catch error:', error);
    throw error;
  }
};

export const getWishlist = async (token: string): Promise<any[]> => {
  console.log('getWishlist called with token:', token ? 'present' : 'missing');
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('getWishlist response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getWishlist error response:', errorText);
      throw new Error(`Failed to fetch wishlist: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('getWishlist success result:', result);
    // Chuẩn hóa dữ liệu trả về: lấy books[].book
    if (result.success && result.data && Array.isArray(result.data.books)) {
      const books = result.data.books.map((item: any) => item.book).filter(Boolean);
      return books;
    } else if (Array.isArray(result)) {
      return result;
    } else if (result.books) {
      return result.books;
    } else if (result.wishlist) {
      return result.wishlist;
    } else {
      return [];
    }
  } catch (error) {
    console.error('getWishlist catch error:', error);
    throw error;
  }
};

const api = {
  auth: {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to login');
      }
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to register');
      }
    }
  },

  // ORDER
  createOrder: async (token: string, orderData: { address_id: string; payment_method: string; voucher_id?: string }) => {
    console.log('createOrder called with:', orderData);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      console.log('createOrder response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('createOrder error response:', errorText);
        throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log('createOrder success result:', result);
      return result;
    } catch (error) {
      console.error('createOrder catch error:', error);
      throw error;
    }
  },

  getMyOrders: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  getOrderDetail: async (token: string, orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch order detail');
    return response.json();
  },

  cancelOrder: async (token: string, orderId: string, cancellation_reason: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cancellation_reason }),
    });
    if (!response.ok) throw new Error('Failed to cancel order');
    return response.json();
  },

  // PAYMENT
  createPayment: async (token: string, orderId: string, payment_method: string, amount: number, currency: string, notes: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ payment_method, amount, currency, notes }),
    });
    if (!response.ok) throw new Error('Failed to create payment');
    return response.json();
  },

  getPayment: async (token: string, orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch payment');
    return response.json();
  },

  // Thêm các hàm này vào object export default
  getBooks,
  getCategories,

  // Campaign APIs
  getCampaigns: async () => {
    try {
      console.log('Fetching campaigns from:', `${API_BASE_URL}/api/campaigns`);
      const response = await axios.get(`${API_BASE_URL}/api/campaigns`);
      console.log('Campaigns response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  getCampaignById: async (id: string) => {
    try {
      console.log('Fetching campaign by ID:', id, 'from:', `${API_BASE_URL}/api/campaigns/${id}`);
      const response = await axios.get(`${API_BASE_URL}/api/campaigns/${id}`);
      console.log('Campaign by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign by ID:', error);
      throw error;
    }
  },

  getCampaignBooks: async (id: string) => {
    try {
      console.log('Fetching campaign books for ID:', id, 'from:', `${API_BASE_URL}/api/campaigns/${id}/books`);
      const response = await axios.get(`${API_BASE_URL}/api/campaigns/${id}/books`);
      console.log('Campaign books response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign books:', error);
      // Return empty array instead of throwing error for better UX
      console.log('Returning empty array for campaign books due to error');
      return [];
    }
  },
};

export default api;