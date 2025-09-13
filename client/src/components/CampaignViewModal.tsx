import React from 'react';
import { X, Mail, MessageSquare, Bell, Calendar, Users, Eye, MousePointer, TrendingUp, BarChart3, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Campaign, CampaignStats } from '../services/campaignsService';

interface CampaignViewModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  stats?: CampaignStats;
}

const typeIcons: Record<string, any> = {
  EMAIL: Mail,
  SMS: MessageSquare,
  PUSH: Bell,
};

const typeLabels: Record<string, string> = {
  EMAIL: 'אימייל',
  SMS: 'SMS',
  PUSH: 'התראה',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  SENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'טיוטה',
  SCHEDULED: 'מתוזמן',
  SENDING: 'נשלח',
  SENT: 'נשלח',
  FAILED: 'נכשל',
};

const statusIcons: Record<string, any> = {
  DRAFT: Clock,
  SCHEDULED: Calendar,
  SENDING: TrendingUp,
  SENT: CheckCircle,
  FAILED: XCircle,
};

export const CampaignViewModal: React.FC<CampaignViewModalProps> = ({
  campaign,
  isOpen,
  onClose,
  stats
}) => {
  if (!isOpen || !campaign) return null;

  const TypeIcon = typeIcons[campaign.type];
  const StatusIcon = statusIcons[campaign.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-2 ml-3">
              <TypeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {campaign.name}
              </h2>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusColors[campaign.status]} ml-2`}>
                  <StatusIcon className="h-3 w-3 ml-1" />
                  {statusLabels[campaign.status]}
                </span>
                <span className="text-sm text-gray-500">
                  {typeLabels[campaign.type]}
                </span>
              </div>
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
            {/* Campaign Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">פרטי הקמפיין</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">נושא:</label>
                    <p className="text-gray-900 mt-1">{campaign.subject}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">תוכן:</label>
                    <div className="mt-1 p-3 bg-white rounded border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                        {campaign.content}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">נוצר:</label>
                      <p className="text-gray-900 mt-1">
                        {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    
                    {campaign.scheduledAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">מתוזמן ל:</label>
                        <p className="text-gray-900 mt-1">
                          {formatDate(campaign.scheduledAt)}
                        </p>
                      </div>
                    )}
                    
                    {campaign.sentAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">נשלח:</label>
                        <p className="text-gray-900 mt-1">
                          {formatDate(campaign.sentAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              {stats && campaign.status === 'SENT' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ביצועי הקמפיין</h3>
                  
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 mx-auto mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalContacts.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">סה"כ נמענים</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 mx-auto mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">{stats.sentCount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">נשלחו</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 mx-auto mb-2">
                        <Eye className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">{stats.openedCount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">נפתחו</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 mx-auto mb-2">
                        <MousePointer className="h-4 w-4 text-orange-600" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">{stats.clickedCount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">לחצו</p>
                    </div>
                  </div>

                  {/* Rate Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">שיעור משלוח</p>
                          <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {formatPercentage(stats.deliveryRate)}
                          </p>
                        </div>
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">שיעור פתיחה</p>
                          <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {formatPercentage(stats.openRate)}
                          </p>
                        </div>
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                          <Eye className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">שיעור לחיצה</p>
                          <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {formatPercentage(stats.clickRate)}
                          </p>
                        </div>
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                          <MousePointer className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Failures */}
                  {(stats.bouncedCount > 0 || stats.failedCount > 0) && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                        <h4 className="text-sm font-medium text-red-800">בעיות בשליחה</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {stats.bouncedCount > 0 && (
                          <div>
                            <span className="text-red-600 font-medium">{stats.bouncedCount}</span>
                            <span className="text-red-700"> הודעות נדחו</span>
                          </div>
                        )}
                        {stats.failedCount > 0 && (
                          <div>
                            <span className="text-red-600 font-medium">{stats.failedCount}</span>
                            <span className="text-red-700"> שליחות נכשלו</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">סיכום מהיר</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">סוג קמפיין:</span>
                    <span className="text-sm font-medium text-gray-900">{typeLabels[campaign.type]}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">סטטוס:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[campaign.status]}`}>
                      {statusLabels[campaign.status]}
                    </span>
                  </div>

                  {campaign._count && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">אנשי קשר:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {campaign._count.contacts.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">שיעור פתיחה:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPercentage(stats.openRate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">שיעור לחיצה:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPercentage(stats.clickRate)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Campaign Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ציר זמן</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 ml-3 mt-0.5">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">נוצר</p>
                      <p className="text-xs text-gray-500">{formatDate(campaign.createdAt)}</p>
                    </div>
                  </div>

                  {campaign.scheduledAt && (
                    <div className="flex items-start">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 ml-3 mt-0.5">
                        <Calendar className="h-3 w-3 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">מתוזמן</p>
                        <p className="text-xs text-gray-500">{formatDate(campaign.scheduledAt)}</p>
                      </div>
                    </div>
                  )}

                  {campaign.sentAt && (
                    <div className="flex items-start">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 ml-3 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">נשלח</p>
                        <p className="text-xs text-gray-500">{formatDate(campaign.sentAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Benchmark */}
              {stats && campaign.status === 'SENT' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">השוואה לממוצע</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">שיעור פתיחה</span>
                        <span className="text-sm font-medium text-gray-900">{formatPercentage(stats.openRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(stats.openRate, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">ממוצע בתעשייה: 20-25%</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">שיעור לחיצה</span>
                        <span className="text-sm font-medium text-gray-900">{formatPercentage(stats.clickRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(stats.clickRate * 10, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">ממוצע בתעשייה: 2-5%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 