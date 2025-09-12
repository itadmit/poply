import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const reportsService = {
  // Get overview statistics
  async getOverview(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/reports/overview?${params.toString()}`);
    return response.data;
  },

  // Get email performance data
  async getEmailPerformance(startDate?: string, endDate?: string, groupBy: string = 'month') {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('groupBy', groupBy);
    
    const response = await api.get(`/reports/email-performance?${params.toString()}`);
    return response.data;
  },

  // Get campaign performance
  async getCampaignPerformance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/reports/campaign-performance?${params.toString()}`);
    return response.data;
  },

  // Get contact growth data
  async getContactGrowth(startDate?: string, endDate?: string, groupBy: string = 'month') {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('groupBy', groupBy);
    
    const response = await api.get(`/reports/contact-growth?${params.toString()}`);
    return response.data;
  },

  // Get revenue by source
  async getRevenueBySource(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/reports/revenue-by-source?${params.toString()}`);
    return response.data;
  },

  // Get top products
  async getTopProducts(startDate?: string, endDate?: string, limit: number = 10) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit.toString());
    
    const response = await api.get(`/reports/top-products?${params.toString()}`);
    return response.data;
  },

  // Get hourly activity
  async getHourlyActivity(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/reports/hourly-activity?${params.toString()}`);
    return response.data;
  },

  // Export report data
  async exportReport(reportType: string, format: string = 'csv', startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    params.append('type', reportType);
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/reports/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
