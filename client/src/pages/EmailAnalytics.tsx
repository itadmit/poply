import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface EmailStats {
  messageId: string;
  to: string;
  subject: string;
  status: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  openCount: number;
  clickCount: number;
  clicks: any[];
}

export const EmailAnalytics: React.FC = () => {
  const [emails, setEmails] = useState<EmailStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailStats | null>(null);

  // Simulated data - replace with actual API call
  useEffect(() => {
    // In real app, fetch from /api/email-tracking/recent
    const mockData: EmailStats[] = [
      {
        messageId: '1',
        to: 'user@example.com',
        subject: 'ברוכים הבאים ל-Poply!',
        status: 'sent',
        sentAt: new Date().toISOString(),
        openedAt: new Date().toISOString(),
        openCount: 3,
        clickCount: 2,
        clicks: [
          { url: 'https://example.com/login', clickedAt: new Date().toISOString() },
          { url: 'https://example.com/features', clickedAt: new Date().toISOString() }
        ]
      }
    ];
    setEmails(mockData);
    setLoading(false);
  }, []);

  const getStatusColor = (email: EmailStats) => {
    if (email.clickCount > 0) return 'text-green-600 bg-green-100';
    if (email.openCount > 0) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (email: EmailStats) => {
    if (email.clickCount > 0) return 'נלחץ';
    if (email.openCount > 0) return 'נפתח';
    return 'נשלח';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניתוח מיילים</h1>
          <p className="mt-1 text-sm text-gray-500">
            מעקב אחר ביצועי המיילים שנשלחו מהמערכת
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          רענן
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    נשלחו
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {emails.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-blue-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    נפתחו
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {emails.filter(e => e.openCount > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MousePointer className="h-6 w-6 text-green-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    נלחצו
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {emails.filter(e => e.clickCount > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    שיעור פתיחה
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {emails.length > 0 
                      ? Math.round((emails.filter(e => e.openCount > 0).length / emails.length) * 100) 
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            מיילים אחרונים
          </h3>
          
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">אין מיילים</h3>
              <p className="mt-1 text-sm text-gray-500">
                עדיין לא נשלחו מיילים מהמערכת
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div 
                  key={email.messageId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {email.subject}
                        </h4>
                        <span className={`mr-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email)}`}>
                          {getStatusText(email)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        נשלח ל: {email.to}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4 space-x-reverse">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 ml-1" />
                          {new Date(email.sentAt).toLocaleDateString('he-IL')}
                        </span>
                        {email.openCount > 0 && (
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 ml-1" />
                            נפתח {email.openCount} פעמים
                          </span>
                        )}
                        {email.clickCount > 0 && (
                          <span className="flex items-center">
                            <MousePointer className="h-3 w-3 ml-1" />
                            {email.clickCount} לחיצות
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Details Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-30"
              onClick={() => setSelectedEmail(null)}
            />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                פרטי מייל
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">נושא</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmail.subject}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">נמען</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmail.to}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">נשלח ב</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEmail.sentAt).toLocaleString('he-IL')}
                  </p>
                </div>
                
                {selectedEmail.openedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">נפתח ב</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedEmail.openedAt).toLocaleString('he-IL')}
                    </p>
                  </div>
                )}
                
                {selectedEmail.clicks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">לחיצות</h4>
                    <ul className="mt-1 space-y-1">
                      {selectedEmail.clicks.map((click, index) => (
                        <li key={index} className="text-sm text-gray-900">
                          <a href={click.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                            {click.url}
                          </a>
                          <span className="text-gray-500 mr-2">
                            ({new Date(click.clickedAt).toLocaleString('he-IL')})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
