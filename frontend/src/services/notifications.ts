import { api } from './api';
import type { Notification } from '../types';

export async function listNotifications(): Promise<Notification[]> {
  const res = await api.get<{ items: Notification[] }>('/notifications');
  return res.data.items;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const res = await api.patch<{ notification: Notification }>(`/notifications/${id}/read`);
  return res.data.notification;
}
