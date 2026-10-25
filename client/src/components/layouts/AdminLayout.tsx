import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../services/adminApi';
import { 
  LayoutDashboard, FolderKanban, Users, Activity, 
  Map, FileText, Settings, Bell, Search, LogOut, 
  Menu, X, AlertTriangle, ShieldCheck, Database, FileDigit, Globe, Target, FileCheck
} from 'lucide-react';
import axios from 'axios';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await adminApi.getNotificationStats();
        if (res.success) {
          setUnreadCount(res.data.unread);
        }
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    };
    
    fetchUnread();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]); // Refresh when navigating

  React.useEffect(() => {
    axios.get('/api/auth/me').then(res => {
      if (res.data.success) setUser(res.data.data);
    }).catch(err => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/admin/users', icon: Users, label: 'Authorized Users' },
        { path: '/admin/departments', icon: FolderKanban, label: 'Departments & Services' },
        { path: '/admin/communications', icon: Bell, label: 'Communications' }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/admin/citizen-requests', icon: Activity, label: 'Report Overview' },
        { path: '/admin/sdg', icon: Target, label: 'SLA Monitoring' },
        { path: '/admin/inspections', icon: FileCheck, label: 'Operational Activity' },
        { path: '/admin/evidence', icon: FileDigit, label: 'Evidence Verification' },
        { path: '/admin/gis', icon: Map, label: 'Municipal GIS Map' }
      ]
    },
    {
      title: 'INTELLIGENCE & REPORTING',
      items: [
        { path: '/admin/analytics', icon: Activity, label: 'Operational Analytics' },
        { path: '/admin/risk-ai', icon: AlertTriangle, label: 'Risk Analysis' },
        { path: '/admin/data-quality', icon: Database, label: 'Data Quality' },
        { path: '/admin/impact', icon: Globe, label: 'Impact Analysis' },
        { path: '/admin/reports', icon: FileText, label: 'Reports Center' }
      ]
    },
    {
      title: 'ACCOUNT & SYSTEM',
      items: [
        { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex-shrink-0 flex flex-col z-20 transition-all duration-300 border-r border-slate-800"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center overflow-hidden">
            <ShieldCheck className="w-8 h-8 text-blue-500 shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="ml-3 font-bold text-sm tracking-wide whitespace-nowrap">
                  MUNICIPAL MONITOR
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hidden md:block">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              {isSidebarOpen && <p className="px-6 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{group.title}</p>}
              <ul className="space-y-1">
                {group.items.map(item => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <li key={item.path}>
                      <Link 
                        to={item.path} 
                        className={`flex items-center px-6 py-2.5 mx-2 rounded-lg transition-colors group ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        {isSidebarOpen && <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-500 mr-4">
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Breadcrumbs Placeholder (Static for now, can be dynamic based on location) */}
            <div className="hidden sm:flex text-sm text-slate-500 font-medium">
              Home <span className="mx-2">/</span> Admin <span className="mx-2">/</span> 
              <span className="text-slate-900 ml-2 capitalize">{location.pathname.split('/').pop()?.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none w-48 transition-all" />
            </div>
            
            <button 
              onClick={() => navigate('/admin/notifications')}
              className="text-slate-500 hover:text-slate-700 relative p-1.5 bg-slate-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center border-l border-gray-200 pl-4 ml-2">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.full_name || user?.username || 'Administrator'}</p>
                <p className="text-xs font-bold tracking-wide uppercase text-indigo-600">
                  {user?.role === 'SUPER_ADMIN' || user?.username === 'superadmin' ? '👑 Super Admin' : 'Administrator'}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-full ${user?.role === 'SUPER_ADMIN' || user?.username === 'superadmin' ? 'bg-amber-500' : 'bg-blue-600'} text-white flex items-center justify-center font-bold shadow-sm`}>
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <button onClick={handleLogout} className="ml-4 text-slate-400 hover:text-red-600 transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 relative">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// A quick icon stub for FileCheck since it was missed in the lucide-react import list above
const FileCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
);
