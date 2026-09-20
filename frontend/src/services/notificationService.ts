import api from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await api.get<NotificationItem[]>('/api/notifications/');
    return res.data;
  },

  async markAsRead(id: number): Promise<void> {
    await api.patch(`/api/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/api/notifications/mark-all-read');
  }
};

