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
  }
};

export default api;