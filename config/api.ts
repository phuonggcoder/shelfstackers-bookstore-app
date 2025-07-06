// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://server-shelf-stacker.onrender.com',
  
  // Authentication
  AUTH_TOKEN: 'your_user_jwt_token_here',
  ADMIN_TOKEN: 'your_admin_jwt_token_here',
  
  // Test IDs (for development)
  ORDER_ID: 'order_id_here',
  VOUCHER_ID: 'voucher_id_here',
  ADDRESS_ID: 'address_id_here',
  BOOK_ID: 'book_id_here',
  CART_ITEM_ID: 'cart_item_id_here',
  
  // Payment Methods
  PAYMENT_METHODS: {
    COD: 'COD',
    MOMO: 'MOMO',
    ZALOPAY: 'ZALOPAY',
    VNPAY: 'VNPAY',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CREDIT_CARD: 'CREDIT_CARD'
  },
  
  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded'
  },
  
  // Order Status
  ORDER_STATUS: {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Vouchers
  VOUCHERS_AVAILABLE: '/api/vouchers/available',
  VOUCHER_DETAILS: (id: string) => `/api/vouchers/${id}`,
  VALIDATE_VOUCHER: '/api/orders/validate-voucher',
  
  // Orders
  CREATE_ORDER: '/api/orders',
  GET_MY_ORDERS: '/api/orders/my',
  GET_ORDER_DETAILS: (id: string) => `/api/orders/${id}`,
  CANCEL_ORDER: (id: string) => `/api/orders/${id}/cancel`,
  UPDATE_ORDER_STATUS: (id: string) => `/api/orders/${id}/status`,
  
  // Payment
  GET_ORDER_PAYMENT: (id: string) => `/api/orders/${id}/payment`,
  UPDATE_PAYMENT_STATUS: (id: string) => `/api/orders/${id}/payment`,
  
  // Cart
  GET_CART: '/api/cart',
  ADD_TO_CART: '/api/cart/add',
  UPDATE_CART: '/api/cart/update',
  REMOVE_FROM_CART: '/api/cart/remove',
  CLEAR_CART: '/api/cart/clear',
  
  // Addresses
  GET_ADDRESSES: '/api/addresses',
  CREATE_ADDRESS: '/api/addresses',
  UPDATE_ADDRESS: (id: string) => `/api/addresses/${id}`,
  DELETE_ADDRESS: (id: string) => `/api/addresses/${id}`,
  
  // Books
  GET_BOOKS: '/api/books/all',
  GET_BOOK_BY_ID: (id: string) => `/api/books/${id}`,
  GET_BOOKS_BY_CATEGORY: (id: string) => `/api/books/category/${id}`,
  
  // Categories
  GET_CATEGORIES: '/api/categories',
  
  // Wishlist
  ADD_TO_WISHLIST: '/api/wishlist/add',
  REMOVE_FROM_WISHLIST: (id: string) => `/api/wishlist/remove/${id}`,
  
  // Address Autocomplete
  PROVINCES: '/api/addresses/provinces',
  DISTRICTS: (provinceId: string) => `/api/addresses/districts?provinceId=${provinceId}`,
  WARDS: (districtId: string) => `/api/addresses/wards?districtId=${districtId}`
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}); 