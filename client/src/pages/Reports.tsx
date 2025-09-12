import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  MousePointer, 
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  MousePointerClick,
  DollarSign,
  Target
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = {
  overview: {
    totalContacts: 2345,
    activeCampaigns: 12,
    totalRevenue: 45678,
    conversionRate: 3.2,
    emailOpenRate: 24.5,
    clickRate: 3.8,
    popupConversion: 16.2,
    avgOrderValue: 189.50
  },
  emailPerformance: [
    { name: 'ינואר', sent: 1200, opened: 294, clicked: 45, revenue: 8500 },
    { name: 'פברואר', sent: 1350, opened: 324, clicked: 52, revenue: 9200 },
    { name: 'מרץ', sent: 1100, opened: 275, clicked: 42, revenue: 7800 },
    { name: 'אפריל', sent: 1400, opened: 350, clicked: 58, revenue: 10500 },
    { name: 'מאי', sent: 1600, opened: 400, clicked: 65, revenue: 12000 },
    { name: 'יוני', sent: 1500, opened: 375, clicked: 60, revenue: 11200 }
  ],
  campaignPerformance: [
    { name: 'הנחה 20%', sent: 1200, opened: 294, clicked: 45, revenue: 8500, conversion: 3.75 },
    { name: 'ברוכים הבאים', sent: 800, opened: 200, clicked: 30, revenue: 4200, conversion: 3.75 },
    { name: 'עגלה נטושה', sent: 600, opened: 150, clicked: 25, revenue: 3800, conversion: 4.17 },
    { name: 'הזמנה חדשה', sent: 400, opened: 100, clicked: 15, revenue: 2800, conversion: 3.75 },
    { name: 'הנחה 10%', sent: 900, opened: 225, clicked: 35, revenue: 6200, conversion: 3.89 }
  ],
  contactGrowth: [
    { name: 'ינואר', new: 120, total: 2100 },
    { name: 'פברואר', new: 150, total: 2250 },
    { name: 'מרץ', new: 110, total: 2360 },
    { name: 'אפריל', new: 180, total: 2540 },
    { name: 'מאי', new: 200, total: 2740 },
    { name: 'יוני', new: 165, total: 2905 }
  ],
  revenueBySource: [
    { name: 'אימייל', value: 45, color: '#3B82F6' },
    { name: 'SMS', value: 25, color: '#10B981' },
    { name: 'פופאפים', value: 20, color: '#F59E0B' },
    { name: 'ישיר', value: 10, color: '#EF4444' }
  ],
  topProducts: [
    { name: 'חולצת טריקו כחולה', sales: 45, revenue: 4045.50 },
    { name: 'מכנסי ג\'ינס', sales: 32, revenue: 6396.80 },
    { name: 'נעלי ספורט', sales: 28, revenue: 8397.20 },
    { name: 'כובע בייסבול', sales: 22, revenue: 1100.00 },
    { name: 'תיק גב', sales: 18, revenue: 1800.00 }
  ],
  hourlyActivity: [
    { hour: '00:00', activity: 5 },
    { hour: '02:00', activity: 3 },
    { hour: '04:00', activity: 2 },
    { hour: '06:00', activity: 8 },
    { hour: '08:00', activity: 45 },
    { hour: '10:00', activity: 78 },
    { hour: '12:00', activity: 95 },
    { hour: '14:00', activity: 120 },
    { hour: '16:00', activity: 110 },
    { hour: '18:00', activity: 85 },
    { hour: '20:00', activity: 65 },
    { hour: '22:00', activity: 35 }
  ]
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">דוחות מתקדמים</h1>
          <p className="mt-1 text-sm text-gray-500">
            ניתוח מפורט של הביצועים השיווקיים
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="7d">7 ימים אחרונים</option>
            <option value="30d">30 ימים אחרונים</option>
            <option value="90d">90 ימים אחרונים</option>
            <option value="1y">שנה אחרונה</option>
            <option value="all">כל הזמנים</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 ml-2" />
            ייצא דוח
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
            <RefreshCw className="h-4 w-4 ml-2" />
            רענן
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סה"כ אנשי קשר
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(mockData.overview.totalContacts)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סה"כ הכנסות
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(mockData.overview.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    שיעור המרה
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockData.overview.conversionRate}%
                  </dd>
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
                    שיעור פתיחה
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockData.overview.emailOpenRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Email Performance Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">ביצועי אימייל</h3>
            <div className="flex space-x-2">
              <button className="text-sm text-primary-600 hover:text-primary-500">הצג הכל</button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.emailPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sent" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="נשלח" />
                <Area type="monotone" dataKey="opened" stackId="1" stroke="#10B981" fill="#10B981" name="נפתח" />
                <Area type="monotone" dataKey="clicked" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="נלחץ" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">הכנסות לפי מקור</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.revenueBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockData.revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contact Growth Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">גידול אנשי קשר</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData.contactGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="new" stroke="#3B82F6" strokeWidth={2} name="אנשי קשר חדשים" />
              <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} name="סה״כ אנשי קשר" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ביצועי קמפיינים</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    קמפיין
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    נשלח
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    נפתח
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    נלחץ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    הכנסות
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שיעור המרה
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockData.campaignPerformance.map((campaign, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(campaign.sent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(campaign.opened)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(campaign.clicked)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {campaign.conversion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products and Hourly Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">מוצרים מובילים</h3>
          <div className="space-y-4">
            {mockData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} מכירות</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">פעילות לפי שעות</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activity" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    שיעור פתיחה ממוצע
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockData.overview.emailOpenRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MousePointerClick className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    שיעור לחיצה ממוצע
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockData.overview.clickRate}%
                  </dd>
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
                    ערך הזמנה ממוצע
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(mockData.overview.avgOrderValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    המרת פופאפים
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockData.overview.popupConversion}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
