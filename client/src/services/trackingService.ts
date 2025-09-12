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

export const trackingService = {
  // קבלת סטטיסטיקות קישור
  getLinkStats: async (shortLinkId: string) => {
    const response = await api.get(`/tracking/link/${shortLinkId}`);
    return response.data;
  },

  // קבלת סטטיסטיקות SMS
  getSmsStats: async (smsMessageId: string) => {
    const response = await api.get(`/tracking/sms/${smsMessageId}`);
    return response.data;
  },

  // קבלת סטטיסטיקות קמפיין
  getCampaignStats: async (campaignId: string) => {
    const response = await api.get(`/tracking/campaign/${campaignId}`);
    return response.data;
  },

  // קבלת פעילות איש קשר
  getContactActivity: async (contactId: string) => {
    const response = await api.get(`/tracking/contact/${contactId}`);
    return response.data;
  },

  // קבלת כל הקישורים המקוצרים
  getShortLinks: async (active: boolean = true) => {
    const response = await api.get('/tracking/links', { params: { active } });
    return response.data;
  },

  // יצירת דוח מעקב
  generateReport: async (params: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }) => {
    const response = await api.post('/tracking/report', params);
    return response.data;
  },
};

// סקריפט להטמעה באתר הלקוח
export const getTrackingScript = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `<script src="${baseUrl}/l/script.js" async></script>`;
};

export default trackingService;
