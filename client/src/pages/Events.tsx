import React, { useState } from 'react';
import { 
  Search, 
  Download,
  Activity,
  Mail,
  MousePointer,
  MessageSquare,
  ShoppingCart,
  Eye,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { DataTable } from '../components';

const events = [
  {
    id: '1',
    type: 'PAGE_VIEW',
    description: 'צפה בדף הבית',
    contact: {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'יוחנן',
      lastName: 'כהן'
    },
    data: {
      page: '/',
      referrer: 'google.com'
    },
    createdAt: '2024-01-21T10:30:00Z',
  },
  {
    id: '2',
    type: 'EMAIL_OPEN',
    description: 'פתח אימייל "הנחה 20%"',
    contact: {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'יוחנן',
      lastName: 'כהן'
    },
    campaign: {
      id: '1',
      name: 'הנחה 20% לחורף',
      type: 'EMAIL'
    },
    data: {
      subject: 'הנחה מיוחדת על כל הפריטים!',
      openedAt: '2024-01-21T11:15:00Z'
    },
    createdAt: '2024-01-21T11:15:00Z',
  },
  {
    id: '3',
    type: 'CART_ADD',
    description: 'הוסיף מוצר לעגלה',
    contact: {
      id: '2',
      email: 'jane.smith@example.com',
      firstName: 'שרה',
      lastName: 'לוי'
    },
    data: {
      productId: '1',
      productName: 'חולצת טריקו כחולה',
      price: 89.90
    },
    createdAt: '2024-01-21T12:45:00Z',
  },
  {
    id: '4',
    type: 'POPUP_SHOWN',
    description: 'פופאפ "הרשמה לניוזלטר" הוצג',
    contact: {
      id: '3',
      email: 'mike.wilson@example.com',
      firstName: 'מיכאל',
      lastName: 'וילסון'
    },
    popup: {
      id: '1',
      name: 'הרשמה לניוזלטר',
      title: 'הצטרף לניוזלטר שלנו!'
    },
    data: {
      popupId: '1',
      shownAt: '2024-01-21T13:20:00Z'
    },
    createdAt: '2024-01-21T13:20:00Z',
  },
  {
    id: '5',
    type: 'ORDER_COMPLETE',
    description: 'השלים הזמנה',
    contact: {
      id: '2',
      email: 'jane.smith@example.com',
      firstName: 'שרה',
      lastName: 'לוי'
    },
    data: {
      orderId: 'ORD-12345',
      total: 299.80,
      items: 2
    },
    createdAt: '2024-01-21T14:30:00Z',
  },
];

const typeIcons = {
  PAGE_VIEW: Eye,
  EMAIL_OPEN: Mail,
  EMAIL_CLICK: MousePointer,
  POPUP_SHOWN: MessageSquare,
  POPUP_CLOSED: MessageSquare,
  CART_ADD: ShoppingCart,
  CART_REMOVE: ShoppingCart,
  CHECKOUT_START: ShoppingCart,
  ORDER_COMPLETE: ShoppingCart,
  CUSTOM: Activity,
};

const typeLabels = {
  PAGE_VIEW: 'צפייה בדף',
  EMAIL_OPEN: 'פתיחת אימייל',
  EMAIL_CLICK: 'לחיצה באימייל',
  POPUP_SHOWN: 'הצגת פופאפ',
  POPUP_CLOSED: 'סגירת פופאפ',
  CART_ADD: 'הוספה לעגלה',
  CART_REMOVE: 'הסרה מהעגלה',
  CHECKOUT_START: 'התחלת תשלום',
  ORDER_COMPLETE: 'השלמת הזמנה',
  CUSTOM: 'מותאם אישית',
};

const typeColors: Record<string, string> = {
  PAGE_VIEW: 'bg-blue-100 text-blue-800',
  EMAIL_OPEN: 'bg-green-100 text-green-800',
  EMAIL_CLICK: 'bg-purple-100 text-purple-800',
  POPUP_SHOWN: 'bg-yellow-100 text-yellow-800',
  POPUP_CLOSED: 'bg-orange-100 text-orange-800',
  CART_ADD: 'bg-indigo-100 text-indigo-800',
  CART_REMOVE: 'bg-red-100 text-red-800',
  CHECKOUT_START: 'bg-pink-100 text-pink-800',
  ORDER_COMPLETE: 'bg-emerald-100 text-emerald-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
};

export const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('today');

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.contact.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || event.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const eventTypes = [...new Set(events.map(e => e.type))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 ml-4">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">אירועים</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {filteredEvents.length} אירועים מתוך {events.length} סה"כ
                </p>
              </div>
            </div>
            <button className="btn btn-secondary flex items-center">
              <Download className="h-4 w-4 ml-2" />
              ייצא נתונים
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סה"כ אירועים
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">12,345</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    צפיות בדפים
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">8,234</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    פתיחות אימייל
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">1,456</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    הזמנות הושלמו
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">234</dd>
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
                placeholder="חיפוש אירועים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">כל הסוגים</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{typeLabels[type]}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="today">היום</option>
              <option value="yesterday">אתמול</option>
              <option value="week">השבוע</option>
              <option value="month">החודש</option>
              <option value="all">כל הזמנים</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredEvents.map((event) => {
            const EventIcon = typeIcons[event.type];
            return (
              <li key={event.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <EventIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {event.description}
                          </h3>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColors[event.type]}`}>
                            {typeLabels[event.type]}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 ml-1" />
                          <span>{event.contact.firstName} {event.contact.lastName}</span>
                          <span className="mx-2">•</span>
                          <span>{event.contact.email}</span>
                        </div>
                        {event.campaign && (
                          <div className="mt-1 text-sm text-gray-500">
                            קמפיין: {event.campaign.name}
                          </div>
                        )}
                        {event.popup && (
                          <div className="mt-1 text-sm text-gray-500">
                            פופאפ: {event.popup.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 ml-1" />
                      {new Date(event.createdAt).toLocaleString('he-IL')}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין אירועים</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all'
                ? 'לא נמצאו אירועים התואמים לחיפוש שלך'
                : 'אין אירועים להצגה'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
