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

export interface Popup {
  id: string;
  name: string;
  title: string;
  content: string;
  type: 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE' | 'PAGE_VIEWS' | 'CUSTOM';
  trigger: 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE' | 'PAGE_VIEWS' | 'CUSTOM';
  conditions: Record<string, any>;
  design: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count?: {
    events: number;
  };
  // שדות נוספים לתצוגה (יחושבו מהנתונים)
  shows?: number;
  conversions?: number;
  conversionRate?: number;
}

export interface PopupsResponse {
  popups: Popup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PopupStats {
  totalShows: number;
  totalCloses: number;
  conversionRate: number;
  recentEvents: Array<{
    id: string;
    type: string;
    createdAt: string;
    contact?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

export interface CreatePopupData {
  name: string;
  title: string;
  content: string;
  type: 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE' | 'PAGE_VIEWS' | 'CUSTOM';
  trigger: 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE' | 'PAGE_VIEWS' | 'CUSTOM';
  conditions: Record<string, any>;
  design: Record<string, any>;
}

export interface UpdatePopupData {
  name?: string;
  title?: string;
  content?: string;
  type?: 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE' | 'PAGE_VIEWS' | 'CUSTOM';
  trigger?: 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE' | 'PAGE_VIEWS' | 'CUSTOM';
  conditions?: Record<string, any>;
  design?: Record<string, any>;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

class PopupsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getPopups(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PopupsResponse> {
    const response = await api.get('/popups', { params });
    return response.data;
  }

  async getPopup(id: string): Promise<Popup> {
    const response = await api.get(`/popups/${id}`);
    return response.data;
  }

  async createPopup(data: CreatePopupData): Promise<Popup> {
    const response = await api.post('/popups', data);
    return response.data;
  }

  async updatePopup(id: string, data: UpdatePopupData): Promise<Popup> {
    const response = await api.put(`/popups/${id}`, data);
    return response.data;
  }

  async deletePopup(id: string): Promise<void> {
    await api.delete(`/popups/${id}`);
  }

  async togglePopupStatus(id: string): Promise<Popup> {
    const response = await api.patch(`/popups/${id}/toggle`);
    return response.data;
  }

  async getPopupStats(id: string): Promise<PopupStats> {
    const response = await api.get(`/popups/${id}/stats`);
    return response.data;
  }
}

export const popupsService = new PopupsService();
export default popupsService; 