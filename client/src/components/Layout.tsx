import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  HelpCircle,
  Search,
  Mail,
  MessageSquare,
  Package,
  Filter,
  BarChart3,
  Calendar,
  Phone,
  Code
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'דשבורד', href: '/dashboard', icon: Home },
  { name: 'אנשי קשר', href: '/contacts', icon: Users },
  { name: 'קמפיינים', href: '/campaigns', icon: Mail },
  { name: 'SMS', href: '/sms', icon: Phone },
  { name: 'אוטומציה', href: '/automations', icon: Activity },
  { name: 'פופאפים', href: '/popups', icon: MessageSquare },
  { name: 'מוצרים', href: '/products', icon: Package },
  { name: 'אירועים', href: '/events', icon: Calendar },
  { name: 'סגמנטים', href: '/segments', icon: Filter },
  { name: 'דוחות', href: '/reports', icon: BarChart3 },
  { name: 'סקריפט מעקב', href: '/tracking-setup', icon: Code },
  { name: 'הגדרות', href: '/settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -ml-12 pt-2">
            <button
              type="button"
              className="mr-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="mr-3 text-xl font-semibold text-gray-900">Poply</span>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-all`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'
                      } ml-3 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white shadow-sm">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6 mb-8">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">F</span>
                  </div>
                  <span className="mr-3 text-xl font-semibold text-gray-900">Poply</span>
                </div>
              </div>
              <nav className="flex-1 px-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'
                        } ml-3 h-5 w-5`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              
              {/* Upgrade section */}
              <div className="px-3 mb-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-1">שדרג לPro</h3>
                <p className="text-primary-100 text-xs mb-3">קבל חודש חינם<br/>ופתח אפשרויות נוספות</p>
                <button className="w-full bg-white text-primary-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  שדרג עכשיו
                </button>
                </div>
              </div>
            </div>
            
            {/* Bottom section */}
            <div className="border-t border-gray-200 p-3 space-y-1">
              <Link
                to="/help"
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all"
              >
                <HelpCircle className="ml-3 h-5 w-5 text-gray-400" />
                עזרה ומידע
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all"
              >
                <LogOut className="ml-3 h-5 w-5 text-gray-400" />
                יציאה
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-soft">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex justify-center">
              <div className="w-full flex md:mr-0 max-w-lg">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pr-10 pl-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-right"
                    placeholder="חיפוש..."
                  />
                </div>
              </div>
            </div>
            <div className="mr-4 flex items-center md:mr-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                </div>
                <div className="mr-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{user?.email?.split('@')[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};