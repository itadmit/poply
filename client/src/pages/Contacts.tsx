import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Upload,
  Mail,
  Phone,
  Building,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  Users,
  Loader2
} from 'lucide-react';
import { DataTable, ContactViewModal, ContactEditModal, ContactCreateModal } from '../components';
import { contactsService } from '../services/contactsService';
import type { Contact, ContactStats, CreateContactData, UpdateContactData } from '../services/contactsService';

// Removed static data - will be loaded from API

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  UNSUBSCRIBED: 'bg-red-100 text-red-800',
  BOUNCED: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'פעיל',
  INACTIVE: 'לא פעיל',
  UNSUBSCRIBED: 'ביטל הרשמה',
  BOUNCED: 'נדחה',
};

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadContacts();
    loadStats();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await contactsService.getContacts({
        limit: 100, // Load more contacts for better UX
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });
      setContacts(response.contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await contactsService.getContactStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Reload contacts when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadContacts();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedStatus]);

  const filteredContacts = contacts;

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleViewContact = async (contact: Contact) => {
    try {
      const fullContact = await contactsService.getContact(contact.id);
      setSelectedContact(fullContact);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error loading contact details:', error);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditModalOpen(true);
  };

  const handleCreateContact = () => {
    setCreateModalOpen(true);
  };

  const handleSaveContact = async (data: UpdateContactData) => {
    if (!selectedContact) return;
    
    try {
      setModalLoading(true);
      await contactsService.updateContact(selectedContact.id, data);
      await loadContacts();
      await loadStats();
      setEditModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateNewContact = async (data: CreateContactData) => {
    try {
      setModalLoading(true);
      await contactsService.createContact(data);
      await loadContacts();
      await loadStats();
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את איש הקשר?')) {
      return;
    }

    try {
      await contactsService.deleteContact(contactId);
      await loadContacts();
      await loadStats();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 ml-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">אנשי קשר</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {loading ? 'טוען...' : `${filteredContacts.length} אנשי קשר מתוך ${stats?.totalContacts || 0} סה"כ`}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCreateContact}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף איש קשר
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה"כ אנשי קשר</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {loading ? '...' : stats?.totalContacts || 0}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">אנשי קשר פעילים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {loading ? '...' : stats?.activeContacts || 0}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ביטלו הרשמה</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {loading ? '...' : stats?.unsubscribedContacts || 0}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">נדחו</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {loading ? '...' : stats?.bouncedContacts || 0}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="חיפוש אנשי קשר..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pr-10"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-input min-w-[200px]"
                >
                  <option value="all">כל הסטטוסים</option>
                  <option value="ACTIVE">פעיל</option>
                  <option value="INACTIVE">לא פעיל</option>
                  <option value="UNSUBSCRIBED">ביטל הרשמה</option>
                  <option value="BOUNCED">נדחה</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button className="btn btn-secondary flex items-center">
                  <Download className="h-4 w-4 ml-2" />
                  ייצא
                </button>
                <button className="btn btn-secondary flex items-center">
                  <Upload className="h-4 w-4 ml-2" />
                  ייבא
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedContacts.length > 0 && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedContacts.length} אנשי קשר נבחרו
                </span>
                <div className="flex gap-2">
                  <button className="btn btn-secondary flex items-center">
                    <Mail className="h-4 w-4 ml-2" />
                    שלח אימייל
                  </button>
                  <button className="btn btn-secondary flex items-center">
                    <Tag className="h-4 w-4 ml-2" />
                    הוסף תג
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <DataTable
          data={filteredContacts}
          renderTableHeader={() => (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
              />
              <span className="mr-2 text-sm text-gray-600">
                בחר הכל
              </span>
            </div>
          )}
          columns={[
            {
              key: 'select',
              header: '',
              render: (contact) => (
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => handleSelectContact(contact.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              ),
              align: 'center'
            },
            {
              key: 'contact',
              header: 'איש קשר',
              render: (contact) => (
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(contact.firstName || '').charAt(0)}{(contact.lastName || '').charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="mr-4">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.firstName || ''} {contact.lastName || ''}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 ml-1" />
                      {contact.email}
                    </div>
                    {contact.phone && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-4 w-4 ml-1" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'company',
              header: 'חברה',
              render: (contact) => (
                <div className="text-sm text-gray-900 flex items-center">
                  <Building className="h-4 w-4 ml-1" />
                  {contact.company || '-'}
                </div>
              )
            },
            {
              key: 'status',
              header: 'סטטוס',
              render: (contact) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[contact.status]}`}>
                  {statusLabels[contact.status]}
                </span>
              )
            },
            {
              key: 'tags',
              header: 'תגיות',
              render: (contact) => (
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )
            },
            {
              key: 'activity',
              header: 'פעילות',
              render: (contact) => (
                <div className="text-sm text-gray-500 space-y-1">
                  <div>הזמנות: {contact._count?.orders || 0}</div>
                  <div>אירועים: {contact._count?.events || 0}</div>
                  <div>קמפיינים: {contact._count?.campaigns || 0}</div>
                </div>
              )
            },
            {
              key: 'createdAt',
              header: 'תאריך יצירה',
              render: (contact) => (
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 ml-1" />
                  {new Date(contact.createdAt).toLocaleDateString('he-IL')}
                </div>
              )
            },
            {
              key: 'actions',
              header: '',
              render: (contact) => (
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleViewContact(contact)}
                    className="text-blue-600 hover:text-blue-900"
                    title="צפה בפרטים"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEditContact(contact)}
                    className="text-gray-600 hover:text-gray-900"
                    title="ערוך"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-900"
                    title="מחק"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
              align: 'center'
            }
          ]}
          emptyMessage={
            searchTerm || selectedStatus !== 'all' 
              ? 'לא נמצאו אנשי קשר התואמים לחיפוש שלך'
              : 'התחל בהוספת אנשי קשר חדשים'
          }
        />

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedContact && (
        <ContactViewModal
          contact={selectedContact}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedContact(null);
          }}
        />
      )}

      {selectedContact && (
        <ContactEditModal
          contact={selectedContact}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedContact(null);
          }}
          onSave={handleSaveContact}
          isLoading={modalLoading}
        />
      )}

      <ContactCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateNewContact}
        isLoading={modalLoading}
      />
    </div>
  );
};
