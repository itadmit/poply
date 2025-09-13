const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED';
  tags: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
  orders?: any[];
  events?: any[];
  campaigns?: any[];
  _count?: {
    orders: number;
    events: number;
    campaigns: number;
  };
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  unsubscribedContacts: number;
  bouncedContacts: number;
  recentContacts: number;
}

export interface CreateContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  source?: string;
}

export interface UpdateContactData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED';
}

class ContactsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getContacts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    tags?: string;
  }): Promise<ContactsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.tags) queryParams.append('tags', params.tags);

    const response = await fetch(`${API_BASE_URL}/api/contacts?${queryParams}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    return response.json();
  }

  async getContact(id: string): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contact');
    }

    return response.json();
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/api/contacts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create contact');
    }

    return response.json();
  }

  async updateContact(id: string, data: UpdateContactData): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update contact');
    }

    return response.json();
  }

  async deleteContact(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete contact');
    }
  }

  async importContacts(contacts: CreateContactData[]): Promise<{ message: string; count: number }> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/import`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ contacts })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import contacts');
    }

    return response.json();
  }

  async getContactStats(): Promise<ContactStats> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/stats/overview`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contact statistics');
    }

    return response.json();
  }
}

export const contactsService = new ContactsService(); 