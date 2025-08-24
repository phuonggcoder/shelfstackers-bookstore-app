// config/api.ts
export const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com'; // Đổi sang local khi test: 'http://localhost:3000'

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://server-shelf-stacker-w1ds.onrender.com',
  
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
  
  // Email Verification
  SEND_OTP: '/api/email-verification/send-otp',
  VERIFY_OTP: '/api/email-verification/verify-otp',
  RESEND_OTP: '/api/email-verification/resend-otp',
  VERIFICATION_STATUS: '/api/email-verification/verification-status',
  
  // User Management
  GET_VERIFICATION_METHODS: '/api/users/get-verification-methods',
  FORGOT_PASSWORD: '/api/users/forgot-password',
  VERIFY_SMS_OTP: '/api/users/verify-sms-otp',
  RESET_PASSWORD: '/api/users/reset-password',
  SEND_EMAIL_CHANGE_OTP: '/api/users/send-email-change-otp',
  CHANGE_EMAIL: '/api/users/change-email',
  
  // Messaging
  CONVERSATIONS: '/api/messages/conversations',
  CONVERSATION_DETAILS: (id: string) => `/api/messages/conversations/${id}`,
  SEND_MESSAGE: (conversationId: string) => `/api/messages/conversations/${conversationId}/messages`,
  MARK_MESSAGE_READ: (messageId: string) => `/api/messages/messages/${messageId}/read`,
  UPLOAD_ATTACHMENT: '/api/messages/upload',
  
  // Admin Messaging
  ADMIN_CONVERSATIONS: '/api/messages/admin/conversations',
  ADMIN_CONVERSATION_STATUS: (id: string) => `/api/messages/admin/conversations/${id}/status`,
  ADMIN_CONVERSATION_ASSIGN: (id: string) => `/api/messages/admin/conversations/${id}/assign`,
  ADMIN_STATS: '/api/messages/admin/stats',
  
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

// Helper function to get multipart headers for file upload
export const getMultipartHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'multipart/form-data'
}); 