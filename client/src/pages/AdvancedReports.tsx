import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Click,
  DollarSign,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { AdvancedChart } from '../components/AdvancedChart';
import { StatCard } from '../components/StatCard';
import { reportsService } from '../services/reportsService';
import { format, subDays, subMonths, subWeeks } from 'date-fns';

export const AdvancedReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return {
          start: subDays(now, 7).toISOString(),
          end: now.toISOString()
        };
      case '30d':
        return {
          start: subDays(now, 30).toISOString(),
          end: now.toISOString()
        };
      case '90d':
        return {
          start: subDays(now, 90).toISOString(),
          end: now.toISOString()
        };
      case 'custom':
        return {
          start: customDateRange.start,
          end: customDateRange.end
        };
      default:
        return {
          start: subDays(now, 30).toISOString(),
          end: now.toISOString()
        };
    }
  };

  const dateRangeData = getDateRange();

  // Queries
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['reports', 'overview', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getOverview(dateRangeData.start, dateRangeData.end),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const { data: emailPerformance, isLoading: emailLoading } = useQuery({
    queryKey: ['reports', 'email-performance', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getEmailPerformance(dateRangeData.start, dateRangeData.end),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const { data: campaignPerformance, isLoading: campaignLoading } = useQuery({
    queryKey: ['reports', 'campaign-performance', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getCampaignPerformance(dateRangeData.start, dateRangeData.end),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const { data: contactGrowth, isLoading: contactLoading } = useQuery({
    queryKey: ['reports', 'contact-growth', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getContactGrowth(dateRangeData.start, dateRangeData.end),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const { data: revenueBySource, isLoading: revenueLoading } = useQuery({
    queryKey: ['reports', 'revenue-by-source', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getRevenueBySource(dateRangeData.start, dateRangeData.end),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['reports', 'top-products', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getTopProducts(dateRangeData.start, dateRangeData.end, 5),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const { data: hourlyActivity, isLoading: hourlyLoading } = useQuery({
    queryKey: ['reports', 'hourly-activity', dateRangeData.start, dateRangeData.end],
    queryFn: () => reportsService.getHourlyActivity(dateRangeData.start, dateRangeData.end),
    enabled: !!dateRangeData.start && !!dateRangeData.end
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  const handleExport = async (format: string = 'csv') => {
    try {
      await reportsService.exportReport('overview', format, dateRangeData.start, dateRangeData.end);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isLoading = overviewLoading || emailLoading || campaignLoading || contactLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
            <option value="custom">טווח מותאם</option>
          </select>
          
          {dateRange === 'custom' && (
            <div className="flex space-x-2">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          )}

          <button 
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 ml-2" />
            ייצא CSV
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 ml-2" />
            ייצא PDF
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="סה"כ אנשי קשר"
          value={overview?.totalContacts || 0}
          icon={Users}
          iconColor="text-blue-500"
          change={{
            value: '+12%',
            type: 'positive'
          }}
        />
        <StatCard
          title="סה"כ הכנסות"
          value={formatCurrency(overview?.totalRevenue || 0)}
          icon={DollarSign}
          iconColor="text-green-500"
          change={{
            value: '+8.5%',
            type: 'positive'
          }}
        />
        <StatCard
          title="שיעור המרה"
          value={`${overview?.conversionRate || 0}%`}
          icon={Target}
          iconColor="text-purple-500"
          change={{
            value: '+2.1%',
            type: 'positive'
          }}
        />
        <StatCard
          title="שיעור פתיחה"
          value={`${overview?.emailOpenRate || 0}%`}
          icon={Eye}
          iconColor="text-orange-500"
          change={{
            value: '+1.2%',
            type: 'positive'
          }}
        />
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
          <AdvancedChart
            data={emailPerformance || []}
            type="area"
            xAxisKey="name"
            areas={[
              { dataKey: 'sent', fill: '#3B82F6', stroke: '#3B82F6', name: 'נשלח' },
              { dataKey: 'opened', fill: '#10B981', stroke: '#10B981', name: 'נפתח' },
              { dataKey: 'clicked', fill: '#F59E0B', stroke: '#F59E0B', name: 'נלחץ' }
            ]}
            height={300}
          />
        </div>

        {/* Revenue by Source */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">הכנסות לפי מקור</h3>
          </div>
          <AdvancedChart
            data={revenueBySource || []}
            type="pie"
            pieData={revenueBySource || []}
            height={300}
          />
        </div>
      </div>

      {/* Contact Growth Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">גידול אנשי קשר</h3>
        </div>
        <AdvancedChart
          data={contactGrowth || []}
          type="line"
          xAxisKey="name"
          lines={[
            { dataKey: 'new', stroke: '#3B82F6', name: 'אנשי קשר חדשים' },
            { dataKey: 'total', stroke: '#10B981', name: 'סה"כ אנשי קשר' }
          ]}
          height={300}
        />
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
                {(campaignPerformance || []).map((campaign: any, index: number) => (
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
            {(topProducts || []).map((product: any, index: number) => (
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
          <AdvancedChart
            data={hourlyActivity || []}
            type="bar"
            xAxisKey="hour"
            bars={[
              { dataKey: 'activity', fill: '#3B82F6', name: 'פעילות' }
            ]}
            height={250}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="שיעור פתיחה ממוצע"
          value={`${overview?.emailOpenRate || 0}%`}
          icon={Eye}
          iconColor="text-blue-500"
        />
        <StatCard
          title="שיעור לחיצה ממוצע"
          value={`${overview?.clickRate || 0}%`}
          icon={Click}
          iconColor="text-green-500"
        />
        <StatCard
          title="ערך הזמנה ממוצע"
          value={formatCurrency(overview?.avgOrderValue || 0)}
          icon={ShoppingCart}
          iconColor="text-purple-500"
        />
        <StatCard
          title="המרת פופאפים"
          value={`${overview?.popupConversion || 0}%`}
          icon={Target}
          iconColor="text-orange-500"
        />
      </div>
    </div>
  );
};
