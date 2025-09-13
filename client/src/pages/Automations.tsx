import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Zap,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Settings,
  Clock,
  CheckCircle,
  Workflow
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { FormInput, FormTextarea, FormSelect, FormButtons } from '../components/form';

const automations = [
  {
    id: '1',
    name: 'ברוכים הבאים לאנשי קשר חדשים',
    description: 'שלח אימייל ברוכים הבאים לאנשי קשר חדשים',
    trigger: 'CONTACT_CREATED',
    status: 'ACTIVE',
    createdAt: '2024-01-15',
    lastRun: '2024-01-20',
    runs: 45,
  },
  {
    id: '2',
    name: 'עגלה נטושה',
    description: 'שלח תזכורת לאנשי קשר שעזבו עגלה',
    trigger: 'CART_ABANDONED',
    status: 'ACTIVE',
    createdAt: '2024-01-10',
    lastRun: '2024-01-21',
    runs: 23,
  },
  {
    id: '3',
    name: 'תודה על ההזמנה',
    description: 'שלח הודעת תודה לאחר הזמנה',
    trigger: 'ORDER_COMPLETED',
    status: 'INACTIVE',
    createdAt: '2024-01-05',
    lastRun: '2024-01-18',
    runs: 12,
  },
];

const triggerLabels = {
  CONTACT_CREATED: 'קונטקט נוצר',
  CONTACT_UPDATED: 'קונטקט עודכן',
  ORDER_CREATED: 'הזמנה נוצרה',
  ORDER_COMPLETED: 'הזמנה הושלמה',
  CART_ABANDONED: 'עגלה נטושה',
  PAGE_VISITED: 'דף נצפה',
  EMAIL_OPENED: 'אימייל נפתח',
  EMAIL_CLICKED: 'אימייל נלחץ',
  CUSTOM: 'מותאם אישית',
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
};

const statusLabels = {
  ACTIVE: 'פעיל',
  INACTIVE: 'לא פעיל',
  PAUSED: 'מושהה',
};

export const Automations: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = 
      automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      automation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || automation.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אוטומציות</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredAutomations.length} אוטומציות מתוך {automations.length} סה"כ
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/automation-builder')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            <Workflow className="h-4 w-4 ml-2" />
            בילדר ויזואלי
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            צור אוטומציה
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סה"כ אוטומציות
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-500 rounded-full"></div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    אוטומציות פעילות
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">8</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    מושהה
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">2</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    הרצות היום
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">23</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חיפוש אוטומציות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="ACTIVE">פעיל</option>
              <option value="INACTIVE">לא פעיל</option>
              <option value="PAUSED">מושהה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredAutomations.map((automation) => (
            <li key={automation.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {automation.name}
                        </h3>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[automation.status]}`}>
                          {statusLabels[automation.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{automation.description}</p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>טריגר: {triggerLabels[automation.trigger]}</span>
                        <span className="mx-2">•</span>
                        <span>הרצות: {automation.runs}</span>
                        <span className="mx-2">•</span>
                        <span>נוצר: {new Date(automation.createdAt).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex space-x-1">
                      {automation.status === 'ACTIVE' ? (
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
            </li>
          ))}
        </ul>

        {filteredAutomations.length === 0 && (
          <div className="text-center py-12">
            <Zap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין אוטומציות</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus !== 'all'
                ? 'לא נמצאו אוטומציות התואמות לחיפוש שלך'
                : 'התחל ביצירת אוטומציה חדשה'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Automation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="יצירת אוטומציה חדשה"
        size="lg"
      >
        <form className="space-y-5">
          <FormInput
            id="name"
            label="שם האוטומציה"
            placeholder="לדוגמה: ברוכים הבאים לאנשי קשר חדשים"
            required
          />

          <FormTextarea
            id="description"
            label="תיאור"
            placeholder="תאר את מטרת האוטומציה..."
            rows={3}
          />

          <FormSelect
            id="trigger"
            label="טריגר"
            required
          >
            <option value="">בחר טריגר</option>
            <option value="CONTACT_CREATED">קונטקט נוצר</option>
            <option value="CONTACT_UPDATED">קונטקט עודכן</option>
            <option value="ORDER_CREATED">הזמנה נוצרה</option>
            <option value="ORDER_COMPLETED">הזמנה הושלמה</option>
            <option value="CART_ABANDONED">עגלה נטושה</option>
            <option value="PAGE_VISITED">דף נצפה</option>
            <option value="EMAIL_OPENED">אימייל נפתח</option>
            <option value="EMAIL_CLICKED">אימייל נלחץ</option>
            <option value="CUSTOM">מותאם אישית</option>
          </FormSelect>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              פעולות
            </label>
            <div className="space-y-2">
              <div className="border border-gray-300 rounded-lg p-3">
                <FormSelect id="action1" label="">
                  <option value="">בחר פעולה</option>
                  <option value="SEND_EMAIL">שלח אימייל</option>
                  <option value="ADD_TAG">הוסף תגית</option>
                  <option value="UPDATE_FIELD">עדכן שדה</option>
                  <option value="WEBHOOK">Webhook</option>
                  <option value="WAIT">המתן</option>
                </FormSelect>
              </div>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4 ml-1" />
                הוסף פעולה
              </button>
            </div>
          </div>

          <FormButtons
            submitText="צור אוטומציה"
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </form>
      </Modal>
    </div>
  );
};
