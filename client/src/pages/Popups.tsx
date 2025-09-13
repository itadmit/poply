import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search,
  MessageSquare,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Clock,
  MousePointer,
  Layers,
  MoreVertical
} from 'lucide-react';
import { Modal } from '../components';
import { FormInput, FormTextarea, FormSelect, FormButtons } from '../components/form';
import { popupsService, type Popup } from '../services/popupsService';

// הנתונים יטענו מהשרת

const typeLabels = {
  EXIT_INTENT: 'כוונת יציאה',
  TIME_DELAY: 'עיכוב זמן',
  SCROLL_PERCENTAGE: 'אחוז גלילה',
  PAGE_VIEWS: 'צפיות בדף',
  CUSTOM: 'מותאם אישית',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'פעיל',
  INACTIVE: 'לא פעיל',
  DRAFT: 'טיוטה',
};

export const Popups: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    try {
      setLoading(true);
      const response = await popupsService.getPopups();
      setPopups(response.popups);
      setError(null);
    } catch (err) {
      setError('שגיאה בטעינת הפופאפים');
      console.error('Error loading popups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePopup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      setCreateLoading(true);
      const newPopup = await popupsService.createPopup({
        name: formData.get('name') as string,
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        type: formData.get('trigger') as any,
        trigger: formData.get('trigger') as any,
        conditions: {},
        design: {}
      });
      
      setPopups(prev => [newPopup, ...prev]);
      setIsCreateModalOpen(false);
      event.currentTarget.reset();
    } catch (err) {
      console.error('Error creating popup:', err);
      alert('שגיאה ביצירת הפופאפ');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (popupId: string) => {
    try {
      const updatedPopup = await popupsService.togglePopupStatus(popupId);
      setPopups(prev => prev.map(p => p.id === popupId ? updatedPopup : p));
    } catch (err) {
      console.error('Error toggling popup status:', err);
      alert('שגיאה בשינוי סטטוס הפופאפ');
    }
  };

  const handleDeletePopup = async (popupId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפופאפ?')) return;
    
    try {
      await popupsService.deletePopup(popupId);
      setPopups(prev => prev.filter(p => p.id !== popupId));
    } catch (err) {
      console.error('Error deleting popup:', err);
      alert('שגיאה במחיקת הפופאפ');
    }
  };

  const filteredPopups = popups.filter((popup: Popup) => {
    const matchesSearch = 
      popup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      popup.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || popup.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || popup.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען פופאפים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={loadPopups}
              className="mt-2 btn btn-primary"
            >
              נסה שוב
            </button>
          </div>
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
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">פופאפים</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {filteredPopups.length} פופאפים מתוך {popups.length} סה"כ
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              צור פופאפ
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
                <p className="text-sm font-medium text-gray-600">סה"כ פופאפים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">8</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">פופאפים פעילים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">5</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">הצגות היום</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">1,234</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">שיעור המרה ממוצע</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">16.2%</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <MousePointer className="h-6 w-6 text-orange-600" />
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
                placeholder="חיפוש פופאפים..."
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
              <option value="EXIT_INTENT">כוונת יציאה</option>
              <option value="TIME_DELAY">עיכוב זמן</option>
              <option value="SCROLL_PERCENTAGE">אחוז גלילה</option>
              <option value="PAGE_VIEWS">צפיות בדף</option>
              <option value="CUSTOM">מותאם אישית</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input min-w-[200px]"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="ACTIVE">פעיל</option>
              <option value="INACTIVE">לא פעיל</option>
              <option value="DRAFT">טיוטה</option>
            </select>
            </div>
          </div>
        </div>

        {/* Popups Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPopups.map((popup) => (
          <div key={popup.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">
                      {typeLabels[popup.type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[popup.status]}`}>
                    {statusLabels[popup.status]}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">{popup.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{popup.title}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">הצגות</p>
                  <p className="text-lg font-semibold text-gray-900">{(popup.shows || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">המרות</p>
                  <p className="text-lg font-semibold text-gray-900">{popup.conversions || 0}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">שיעור המרה</span>
                  <span className="text-sm font-semibold text-gray-900">{popup.conversionRate || 0}%</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(popup.conversionRate || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 ml-1" />
                נוצר ב-{new Date(popup.createdAt).toLocaleDateString('he-IL')}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-900">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeletePopup(popup.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  {popup.status === 'ACTIVE' ? (
                    <button 
                      onClick={() => handleToggleStatus(popup.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Pause className="h-4 w-4 ml-1" />
                      השה
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggleStatus(popup.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Play className="h-4 w-4 ml-1" />
                      הפעל
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>

        {filteredPopups.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין פופאפים</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'לא נמצאו פופאפים התואמים לחיפוש שלך'
                : 'התחל ביצירת פופאפ חדש'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Popup Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="יצירת פופאפ חדש"
        size="lg"
      >
        <form onSubmit={handleCreatePopup} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              שם הפופאפ
              <span className="text-red-500 mr-1">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="לדוגמה: הרשמה לניוזלטר"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
              כותרת הפופאפ
              <span className="text-red-500 mr-1">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="לדוגמה: הצטרף לניוזלטר שלנו!"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">
              תוכן הפופאפ
              <span className="text-red-500 mr-1">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="הכנס את תוכן הפופאפ כאן..."
            />
          </div>

          <div>
            <label htmlFor="trigger" className="block text-sm font-medium text-gray-700 mb-1.5">
              טריגר
              <span className="text-red-500 mr-1">*</span>
            </label>
            <select
              id="trigger"
              name="trigger"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="">בחר טריגר</option>
              <option value="EXIT_INTENT">כוונת יציאה</option>
              <option value="TIME_DELAY">עיכוב זמן</option>
              <option value="SCROLL_PERCENTAGE">אחוז גלילה</option>
              <option value="PAGE_VIEWS">צפיות בדף</option>
              <option value="CUSTOM">מותאם אישית</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? "יוצר..." : "צור פופאפ"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
