import axios from 'axios';
import { Book, Category } from '../types';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const API_BASE_URL = 'https://server-shelf-stacker.onrender.com';

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
  return response.json();
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
  return response.json();
};

// CART
export const getCart = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch cart');
  return response.json();
};

export const addToCart = async (token: string, book_id: string, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ book_id, quantity }),
  });
  if (!response.ok) throw new Error('Failed to add to cart');
  return response.json();
};

export const updateCartQuantity = async (token: string, book_id: string, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ book_id, quantity }),
  });
  if (!response.ok) throw new Error('Failed to update cart');
  return response.json();
};

export const removeFromCart = async (token: string, book_id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ book_id }),
  });
  if (!response.ok) throw new Error('Failed to remove from cart');
  return response.json();
};

export const clearCart = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to clear cart');
  return response.json();
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
  createOrder: async (token: string, address_id: string, voucher_id?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address_id, voucher_id }),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
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

  // ADDRESS
  addAddress: async (token: string, address: any) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    if (!response.ok) throw new Error('Failed to add address');
    return response.json();
  },

  getAddresses: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch addresses');
    return response.json();
  },

  updateAddress: async (token: string, addressId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update address');
    return response.json();
  },

  deleteAddress: async (token: string, addressId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete address');
    return response.json();
  },

  // ADDRESS AUTOCOMPLETE
  autocompleteProvince: async (q: string) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses/autocomplete/province?q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error('Failed to autocomplete province');
    return response.json();
  },
  autocompleteDistrict: async (province_code: string, q: string) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses/autocomplete/district?province_code=${province_code}&q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error('Failed to autocomplete district');
    return response.json();
  },
  autocompleteWard: async (district_code: string, q: string) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses/autocomplete/ward?district_code=${district_code}&q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error('Failed to autocomplete ward');
    return response.json();
  },
  autocompleteStreet: async (q: string) => {
    const response = await fetch(`${API_BASE_URL}/api/addresses/autocomplete/street?q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error('Failed to autocomplete street');
    return response.json();
  },
};

export default api;