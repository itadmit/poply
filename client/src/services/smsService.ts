import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// SMS Service
export const smsService = {
  // שליחת SMS בודד
  sendSms: async (data: {
    recipient: string;
    content: string;
    sender?: string;
    contactId?: string;
  }) => {
    const response = await api.post('/sms/send', data);
    return response.data;
  },

  // שליחת SMS לקמפיין
  sendCampaignSms: async (data: {
    campaignId?: string;
    recipients: Array<{ phone: string; contactId?: string }>;
    content: string;
    sender?: string;
  }) => {
    const response = await api.post('/sms/send-campaign', data);
    return response.data;
  },

  // קבלת היסטוריית SMS
  getSmsHistory: async (filters?: {
    status?: string;
    campaignId?: string;
    from?: string;
    to?: string;
  }) => {
    const response = await api.get('/sms/history', { params: filters });
    return response.data;
  },

  // קבלת סטטיסטיקות SMS
  getSmsStats: async () => {
    const response = await api.get('/sms/stats');
    return response.data;
  },

  // קבלת יתרת SMS
  getSmsBalance: async () => {
    const response = await api.get('/sms/balance');
    return response.data;
  },

  // הוספת חבילת SMS (אדמין)
  addSmsPackage: async (data: {
    userId: string;
    name: string;
    amount: number;
    price: number;
  }) => {
    const response = await api.post('/sms/packages', data);
    return response.data;
  },

  // קבלת חבילות SMS
  getSmsPackages: async () => {
    const response = await api.get('/sms/packages');
    return response.data;
  },

  // עדכון הגדרות SMS
  updateSmsSettings: async (data: {
    smsSenderName?: string;
  }) => {
    const response = await api.put('/sms/settings', data);
    return response.data;
  },

  // יצירת API key
  createApiKey: async (name: string) => {
    const response = await api.post('/sms/api-keys', { name });
    return response.data;
  },

  // קבלת API keys
  getApiKeys: async () => {
    const response = await api.get('/sms/api-keys');
    return response.data;
  },

  // מחיקת API key
  deleteApiKey: async (id: string) => {
    const response = await api.delete(`/sms/api-keys/${id}`);
    return response.data;
  },

  // בדיקת יתרה בספק (אדמין)
  checkProviderBalance: async () => {
    const response = await api.get('/sms/check-provider-balance');
    return response.data;
  },

  // קבלת הגדרות SMS
  getSmsSettings: async () => {
    const response = await api.get('/sms/settings');
    return response.data;
  },

  // עדכון הגדרות SMS
  updateSmsSettings: async (settings: { senderName: string }) => {
    const response = await api.post('/sms/settings', settings);
    return response.data;
  },
};

export default smsService;
