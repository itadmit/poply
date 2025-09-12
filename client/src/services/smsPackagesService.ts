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

export interface SmsPackageTemplate {
  id: string;
  name: string;
  amount: number;
  price: number;
  discount: number;
  isActive: boolean;
  isPopular: boolean;
  pricePerSms?: string;
  finalPrice?: string | number;
}

export interface PurchaseResponse {
  success: boolean;
  paymentLink?: string;
  orderId?: string;
  error?: string;
}

export interface PurchaseHistory {
  id: string;
  name: string;
  amount: number;
  price: number;
  purchasedAt: string;
  paymentTransactionId?: string;
}

export const smsPackagesService = {
  // קבלת חבילות זמינות
  getAvailablePackages: async (): Promise<SmsPackageTemplate[]> => {
    const response = await api.get('/sms-packages/available');
    return response.data;
  },

  // רכישת חבילה
  purchasePackage: async (packageId: string): Promise<PurchaseResponse> => {
    const response = await api.post('/sms-packages/purchase', { packageId });
    return response.data;
  },

  // קבלת היסטוריית רכישות
  getPurchaseHistory: async (): Promise<PurchaseHistory[]> => {
    const response = await api.get('/sms-packages/history');
    return response.data;
  },

  // בדיקת סטטוס הזמנה
  checkOrderStatus: async (orderId: string) => {
    const response = await api.get(`/sms-packages/order-status/${orderId}`);
    return response.data;
  },
};

export default smsPackagesService;
