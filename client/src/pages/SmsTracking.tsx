import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mouse,
  Users,
  Link2,
  Clock,
  TrendingUp,
  Eye,
  UserCheck,
  BarChart3,
  Calendar,
  Globe,
  Smartphone
} from 'lucide-react';
import { trackingService } from '../services/trackingService';

interface SmsStats {
  smsMessage: any;
  stats: {
    totalRecipients: number;
    totalClicks: number;
    clickedRecipients: number;
    clickRate: number;
    recipientStats: Array<{
      contact: any;
      token: string;
      clickCount: number;
      firstClick: string | null;
      lastClick: string | null;
    }>;
  };
}

const SmsTracking: React.FC = () => {
  const { messageId } = useParams<{ messageId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contactActivity, setContactActivity] = useState<any>(null);

  useEffect(() => {
    if (messageId) {
      loadStats();
    }
  }, [messageId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await trackingService.getSmsStats(messageId!);
      setStats(data);
    } catch (error) {
      console.error('Error loading SMS stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContactActivity = async (contactId: string) => {
    try {
      const data = await trackingService.getContactActivity(contactId);
      setContactActivity(data);
      setSelectedContact(data.contact);
    } catch (error) {
      console.error('Error loading contact activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">לא נמצאו נתונים</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/sms')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח מעקב SMS</h1>
            <p className="text-sm text-gray-500 mt-1">
              נשלח ב-{new Date(stats.smsMessage.createdAt).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>
      </div>

      {/* תוכן ההודעה */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">תוכן ההודעה</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 whitespace-pre-wrap">{stats.smsMessage.content}</p>
        </div>
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <Smartphone className="w-4 h-4 mr-2" />
          <span>שולח: {stats.smsMessage.sender}</span>
        </div>
      </div>

      {/* סטטיסטיקות כלליות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">נמענים</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.stats.totalRecipients}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">סה"כ קליקים</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.stats.totalClicks}
              </p>
            </div>
            <Mouse className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">לחצו על הקישור</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.stats.clickedRecipients}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">שיעור קליקים</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.stats.clickRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* טבלת נמענים */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">פירוט לפי נמענים</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  איש קשר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מספר קליקים
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קליק ראשון
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קליק אחרון
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.stats.recipientStats.map((recipient) => (
                <tr key={recipient.token}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {recipient.contact?.firstName} {recipient.contact?.lastName}
                      </div>
                      <div className="text-gray-500">
                        {recipient.contact?.email || 'ללא אימייל'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {recipient.clickCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {recipient.clickCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recipient.firstClick
                      ? new Date(recipient.firstClick).toLocaleDateString('he-IL')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recipient.lastClick
                      ? new Date(recipient.lastClick).toLocaleDateString('he-IL')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recipient.contact && (
                      <button
                        onClick={() => loadContactActivity(recipient.contact.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* מודל פעילות איש קשר */}
      {selectedContact && contactActivity && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                פעילות של {selectedContact.firstName} {selectedContact.lastName}
              </h3>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setContactActivity(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* סיכום פעילות */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">סה"כ קליקים</p>
                  <p className="text-2xl font-semibold">{contactActivity.totalClicks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">סה"כ ביקורים</p>
                  <p className="text-2xl font-semibold">{contactActivity.totalSessions}</p>
                </div>
              </div>

              {/* היסטוריית קליקים */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">היסטוריית קליקים</h4>
                <div className="space-y-2">
                  {contactActivity.clicks.map((click: any) => (
                    <div
                      key={click.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Link2 className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium">
                            {click.shortLink.originalUrl}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(click.clickedAt).toLocaleString('he-IL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sessions */}
              {contactActivity.sessions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">ביקורים באתר</h4>
                  <div className="space-y-3">
                    {contactActivity.sessions.map((session: any) => (
                      <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            ביקור מ-{new Date(session.createdAt).toLocaleDateString('he-IL')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.events.length} אירועים
                          </p>
                        </div>
                        
                        {session.events.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {session.events.slice(0, 5).map((event: any) => (
                              <div
                                key={event.id}
                                className="text-xs text-gray-600 flex items-center"
                              >
                                <Globe className="w-3 h-3 mr-2" />
                                <span>{event.eventType}</span>
                                {event.pageUrl && (
                                  <span className="ml-2 text-gray-400">
                                    - {event.pageUrl}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsTracking;
