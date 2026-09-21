import { api } from './api';
import type { User } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  college: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const res = await api.post<{ user: User }>('/auth/register', payload);
  return res.data.user;
}

export async function login(payload: LoginPayload): Promise<User> {
  const res = await api.post<{ user: User }>('/auth/login', payload);
  return res.data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ user: User }>('/auth/me');
  return res.data.user;
}
