import api from './api';
import { MessageItem, ConversationItem } from '../types';

export interface SendMessagePayload {
  receiver_id: number;
  content: string;
  job_id?: number;
}

export const messageService = {
  async sendMessage(payload: SendMessagePayload): Promise<MessageItem> {
    const res = await api.post<MessageItem>('/api/messages/', payload);
    return res.data;
  },

  async getConversations(): Promise<ConversationItem[]> {
    const res = await api.get<ConversationItem[]>('/api/messages/conversations');
    return res.data;
  },

  async getChatHistory(otherUserId: number): Promise<MessageItem[]> {
    const res = await api.get<MessageItem[]>(`/api/messages/${otherUserId}`);
    return res.data;
  },

  async getUserInfo(userId: number): Promise<{ id: number; full_name: string; email: string; role: string }> {
    const res = await api.get<{ id: number; full_name: string; email: string; role: string }>(`/api/messages/user-info/${userId}`);
    return res.data;
  },

  async markAsRead(otherUserId: number): Promise<void> {
    await api.patch(`/api/messages/${otherUserId}/read`);
  }
};

