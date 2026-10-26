import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { citizenApi } from '../../services/citizenApi';
import { 
  LayoutDashboard, MapPin, AlertCircle, FileText, 
  Settings, Bell, Search, LogOut, Menu, X, Activity, User, Map, MessageSquare
} from 'lucide-react';
import axios from 'axios';

export default function CitizenLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [citizenName, setCitizenName] = useState('Citizen');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchDashboardInfo();
  }, [location.pathname]);

  const fetchDashboardInfo = async () => {
    try {
      const res = await citizenApi.getDashboardSummary();
      if (res.success && res.data) {
        setCitizenName(res.data.user?.full_name || 'Citizen');
        setUnreadCount(res.data.unread_notifications || 0);
      }
      const msgRes = await citizenApi.getUnreadMessageCount();
      if (msgRes.success) {
        setUnreadMessagesCount(msgRes.unread_count || 0);
      }

      // Sync user theme & accessibility preferences
      const settingsRes = await citizenApi.getSettings();
      if (settingsRes.success && settingsRes.data?.preferences) {
        const prefs = settingsRes.data.preferences;
        const root = document.documentElement;
        if (prefs.theme === 'DARK') root.classList.add('dark');
        else if (prefs.theme === 'LIGHT') root.classList.remove('dark');
        else {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
          else root.classList.remove('dark');
        }
        if (prefs.text_size) root.setAttribute('data-text-size', prefs.text_size);
        if (prefs.reduce_motion) root.setAttribute('data-reduce-motion', 'true');
        else root.removeAttribute('data-reduce-motion');
      }
    } catch (error) {
      console.error("Failed to load dashboard info", error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (e) {}
    window.location.href = '/citizen/login';
  };

  const navGroups = [
    {
      name: 'OVERVIEW',
      items: [
        { path: '/citizen/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
      ]
    },
    {
      name: 'AI SERVICES',
      items: [
        { path: '/citizen/assistant', icon: MessageSquare, label: 'AI Municipal Assistant' }
      ]
    },
    {
      name: 'SERVICES',
      items: [
        { path: '/citizen/request-service', icon: FileText, label: 'Request a Service' },
        { path: '/citizen/report', icon: AlertCircle, label: 'Report an Issue' },
        { path: '/citizen/municipal-services', icon: Activity, label: 'Municipal Services' },
        { path: '/citizen/announcements', icon: Bell, label: 'Announcements' }
      ]
    },
    {
      name: 'MY ACTIVITY',
      items: [
        { path: '/citizen/services', icon: FileText, label: 'My Service Requests' },
        { path: '/citizen/reports', icon: AlertCircle, label: 'My Reports' },
        { path: '/citizen/history', icon: Activity, label: 'Request History' },
        { path: '/citizen/feedback', icon: MessageSquare, label: 'Feedback' }
      ]
    },
    {
      name: 'CITY',
      items: [
        { path: '/citizen/map', icon: MapPin, label: 'Municipal Map' },
        { path: '/citizen/nearby', icon: Map, label: 'Nearby Issues' },
        { path: '/citizen/ward-info', icon: LayoutDashboard, label: 'Ward Information' }
      ]
    },
    {
      name: 'COMMUNICATION',
      items: [
        { path: '/citizen/notifications', icon: Bell, label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
        { path: '/citizen/messages', icon: MessageSquare, label: 'Messages', badge: unreadMessagesCount > 0 ? unreadMessagesCount : null }
      ]
    },
    {
      name: 'ACCOUNT',
      items: [
        { path: '/citizen/profile', icon: User, label: 'My Profile' },
        { path: '/citizen/settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div 
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30 flex flex-col h-full shadow-xl lg:shadow-none"
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900 leading-tight">MUNICIPAL<br/>MONITOR</h1>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-gray-100 bg-teal-50/50">
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">Citizen Portal</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm mr-3">
                    {citizenName.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{citizenName}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {navGroups.map((group, idx) => (
                  <div key={idx}>
                    <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{group.name}</p>
                    <div className="space-y-1">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const active = location.pathname.startsWith(item.path);
                        return (
                          <Link 
                            key={item.path} 
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                              active ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mr-3 ${active ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                            {item.label}
                            {(item as any).badge && (
                              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {(item as any).badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3 text-gray-400" /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-3 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden md:flex relative w-64 lg:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search municipal services..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/citizen/notifications" className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </Link>
            
            <div className="h-8 border-l border-gray-200 mx-1"></div>
            
            <Link to="/citizen/profile" className="flex items-center hover:bg-gray-50 rounded-full p-1 pr-3 transition-colors">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm mr-2 shrink-0 border border-teal-200">
                {citizenName.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">{citizenName}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
