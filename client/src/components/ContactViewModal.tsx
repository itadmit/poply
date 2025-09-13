import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Tag, 
  User,
  Activity,
  ShoppingBag,
  Zap,
  Target
} from 'lucide-react';
import type { Contact } from '../services/contactsService';

interface ContactViewModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
}

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

export const ContactViewModal: React.FC<ContactViewModalProps> = ({
  contact,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-lg font-medium text-white">
                  {contact.firstName?.charAt(0) || ''}{contact.lastName?.charAt(0) || ''}
                </span>
              </div>
            </div>
            <div className="mr-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
              <p className="text-sm text-gray-500">{contact.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 ml-2" />
                  פרטי איש קשר
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 ml-2" />
                    <div>
                      <p className="text-sm text-gray-500">אימייל</p>
                      <p className="text-sm font-medium text-gray-900">{contact.email}</p>
                    </div>
                  </div>

                  {contact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 ml-2" />
                      <div>
                        <p className="text-sm text-gray-500">טלפון</p>
                        <p className="text-sm font-medium text-gray-900">{contact.phone}</p>
                      </div>
                    </div>
                  )}

                  {contact.company && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 ml-2" />
                      <div>
                        <p className="text-sm text-gray-500">חברה</p>
                        <p className="text-sm font-medium text-gray-900">{contact.company}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                    <div>
                      <p className="text-sm text-gray-500">תאריך יצירה</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(contact.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">סטטוס</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[contact.status]}`}>
                    {statusLabels[contact.status]}
                  </span>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2 flex items-center">
                      <Tag className="h-4 w-4 ml-1" />
                      תגיות
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 ml-2" />
                  פעילות אחרונה
                </h3>
                
                {contact.events && contact.events.length > 0 ? (
                  <div className="space-y-3">
                    {contact.events.slice(0, 5).map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center">
                          <div className="h-2 w-2 bg-blue-500 rounded-full ml-3"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.type}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.createdAt).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">אין פעילות אחרונה</p>
                )}
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              {/* Activity Stats */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">סטטיסטיקות</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 text-green-500 ml-2" />
                      <span className="text-sm text-gray-600">הזמנות</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {contact._count?.orders || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-blue-500 ml-2" />
                      <span className="text-sm text-gray-600">אירועים</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {contact._count?.events || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-purple-500 ml-2" />
                      <span className="text-sm text-gray-600">קמפיינים</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {contact._count?.campaigns || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Source */}
              {contact.source && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">מקור</h3>
                  <p className="text-sm text-gray-600">{contact.source}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}; 