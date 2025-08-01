export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  full_name: string;
  phone_number?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
    full_name: string;
    phone_number?: string;
    roles: string[];
  }
}

export interface ErrorResponse {
  message: string;
  status: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  roles: string[];
  avatar?: string;
  gender?: string;
  birthday?: string;
}
