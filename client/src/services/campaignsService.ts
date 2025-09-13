const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  contacts?: CampaignContact[];
  _count?: {
    contacts: number;
  };
  stats?: CampaignStats;
}

export interface CampaignContact {
  id: string;
  campaignId: string;
  contactId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  contact: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface CampaignStats {
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

export interface CreateCampaignData {
  name: string;
  subject: string;
  content: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  scheduledAt?: string;
}

export interface UpdateCampaignData {
  name?: string;
  subject?: string;
  content?: string;
  type?: 'EMAIL' | 'SMS' | 'PUSH';
  scheduledAt?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SendCampaignData {
  contactIds?: string[];
  segmentIds?: string[];
  sendToAll?: boolean;
}

class CampaignsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getCampaigns(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<CampaignsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/campaigns?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    return response.json();
  }

  async getCampaign(id: string): Promise<Campaign> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign');
    }

    return response.json();
  }

  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create campaign');
    }

    return response.json();
  }

  async updateCampaign(id: string, data: UpdateCampaignData): Promise<Campaign> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update campaign');
    }

    return response.json();
  }

  async deleteCampaign(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete campaign');
    }
  }

  async sendCampaign(id: string, data: SendCampaignData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}/send`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send campaign');
    }
  }

  async pauseCampaign(id: string): Promise<Campaign> {
    return this.updateCampaign(id, { status: 'DRAFT' });
  }

  async duplicateCampaign(id: string): Promise<Campaign> {
    const campaign = await this.getCampaign(id);
    
    const duplicateData: CreateCampaignData = {
      name: `${campaign.name} - עותק`,
      subject: campaign.subject,
      content: campaign.content,
      type: campaign.type,
    };

    return this.createCampaign(duplicateData);
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign stats');
    }

    return response.json();
  }

  async getOverallStats(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    averageOpenRate: number;
    averageClickRate: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/campaigns/stats/overview`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch overall stats');
    }

    return response.json();
  }
}

export const campaignsService = new CampaignsService(); 