import React, { useState, useEffect } from 'react';
import { X, Send, Users, Target, Calendar, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import type { Campaign, SendCampaignData } from '../services/campaignsService';
import { contactsService } from '../services/contactsService';

interface CampaignSendModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (id: string, data: SendCampaignData) => Promise<void>;
  isLoading?: boolean;
}

interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
}

export const CampaignSendModal: React.FC<CampaignSendModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onSend,
  isLoading = false
}) => {
  const [sendType, setSendType] = useState<'all' | 'segments' | 'contacts'>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendNow, setSendNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      setSendType('all');
      setSelectedContacts([]);
      setSelectedSegments([]);
      setSearchTerm('');
      setSendNow(true);
      setScheduledDate('');
      setErrors({});
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Load contacts
      const contactsResponse = await contactsService.getContacts({ limit: 1000 });
      setContacts(contactsResponse.contacts);
      
      // TODO: Load segments when segments service is available
      setSegments([]);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const filteredContacts = contacts.filter((contact: Contact) => 
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (sendType === 'contacts' && selectedContacts.length === 0) {
      newErrors.contacts = 'יש לבחור לפחות איש קשר אחד';
    }

    if (sendType === 'segments' && selectedSegments.length === 0) {
      newErrors.segments = 'יש לבחור לפחות סגמנט אחד';
    }

    if (!sendNow && !scheduledDate) {
      newErrors.scheduledDate = 'יש לבחור תאריך ושעה לשליחה';
    }

    if (!sendNow && scheduledDate && new Date(scheduledDate) <= new Date()) {
      newErrors.scheduledDate = 'תאריך השליחה חייב להיות בעתיד';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign || !validateForm()) {
      return;
    }

    try {
      const sendData: SendCampaignData = {
        ...(sendType === 'contacts' && { contactIds: selectedContacts }),
        ...(sendType === 'segments' && { segmentIds: selectedSegments }),
        ...(sendType === 'all' && { sendToAll: true }),
      };

      // If scheduled, update the campaign first
      if (!sendNow && scheduledDate) {
        // This would typically be a separate API call to update the campaign
        // For now, we'll include it in the send data
      }

      await onSend(campaign.id, sendData);
      handleClose();
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const handleClose = () => {
    setSendType('all');
    setSelectedContacts([]);
    setSelectedSegments([]);
    setSearchTerm('');
    setSendNow(true);
    setScheduledDate('');
    setErrors({});
    onClose();
  };

  const getRecipientCount = () => {
    switch (sendType) {
      case 'all':
        return contacts.length;
      case 'contacts':
        return selectedContacts.length;
      case 'segments':
        return selectedSegments.reduce((total, segmentId) => {
          const segment = segments.find((s: Segment) => s.id === segmentId);
          return total + (segment?.contactCount || 0);
        }, 0);
      default:
        return 0;
    }
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-2 ml-3">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                שלח קמפיין
              </h2>
              <p className="text-sm text-gray-500">
                {campaign.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Campaign Preview */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">תצוגה מקדימה של הקמפיין</h3>
              <div className="text-sm text-blue-800">
                <p><strong>נושא:</strong> {campaign.subject}</p>
                <p className="mt-1"><strong>סוג:</strong> {campaign.type === 'EMAIL' ? 'אימייל' : campaign.type === 'SMS' ? 'SMS' : 'התראה'}</p>
              </div>
            </div>

            {/* Send Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                בחר נמענים
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="send-all"
                    type="radio"
                    value="all"
                    checked={sendType === 'all'}
                    onChange={(e) => setSendType(e.target.value as 'all' | 'segments' | 'contacts')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label htmlFor="send-all" className="mr-3 text-sm text-gray-700">
                    <Users className="h-4 w-4 inline ml-1" />
                    שלח לכל אנשי הקשר ({contacts.length} נמענים)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="send-segments"
                    type="radio"
                    value="segments"
                    checked={sendType === 'segments'}
                    onChange={(e) => setSendType(e.target.value as 'all' | 'segments' | 'contacts')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label htmlFor="send-segments" className="mr-3 text-sm text-gray-700">
                    <Target className="h-4 w-4 inline ml-1" />
                    שלח לסגמנטים ספציפיים
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="send-contacts"
                    type="radio"
                    value="contacts"
                    checked={sendType === 'contacts'}
                    onChange={(e) => setSendType(e.target.value as 'all' | 'segments' | 'contacts')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label htmlFor="send-contacts" className="mr-3 text-sm text-gray-700">
                    <Users className="h-4 w-4 inline ml-1" />
                    בחר אנשי קשר ספציפיים
                  </label>
                </div>
              </div>
            </div>

            {/* Segments Selection */}
            {sendType === 'segments' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  בחר סגמנטים
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {segments.map((segment: Segment) => (
                    <div key={segment.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`segment-${segment.id}`}
                          checked={selectedSegments.includes(segment.id)}
                          onChange={() => handleSegmentToggle(segment.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={isLoading}
                        />
                        <label htmlFor={`segment-${segment.id}`} className="mr-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{segment.name}</p>
                            {segment.description && (
                              <p className="text-xs text-gray-500">{segment.description}</p>
                            )}
                          </div>
                        </label>
                      </div>
                      <span className="text-sm text-gray-500">
                        {segment.contactCount.toLocaleString()} אנשי קשר
                      </span>
                    </div>
                  ))}
                </div>
                {errors.segments && (
                  <p className="mt-1 text-sm text-red-600">{errors.segments}</p>
                )}
              </div>
            )}

            {/* Contacts Selection */}
            {sendType === 'contacts' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  בחר אנשי קשר
                </label>
                
                {/* Search */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="חפש אנשי קשר..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pr-10"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`contact-${contact.id}`}
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => handleContactToggle(contact.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={isLoading}
                        />
                        <label htmlFor={`contact-${contact.id}`} className="mr-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{contact.email}</p>
                          </div>
                        </label>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contact.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </div>
                  ))}
                  
                  {filteredContacts.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      לא נמצאו אנשי קשר התואמים לחיפוש
                    </p>
                  )}
                </div>
                {errors.contacts && (
                  <p className="mt-1 text-sm text-red-600">{errors.contacts}</p>
                )}
              </div>
            )}

            {/* Timing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                תזמון שליחה
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="send-now"
                    type="radio"
                    checked={sendNow}
                    onChange={() => setSendNow(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label htmlFor="send-now" className="mr-3 text-sm text-gray-700">
                    <Send className="h-4 w-4 inline ml-1" />
                    שלח עכשיו
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="send-later"
                    type="radio"
                    checked={!sendNow}
                    onChange={() => setSendNow(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label htmlFor="send-later" className="mr-3 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 inline ml-1" />
                    תזמן לשליחה מאוחרת יותר
                  </label>
                </div>

                {!sendNow && (
                  <div className="mr-6">
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className={`form-input max-w-xs ${errors.scheduledDate ? 'border-red-300' : ''}`}
                      disabled={isLoading}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    {errors.scheduledDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">סיכום השליחה</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-500 ml-1" />
                  <span className="text-gray-600">סה"כ נמענים:</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {getRecipientCount().toLocaleString()}
                </span>
              </div>
              
              {!sendNow && scheduledDate && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 ml-1" />
                    <span className="text-gray-600">יישלח ב:</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Date(scheduledDate).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Warning */}
            {getRecipientCount() > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 ml-2" />
                  <div>
                    <p className="text-sm text-yellow-700">
                      <strong>שים לב:</strong> לאחר שליחת הקמפיין לא ניתן יהיה לבטל אותו.
                      {campaign.type === 'SMS' && ' שליחת SMS עלולה לכלול עלויות נוספות.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || getRecipientCount() === 0}
            >
              {isLoading ? (
                'שולח...'
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  {sendNow ? 'שלח עכשיו' : 'תזמן שליחה'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 