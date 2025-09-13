import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Send,
  MoreVertical,
  Copy,
  AlertCircle
} from 'lucide-react';
import { 
  CampaignCreateModal, 
  CampaignEditModal, 
  CampaignViewModal, 
  CampaignSendModal 
} from '../components';
import { campaignsService } from '../services/campaignsService';
import type { Campaign, CreateCampaignData, UpdateCampaignData, SendCampaignData, CampaignStats } from '../services/campaignsService';

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

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | undefined>();
  
  // Loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Overall stats
  const [overallStats, setOverallStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
  });

  useEffect(() => {
    loadCampaigns();
    loadOverallStats();
  }, [selectedType, selectedStatus, searchTerm]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignsService.getCampaigns({
        type: selectedType,
        status: selectedStatus,
        search: searchTerm,
        limit: 50,
      });
      setCampaigns(response.campaigns);
      setError(null);
    } catch (err) {
      setError('שגיאה בטעינת הקמפיינים');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOverallStats = async () => {
    try {
      const stats = await campaignsService.getOverallStats();
      setOverallStats(stats);
    } catch (err) {
      console.error('Error loading overall stats:', err);
    }
  };

  const handleCreateCampaign = async (data: CreateCampaignData) => {
    try {
      setActionLoading('create');
      await campaignsService.createCampaign(data);
      await loadCampaigns();
      await loadOverallStats();
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCampaign = async (id: string, data: UpdateCampaignData) => {
    try {
      setActionLoading('edit');
      await campaignsService.updateCampaign(id, data);
      await loadCampaigns();
    } catch (err) {
      console.error('Error updating campaign:', err);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקמפיין?')) {
      return;
    }

    try {
      setActionLoading(`delete-${id}`);
      await campaignsService.deleteCampaign(id);
      await loadCampaigns();
      await loadOverallStats();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('שגיאה במחיקת הקמפיין');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendCampaign = async (id: string, data: SendCampaignData) => {
    try {
      setActionLoading('send');
      await campaignsService.sendCampaign(id, data);
      await loadCampaigns();
    } catch (err) {
      console.error('Error sending campaign:', err);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      setActionLoading(`pause-${id}`);
      await campaignsService.pauseCampaign(id);
      await loadCampaigns();
    } catch (err) {
      console.error('Error pausing campaign:', err);
      alert('שגיאה בהשהיית הקמפיין');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicateCampaign = async (id: string) => {
    try {
      setActionLoading(`duplicate-${id}`);
      await campaignsService.duplicateCampaign(id);
      await loadCampaigns();
      await loadOverallStats();
    } catch (err) {
      console.error('Error duplicating campaign:', err);
      alert('שגיאה בשכפול הקמפיין');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    
    // Load stats if campaign was sent
    if (campaign.status === 'SENT') {
      try {
        const stats = await campaignsService.getCampaignStats(campaign.id);
        setCampaignStats(stats);
      } catch (err) {
        console.error('Error loading campaign stats:', err);
      }
    }
    
    setViewModalOpen(true);
  };

  const handleEditClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditModalOpen(true);
  };

  const handleSendClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSendModalOpen(true);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || campaign.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען קמפיינים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 ml-4">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">קמפיינים</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {filteredCampaigns.length} קמפיינים מתוך {campaigns.length} סה"כ
                </p>
              </div>
            </div>
            <button 
              className="btn btn-primary flex items-center"
              onClick={() => setCreateModalOpen(true)}
              disabled={actionLoading === 'create'}
            >
              <Plus className="h-4 w-4 ml-2" />
              {actionLoading === 'create' ? 'יוצר...' : 'צור קמפיין'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה"כ קמפיינים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overallStats.totalCampaigns}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">קמפיינים פעילים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overallStats.activeCampaigns}
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
                <p className="text-sm font-medium text-gray-600">שיעור פתיחה ממוצע</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overallStats.averageOpenRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">שיעור לחיצה ממוצע</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overallStats.averageClickRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חיפוש קמפיינים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pr-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="form-input min-w-[200px]"
            >
              <option value="all">כל הסוגים</option>
              <option value="EMAIL">אימייל</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">התראה</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input min-w-[200px]"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="DRAFT">טיוטה</option>
              <option value="SCHEDULED">מתוזמן</option>
              <option value="SENDING">נשלח</option>
              <option value="SENT">נשלח</option>
              <option value="FAILED">נכשל</option>
            </select>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.map((campaign) => {
          const TypeIcon = typeIcons[campaign.type];
          return (
            <div key={campaign.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TypeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        {typeLabels[campaign.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[campaign.status]}`}>
                      {statusLabels[campaign.status]}
                    </span>
                    <div className="relative">
                      <button 
                        className="text-gray-400 hover:text-gray-600 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle dropdown menu - implement if needed
                        }}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{campaign.subject}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">אנשי קשר</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {campaign._count?.contacts?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">שיעור פתיחה</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {campaign.stats?.openRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>

                {campaign.sentAt && (
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 ml-1" />
                    נשלח ב-{new Date(campaign.sentAt).toLocaleDateString('he-IL')}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button 
                      className="text-primary-600 hover:text-primary-900 p-1"
                      onClick={() => handleViewCampaign(campaign)}
                      title="צפייה"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900 p-1"
                      onClick={() => handleEditClick(campaign)}
                      disabled={campaign.status === 'SENT' || campaign.status === 'SENDING'}
                      title="עריכה"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-blue-600 hover:text-blue-900 p-1"
                      onClick={() => handleDuplicateCampaign(campaign.id)}
                      disabled={actionLoading === `duplicate-${campaign.id}`}
                      title="שכפול"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 p-1"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={actionLoading === `delete-${campaign.id}` || campaign.status === 'SENDING'}
                      title="מחיקה"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    {campaign.status === 'DRAFT' && (
                      <button 
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        onClick={() => handleSendClick(campaign)}
                      >
                        <Play className="h-4 w-4 ml-1" />
                        שלח
                      </button>
                    )}
                    {campaign.status === 'SENDING' && (
                      <button 
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        onClick={() => handlePauseCampaign(campaign.id)}
                        disabled={actionLoading === `pause-${campaign.id}`}
                      >
                        <Pause className="h-4 w-4 ml-1" />
                        השה
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>

        {filteredCampaigns.length === 0 && !loading && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין קמפיינים</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'לא נמצאו קמפיינים התואמים לחיפוש שלך'
                : 'התחל ביצירת קמפיין חדש'
              }
            </p>
            {!searchTerm && selectedType === 'all' && selectedStatus === 'all' && (
              <div className="mt-6">
                <button
                  className="btn btn-primary"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  צור קמפיין ראשון
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CampaignCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateCampaign}
        isLoading={actionLoading === 'create'}
      />

      <CampaignEditModal
        campaign={selectedCampaign}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCampaign(null);
        }}
        onSave={handleEditCampaign}
        isLoading={actionLoading === 'edit'}
      />

      <CampaignViewModal
        campaign={selectedCampaign}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCampaign(null);
          setCampaignStats(undefined);
        }}
        stats={campaignStats}
      />

      <CampaignSendModal
        campaign={selectedCampaign}
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
          setSelectedCampaign(null);
        }}
        onSend={handleSendCampaign}
        isLoading={actionLoading === 'send'}
      />
    </div>
  );
};
