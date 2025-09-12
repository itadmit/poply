import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Package, 
  Key, 
  Settings,
  History,
  BarChart3,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { smsService } from '../services/smsService';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';

interface SmsStats {
  sent: number;
  delivered: number;
  failed: number;
  balance: number;
  totalPurchased: number;
  packages: any[];
}

interface SmsMessage {
  id: string;
  recipient: string;
  sender: string;
  content: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  createdAt: string;
}

const SmsManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // נתוני SMS
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [balance, setBalance] = useState(0);

  // טופס שליחת SMS
  const [smsForm, setSmsForm] = useState({
    recipient: '',
    content: ''
  });

  // טופס API key
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  // טופס הגדרות
  const [settings, setSettings] = useState({
    smsSenderName: ''
  });

  useEffect(() => {
    loadData();
    // טען סטטיסטיקות תמיד
    loadStats();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const statsData = await smsService.getSmsStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'send':
          const balanceData = await smsService.getSmsBalance();
          setBalance(balanceData.balance);
          break;
        
        case 'history':
          const messagesData = await smsService.getSmsHistory();
          setMessages(messagesData);
          break;
        
        case 'stats':
          const statsData = await smsService.getSmsStats();
          setStats(statsData);
          break;
        
        case 'api':
          const keysData = await smsService.getApiKeys();
          setApiKeys(keysData);
          break;
        
        case 'settings':
          const settingsData = await smsService.getSmsSettings();
          setSettings({
            smsSenderName: settingsData.senderName || ''
          });
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await smsService.sendSms(smsForm);
      setSuccess('ההודעה נשלחה בהצלחה!');
      setSmsForm({ recipient: '', content: '' });
      
      // עדכון יתרה
      const balanceData = await smsService.getSmsBalance();
      setBalance(balanceData.balance);
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשליחת ההודעה');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      setLoading(true);
      const newKey = await smsService.createApiKey(apiKeyName);
      setApiKeys([newKey, ...apiKeys]);
      setShowApiKeyModal(false);
      setApiKeyName('');
      setSuccess('API key נוצר בהצלחה!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה ביצירת API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ה-API key?')) return;
    
    try {
      await smsService.deleteApiKey(id);
      setApiKeys(apiKeys.filter(key => key.id !== id));
      setSuccess('API key נמחק בהצלחה!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה במחיקת API key');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await smsService.updateSmsSettings({ 
        senderName: settings.smsSenderName 
      });
      setSuccess('ההגדרות עודכנו בהצלחה!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בעדכון ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckProviderBalance = async () => {
    try {
      setLoading(true);
      const result = await smsService.checkProviderBalance();
      setSuccess(`יתרה בספק: ${result.balance} הודעות`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בבדיקת יתרה');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccess('API key הועתק ללוח!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'SENT':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'נמסר';
      case 'SENT':
        return 'נשלח';
      case 'FAILED':
        return 'נכשל';
      case 'PENDING':
        return 'ממתין';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 ml-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">מערכת SMS</h1>
              <p className="mt-1 text-sm text-gray-600">שלח הודעות, נהל חבילות ועקוב אחר ביצועים</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">יתרת SMS</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{balance.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <button
              onClick={() => navigate('/sms/purchase')}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              רכוש עוד ←
            </button>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">נשלחו היום</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.sent || 0}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">נמסרו</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.delivered || 0}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">נכשלו</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.failed || 0}</p>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="tab-nav m-2">
            <button
              onClick={() => setActiveTab('send')}
              className={`tab-button ${
                activeTab === 'send'
                  ? 'tab-button-active'
                  : 'tab-button-inactive'
              }`}
            >
              שליחת SMS
              <Send className="w-4 h-4 inline mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab-button ${
                activeTab === 'history'
                  ? 'tab-button-active'
                  : 'tab-button-inactive'
              }`}
            >
              היסטוריה
              <History className="w-4 h-4 inline mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`tab-button ${
                activeTab === 'stats'
                  ? 'tab-button-active'
                  : 'tab-button-inactive'
              }`}
            >
              סטטיסטיקות
              <BarChart3 className="w-4 h-4 inline mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`tab-button ${
                activeTab === 'api'
                  ? 'tab-button-active'
                  : 'tab-button-inactive'
              }`}
            >
              API Keys
              <Key className="w-4 h-4 inline mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`tab-button ${
                activeTab === 'settings'
                  ? 'tab-button-active'
                  : 'tab-button-inactive'
              }`}
            >
              הגדרות
              <Settings className="w-4 h-4 inline mr-2" />
            </button>
          </div>
        </div>

      {/* הודעות */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* תוכן הטאב */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* שליחת SMS */}
          {activeTab === 'send' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">שליחת הודעת SMS</h3>
                  </div>
                  <div className="card-body">

                    <form onSubmit={handleSendSms} className="space-y-4">
                      <div>
                        <label className="form-label">מספר טלפון</label>
                        <input
                          type="tel"
                          value={smsForm.recipient}
                          onChange={(e) => setSmsForm({ ...smsForm, recipient: e.target.value })}
                          className="form-input"
                          placeholder="0501234567"
                          pattern="05\d{8}"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">תוכן ההודעה</label>
                        <textarea
                          value={smsForm.content}
                          onChange={(e) => setSmsForm({ ...smsForm, content: e.target.value })}
                          className="form-textarea"
                          rows={6}
                          required
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">
                            אורך: {smsForm.content.length} תווים
                          </p>
                          {(smsForm.content.includes('http://') || smsForm.content.includes('https://')) && (
                            <p className="text-sm text-green-600 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              קישורים יקוצרו ויאפשרו מעקב
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || balance === 0}
                        className="btn btn-primary w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        שלח SMS
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="card">
                  <div className="card-body">
                    <h4 className="font-medium text-gray-900 mb-3">יתרת SMS</h4>
                    <p className="text-3xl font-semibold text-blue-600">{balance.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">הודעות זמינות</p>
                    <button
                      onClick={() => navigate('/sms/purchase')}
                      className="btn btn-secondary w-full mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      רכוש עוד
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h4 className="font-medium text-gray-900 mb-3">טיפים לשליחה</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        הודעה עד 70 תווים נחשבת להודעה אחת
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        קישורים מקוצרים אוטומטית ל-22 תווים
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        ניתן לעקוב אחר קליקים על קישורים
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* היסטוריה */}
          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">היסטוריית הודעות</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      נמען
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שולח
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תוכן
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סטטוס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תאריך
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr key={message.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {message.recipient}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {message.sender}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {message.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                          <span className="mr-2">{getStatusText(message.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(message.content.includes('http://') || message.content.includes('https://')) && (
                          <button
                            onClick={() => navigate(`/sms/tracking/${message.id}`)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="צפה בדוח מעקב"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}

          {/* סטטיסטיקות */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">יתרה נוכחית</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.balance}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">הודעות שנשלחו</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
                  </div>
                  <Send className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">הודעות שנמסרו</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">הודעות שנכשלו</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold">API Keys</h2>
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  צור API Key חדש
                </button>
              </div>

              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        שם
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API Key
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        נוצר בתאריך
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map((apiKey) => (
                      <tr key={apiKey.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {apiKey.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {showApiKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                            </code>
                            <button
                              onClick={() => setShowApiKeys({ ...showApiKeys, [apiKey.id]: !showApiKeys[apiKey.id] })}
                              className="mr-2 text-gray-400 hover:text-gray-600"
                            >
                              {showApiKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => copyApiKey(apiKey.key)}
                              className="mr-2 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(apiKey.createdAt).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* הגדרות */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">הגדרות SMS</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleUpdateSettings} className="space-y-4">
                    <div>
                      <label className="form-label">
                        שם שולח ברירת מחדל
                      </label>
                      <input
                        type="text"
                        value={settings.smsSenderName}
                        onChange={(e) => setSettings({ ...settings, smsSenderName: e.target.value })}
                        className="form-input"
                        placeholder="עד 11 תווים באנגלית"
                        maxLength={11}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        שם זה יופיע כשולח ברירת מחדל בכל ההודעות שלך
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-full"
                    >
                      שמור הגדרות
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* מודל יצירת API Key */}
      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="צור API Key חדש"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם ה-API Key
            </label>
            <input
              type="text"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="לדוגמה: אפליקציה חיצונית"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              onClick={handleCreateApiKey}
              disabled={!apiKeyName || loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              צור API Key
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default SmsManager;
