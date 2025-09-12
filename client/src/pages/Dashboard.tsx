import React from 'react';
import { 
  Users, 
  Mail, 
  Zap, 
  MessageSquare, 
  Package, 
  Activity, 
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AdvancedChart } from '../components/AdvancedChart';
import { ActivityFeed } from '../components/ActivityFeed';

// נתוני גרף ביצועים
const performanceData = [
  { date: '01', thisMonth: 12, lastMonth: 8 },
  { date: '02', thisMonth: 10, lastMonth: 12 },
  { date: '03', thisMonth: 18, lastMonth: 14 },
  { date: '04', thisMonth: 15, lastMonth: 16 },
  { date: '05', thisMonth: 20, lastMonth: 18 },
  { date: '06', thisMonth: 25, lastMonth: 20 },
  { date: '07', thisMonth: 22, lastMonth: 24 },
];

// נתוני משימות
const currentTasks = [
  {
    id: '1',
    title: 'סקירת קמפיין אימייל חודשי',
    status: 'in-progress',
    time: '4 שעות',
  },
  {
    id: '2',
    title: 'עדכון סגמנטים לקהלי יעד',
    status: 'on-hold',
    time: '8 שעות',
  },
  {
    id: '3',
    title: 'פיתוח אוטומציה לעגלה נטושה',
    status: 'done',
    time: '32 שעות',
  },
];

// נתוני פעילות אחרונה
const activities = [
  {
    id: '1',
    user: {
      name: 'דניאל כהן',
      initials: 'דכ',
    },
    action: 'הוסיף תגובה ב',
    target: 'קמפיין חג הפסח',
    targetType: 'project' as const,
    time: '10:15',
    icon: 'comment' as const,
  },
  {
    id: '2',
    user: {
      name: 'מירי לוי',
      initials: 'מל',
    },
    action: 'העלתה קובץ ל',
    target: 'תבניות אימייל',
    targetType: 'project' as const,
    time: '10:15',
    icon: 'upload' as const,
  },
  {
    id: '3',
    user: {
      name: 'יוסי ברק',
      initials: 'יב',
    },
    action: 'סיים משימה ב',
    target: 'אוטומציה חדשה',
    targetType: 'project' as const,
    time: '10:15',
    icon: 'comment' as const,
  },
];

export const Dashboard: React.FC = () => {
  const userData = { firstName: 'מרגרט', lastName: 'כהן' };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">שלום, {userData.firstName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            עקוב אחר התקדמות הצוות שלך כאן. אתה כמעט מגיע ליעד!
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('he-IL', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="הושלמו"
          value="18"
          subtitle="+8 משימות"
          change={{ value: '+8 משימות', type: 'positive' }}
          icon={CheckCircle}
          iconColor="text-accent-green"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="זמן מעקב"
          value="31 שעות"
          subtitle="-6 שעות"
          change={{ value: '-6 שעות', type: 'negative' }}
          icon={Clock}
          iconColor="text-accent-red"
          iconBgColor="bg-red-100"
        />
        <StatCard
          title="יעילות"
          value="93%"
          subtitle="+12%"
          change={{ value: '+12%', type: 'positive' }}
          icon={TrendingUp}
          iconColor="text-accent-green"
          iconBgColor="bg-green-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">ביצועים</h3>
            <select className="text-sm text-gray-600 bg-transparent border-0 focus:ring-0 cursor-pointer">
              <option>01-07 מאי</option>
              <option>08-14 מאי</option>
              <option>15-21 מאי</option>
            </select>
          </div>
          <AdvancedChart
            type="line"
            data={performanceData}
            xAxisKey="date"
            dataKey=""
            lines={[
              { dataKey: 'thisMonth', stroke: '#8b5cf6', name: 'החודש' },
              { dataKey: 'lastMonth', stroke: '#f97316', name: 'חודש שעבר' },
            ]}
            height={250}
            showGrid={true}
            curved={true}
          />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={activities} title="פעילות" />
        </div>
      </div>

      {/* Current Tasks */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">משימות נוכחיות</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">הושלמו 30%</span>
            <select className="text-sm text-gray-600 bg-transparent border-0 focus:ring-0 cursor-pointer">
              <option>שבוע</option>
              <option>חודש</option>
              <option>שנה</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {currentTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    task.status === 'done' 
                      ? 'border-accent-green bg-accent-green' 
                      : task.status === 'in-progress'
                      ? 'border-primary-500'
                      : 'border-orange-400'
                  }`}
                >
                  {task.status === 'done' && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  task.status === 'done'
                    ? 'bg-green-100 text-green-700'
                    : task.status === 'in-progress'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {task.status === 'done' ? 'הושלם' : task.status === 'in-progress' ? 'בתהליך' : 'בהמתנה'}
                </span>
                <span className="text-sm text-gray-500">{task.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};