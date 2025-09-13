import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, MessageSquare, User, AlertCircle } from 'lucide-react';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  emailUnsubscribed: boolean;
  smsUnsubscribed: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TokenDetails {
  id: string;
  token: string;
  messageType: 'EMAIL' | 'SMS' | 'BOTH';
  isActive: boolean;
  contact: Contact;
  user: User;
}

const UnsubscribePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (token) {
      loadTokenDetails();
    }
  }, [token]);

  const loadTokenDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/unsubscribe/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setTokenDetails(data.data);
      } else {
        setError(data.error || 'שגיאה בטעינת הנתונים');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/unsubscribe/${token}/unsubscribe`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setActionResult({ type: 'success', message: data.message });
        // רענון הנתונים
        await loadTokenDetails();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch (err) {
      setActionResult({ type: 'error', message: 'שגיאה בביצוע הפעולה' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!token) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/unsubscribe/${token}/resubscribe`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setActionResult({ type: 'success', message: data.message });
        // רענון הנתונים
        await loadTokenDetails();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch (err) {
      setActionResult({ type: 'error', message: 'שגיאה בביצוע הפעולה' });
    } finally {
      setActionLoading(false);
    }
  };

  const getMessageTypeText = (messageType: string) => {
    switch (messageType) {
      case 'EMAIL':
        return 'אימיילים';
      case 'SMS':
        return 'הודעות SMS';
      case 'BOTH':
        return 'אימיילים והודעות SMS';
      default:
        return 'הודעות';
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'EMAIL':
        return <Mail className="w-6 h-6" />;
      case 'SMS':
        return <MessageSquare className="w-6 h-6" />;
      case 'BOTH':
        return (
          <div className="flex space-x-1">
            <Mail className="w-5 h-5" />
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const isUnsubscribed = (contact: Contact, messageType: string) => {
    switch (messageType) {
      case 'EMAIL':
        return contact.emailUnsubscribed;
      case 'SMS':
        return contact.smsUnsubscribed;
      case 'BOTH':
        return contact.emailUnsubscribed && contact.smsUnsubscribed;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error || !tokenDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">שגיאה</h1>
            <p className="text-gray-600 mb-4">{error || 'קישור לא תקין'}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              חזרה לעמוד הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { contact, user, messageType } = tokenDetails;
  const contactName = contact.firstName && contact.lastName 
    ? `${contact.firstName} ${contact.lastName}`
    : contact.firstName || contact.email;
  
  const unsubscribed = isUnsubscribed(contact, messageType);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-center mb-4">
              {getMessageTypeIcon(messageType)}
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">
              {unsubscribed ? 'הרשמה מחדש לדיוור' : 'הסרה מרשימת הדיוור'}
            </h1>
            <p className="text-center text-blue-100">
              ניהול העדפות קבלת {getMessageTypeText(messageType)}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="font-semibold text-gray-900">פרטי איש הקשר</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">שם:</span> {contactName}</p>
                <p><span className="font-medium">אימייל:</span> {contact.email}</p>
                {contact.phone && (
                  <p><span className="font-medium">טלפון:</span> {contact.phone}</p>
                )}
                <p><span className="font-medium">שולח:</span> {user.name} ({user.email})</p>
              </div>
            </div>

            {/* Current Status */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">סטטוס נוכחי</h3>
              <div className="space-y-2">
                {(messageType === 'EMAIL' || messageType === 'BOTH') && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">אימיילים: </span>
                    {contact.emailUnsubscribed ? (
                      <span className="text-red-600 font-medium mr-1">מבוטל</span>
                    ) : (
                      <span className="text-green-600 font-medium mr-1">פעיל</span>
                    )}
                  </div>
                )}
                {(messageType === 'SMS' || messageType === 'BOTH') && (
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="text-sm">הודעות SMS: </span>
                    {contact.smsUnsubscribed ? (
                      <span className="text-red-600 font-medium mr-1">מבוטל</span>
                    ) : (
                      <span className="text-green-600 font-medium mr-1">פעיל</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Result */}
            {actionResult && (
              <div className={`p-4 rounded-lg mb-6 ${
                actionResult.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {actionResult.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <p className={`text-sm font-medium ${
                    actionResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {actionResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {unsubscribed ? (
                <button
                  onClick={handleResubscribe}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      הרשמה מחדש לקבלת {getMessageTypeText(messageType)}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleUnsubscribe}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 mr-2" />
                      הסרה מקבלת {getMessageTypeText(messageType)}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                פעולה זו תשפיע על קבלת {getMessageTypeText(messageType)} מ-{user.name} בלבד.
                <br />
                תוכל לשנות את העדפותיך בכל עת באמצעות קישור זה.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage; 