import { api } from './api';
import type { AdminRentalSummary, Component, PaginatedResult, Report, User } from '../types';

export async function adminLogin(email: string, password: string): Promise<User> {
  const res = await api.post<{ user: User }>('/admin/auth/login', { email, password });
  return res.data.user;
}

export async function adminLogout(): Promise<void> {
  await api.post('/admin/auth/logout');
}

export async function fetchAdminMe(): Promise<User> {
  const res = await api.get<{ user: User }>('/admin/auth/me');
  return res.data.user;
}

export async function listAdminUsers(page = 1): Promise<PaginatedResult<User>> {
  const res = await api.get<PaginatedResult<User>>('/admin/users', { params: { page } });
  return res.data;
}

export async function setUserDisabled(id: string, isDisabled: boolean): Promise<User> {
  const res = await api.patch<{ user: User }>(`/admin/users/${id}`, { isDisabled });
  return res.data.user;
}

export async function listAdminComponents(page = 1): Promise<PaginatedResult<Component>> {
  const res = await api.get<PaginatedResult<Component>>('/admin/components', { params: { page } });
  return res.data;
}

export async function setComponentActive(id: string, isActive: boolean): Promise<Component> {
  const res = await api.patch<{ component: Component }>(`/admin/components/${id}`, { isActive });
  return res.data.component;
}

export async function listAdminRentals(page = 1): Promise<PaginatedResult<AdminRentalSummary>> {
  const res = await api.get<PaginatedResult<AdminRentalSummary>>('/admin/rentals', { params: { page } });
  return res.data;
}

export async function listAdminReports(page = 1): Promise<PaginatedResult<Report>> {
  const res = await api.get<PaginatedResult<Report>>('/admin/reports', { params: { page } });
  return res.data;
}
