import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Package,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  DollarSign,
  Image
} from 'lucide-react';

const products = [
  {
    id: '1',
    name: 'חולצת טריקו כחולה',
    description: 'חולצת טריקו נוחה ואיכותית',
    price: 89.90,
    imageUrl: 'https://via.placeholder.com/150',
    category: 'ביגוד',
    tags: ['חולצות', 'כחול', 'קיץ'],
    status: 'ACTIVE',
    orders: 45,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'מכנסי ג\'ינס',
    description: 'מכנסי ג\'ינס קלאסיים',
    price: 199.90,
    imageUrl: 'https://via.placeholder.com/150',
    category: 'ביגוד',
    tags: ['מכנסים', 'ג\'ינס', 'קלאסי'],
    status: 'ACTIVE',
    orders: 23,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'נעלי ספורט',
    description: 'נעלי ספורט נוחות לפעילות',
    price: 299.90,
    imageUrl: 'https://via.placeholder.com/150',
    category: 'נעליים',
    tags: ['נעליים', 'ספורט', 'נוחות'],
    status: 'OUT_OF_STOCK',
    orders: 0,
    createdAt: '2024-01-05',
  },
];

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  OUT_OF_STOCK: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'פעיל',
  INACTIVE: 'לא פעיל',
  OUT_OF_STOCK: 'אזל מהמלאי',
};

export const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 ml-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">מוצרים</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {filteredProducts.length} מוצרים מתוך {products.length} סה"כ
                </p>
              </div>
            </div>
            <button className="btn btn-primary flex items-center">
              <Plus className="h-4 w-4 ml-2" />
              הוסף מוצר
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
                <p className="text-sm font-medium text-gray-600">סה"כ מוצרים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">156</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">מוצרים פעילים</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">142</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">הזמנות היום</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">23</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">מכירות היום</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">₪4,567</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
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
                placeholder="חיפוש מוצרים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="ACTIVE">פעיל</option>
              <option value="INACTIVE">לא פעיל</option>
              <option value="OUT_OF_STOCK">אזל מהמלאי</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-48 w-full object-cover object-center"
                />
              ) : (
                <div className="h-48 w-full flex items-center justify-center bg-gray-200">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[product.status]}`}>
                  {statusLabels[product.status]}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2">
                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
              </div>

              <div className="mt-2">
                <p className="text-lg font-semibold text-gray-900">₪{product.price}</p>
                <p className="text-sm text-gray-500">{product.category}</p>
              </div>

              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      +{product.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {product.orders} הזמנות
                </div>
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
              </div>
            </div>
          </div>
        ))}
      </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין מוצרים</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'לא נמצאו מוצרים התואמים לחיפוש שלך'
                : 'התחל בהוספת מוצר חדש'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
