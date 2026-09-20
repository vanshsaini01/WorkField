import api from './api';
import { AuthResponse, User } from '../types';

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: 'worker' | 'employer';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', payload);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  async switchRole(role: 'worker' | 'employer'): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/switch-role', { role });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
  }
};