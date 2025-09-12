import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Filter as FilterIcon,
  Users,
  Edit,
  Trash2,
  Eye,
  Plus as PlusIcon,
  Minus
} from 'lucide-react';

const segments = [
  {
    id: '1',
    name: 'לקוחות VIP',
    description: 'לקוחות עם יותר מ-3 הזמנות',
    contacts: 45,
    conditions: {
      type: 'orders',
      operator: 'greater_than',
      value: 3
    },
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'מנויי ניוזלטר',
    description: 'אנשי קשר שנרשמו לניוזלטר',
    contacts: 234,
    conditions: {
      type: 'tags',
      operator: 'contains',
      value: 'Newsletter'
    },
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'לקוחות חדשים',
    description: 'אנשי קשר שנרשמו השבוע',
    contacts: 12,
    conditions: {
      type: 'created_at',
      operator: 'last_7_days',
      value: null
    },
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'עגלה נטושה',
    description: 'אנשי קשר שעזבו עגלה',
    contacts: 67,
    conditions: {
      type: 'events',
      operator: 'contains',
      value: 'CART_ABANDONED'
    },
    createdAt: '2024-01-18',
  },
];

export const Segments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  const filteredSegments = segments.filter(segment => {
    const matchesSearch = 
      segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleSelectSegment = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSegments.length === filteredSegments.length) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(filteredSegments.map(segment => segment.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">סגמנטים</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredSegments.length} סגמנטים מתוך {segments.length} סה"כ
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            צור סגמנט
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FilterIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סה"כ סגמנטים
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
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    אנשי קשר בסגמנטים
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">1,234</dd>
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
                    סגמנטים פעילים
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
                <div className="h-6 w-6 bg-blue-500 rounded-full"></div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    אנשי קשר ממוצעים
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">103</dd>
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
                placeholder="חיפוש סגמנטים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Segments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedSegments.length === filteredSegments.length && filteredSegments.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-500">
                {selectedSegments.length} נבחרו
              </span>
            </div>
            {selectedSegments.length > 0 && (
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <PlusIcon className="h-4 w-4 ml-2" />
                  הוסף לקמפיין
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <Minus className="h-4 w-4 ml-2" />
                  הסר מהקמפיין
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSegments.map((segment) => (
              <div key={segment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSegments.includes(segment.id)}
                      onChange={() => handleSelectSegment(segment.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ml-3"
                    />
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <FilterIcon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">{segment.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{segment.description}</p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">אנשי קשר</span>
                    <span className="text-lg font-semibold text-gray-900">{segment.contacts}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    נוצר ב-{new Date(segment.createdAt).toLocaleDateString('he-IL')}
                  </div>
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
                  <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    <Users className="h-4 w-4 ml-1" />
                    צפה באנשי קשר
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSegments.length === 0 && (
            <div className="text-center py-12">
              <FilterIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">אין סגמנטים</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'לא נמצאו סגמנטים התואמים לחיפוש שלך'
                  : 'התחל ביצירת סגמנט חדש'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
