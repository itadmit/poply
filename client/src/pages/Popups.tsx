import React, { useState } from 'react';
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

const popups = [
  {
    id: '1',
    name: 'הרשמה לניוזלטר',
    title: 'הצטרף לניוזלטר שלנו!',
    type: 'EXIT_INTENT',
    status: 'ACTIVE',
    shows: 456,
    conversions: 89,
    conversionRate: 19.5,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'הנחה 10%',
    title: 'קבל 10% הנחה על ההזמנה הראשונה',
    type: 'TIME_DELAY',
    status: 'ACTIVE',
    shows: 234,
    conversions: 45,
    conversionRate: 19.2,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'סקר לקוחות',
    title: 'עזור לנו לשפר את השירות',
    type: 'SCROLL_PERCENTAGE',
    status: 'INACTIVE',
    shows: 123,
    conversions: 12,
    conversionRate: 9.8,
    createdAt: '2024-01-05',
  },
];

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

  const filteredPopups = popups.filter(popup => {
    const matchesSearch = 
      popup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      popup.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || popup.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || popup.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

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
                  <p className="text-lg font-semibold text-gray-900">{popup.shows.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">המרות</p>
                  <p className="text-lg font-semibold text-gray-900">{popup.conversions}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">שיעור המרה</span>
                  <span className="text-sm font-semibold text-gray-900">{popup.conversionRate}%</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(popup.conversionRate, 100)}%` }}
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
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  {popup.status === 'ACTIVE' ? (
                    <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Pause className="h-4 w-4 ml-1" />
                      השה
                    </button>
                  ) : (
                    <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
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
        <form className="space-y-5">
          <FormInput
            id="name"
            label="שם הפופאפ"
            placeholder="לדוגמה: הרשמה לניוזלטר"
            required
          />

          <FormInput
            id="title"
            label="כותרת הפופאפ"
            placeholder="לדוגמה: הצטרף לניוזלטר שלנו!"
            required
          />

          <FormTextarea
            id="content"
            label="תוכן הפופאפ"
            placeholder="הכנס את תוכן הפופאפ כאן..."
            rows={4}
          />

          <FormSelect
            id="trigger"
            label="טריגר"
            required
          >
            <option value="">בחר טריגר</option>
            <option value="EXIT_INTENT">כוונת יציאה</option>
            <option value="TIME_DELAY">עיכוב זמן</option>
            <option value="SCROLL_PERCENTAGE">אחוז גלילה</option>
            <option value="PAGE_VIEWS">צפיות בדף</option>
            <option value="CUSTOM">מותאם אישית</option>
          </FormSelect>

          <FormInput
            id="pages"
            label="עמודי יעד"
            placeholder="לדוגמה: /products, /checkout"
          />

          <FormButtons
            submitText="צור פופאפ"
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </form>
      </Modal>
    </div>
  );
};
