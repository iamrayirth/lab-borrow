import { api } from './api';
import type { User } from '../types';

export interface UpdateProfileInput {
  name?: string;
  college?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const res = await api.patch<{ user: User }>('/profile', input);
  return res.data.user;
}

export async function uploadProfileImage(file: File): Promise<User> {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ user: User }>('/profile/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.user;
}
