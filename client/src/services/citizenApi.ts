import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

export const citizenApi = {
  getDashboardSummary: async () => {
    const res = await apiClient.get('/citizen/dashboard/summary');
    return res.data;
  },
  getRequests: async (filters?: any) => {
    const res = await apiClient.get('/citizen/requests', { params: filters });
    return res.data;
  },
  submitRequest: async (data: any) => {
    const res = await apiClient.post('/citizen/requests', data);
    return res.data;
  },
  getRequestDetails: async (id: string | number) => {
    const res = await apiClient.get(`/citizen/requests/${id}`);
    return res.data;
  },
  reopenRequest: async (id: string | number, reason: string) => {
    const res = await apiClient.patch(`/citizen/requests/${id}/reopen`, { reason });
    return res.data;
  },
  submitFeedback: async (id: string | number, data: any) => {
    const res = await apiClient.post(`/citizen/requests/${id}/feedback`, data);
    return res.data;
  },
  getNotifications: async () => {
    const res = await apiClient.get('/citizen/notifications');
    return res.data;
  },
  markNotificationAsRead: async (id: number | string) => {
    const res = await apiClient.patch(`/citizen/notifications/${id}/read`);
    return res.data;
  },
  markAllNotificationsAsRead: async () => {
    const res = await apiClient.patch('/citizen/notifications/read-all');
    return res.data;
  },
  get: async (url: string) => {
    const res = await apiClient.get(`/citizen${url}`);
    return res.data;
  },
  getProfile: async () => {
    const res = await apiClient.get('/citizen/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.put('/citizen/profile', data);
    return res.data;
  },
  // Messages API
  getConversations: async () => {
    const res = await apiClient.get('/messages/conversations');
    return res.data;
  },
  getConversationMessages: async (entityType: string, entityId: number | string) => {
    const res = await apiClient.get(`/messages/${entityType}/${entityId}`);
    return res.data;
  },
  sendMessage: async (entityType: string, entityId: number | string, message: string, attachmentUrl?: string) => {
    const res = await apiClient.post(`/messages/${entityType}/${entityId}`, {
      message,
      attachment_url: attachmentUrl
    });
    return res.data;
  },
  markConversationAsRead: async (entityType: string, entityId: number | string) => {
    const res = await apiClient.patch(`/messages/${entityType}/${entityId}/read`);
    return res.data;
  },
  getUnreadMessageCount: async () => {
    const res = await apiClient.get('/messages/unread-count');
    return res.data;
  },
  uploadMessageAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  verifyRequest: async (id: string | number, status: string, feedback?: string) => {
    const res = await apiClient.post(`/citizen-requests/${id}/verify`, { status, feedback });
    return res.data;
  },
  // Settings API
  getSettings: async () => {
    const res = await apiClient.get('/citizen/settings');
    return res.data;
  },
  updateSettings: async (preferences: any) => {
    const res = await apiClient.put('/citizen/settings', preferences);
    return res.data;
  },
  changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    const res = await apiClient.post('/citizen/change-password', data);
    return res.data;
  },
  deleteAccount: async (data: { password: string; confirmation: string }) => {
    const res = await apiClient.post('/citizen/delete-account', data);
    return res.data;
  }
};


