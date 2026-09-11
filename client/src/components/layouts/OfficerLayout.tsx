import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, FolderKanban, Activity, 
  Settings, Bell, Search, LogOut, FileCheck, Target,
  Menu, ShieldCheck, MapPin, ClipboardList, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

export default function OfficerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    axios.get('/api/auth/me').then(res => {
      if (res.data.success) setUser(res.data.data);
    }).catch(err => console.error(err));

    const fetchUnread = () => {
      axios.get('/api/officer/notifications/unread-count')
        .then(res => setUnreadCount(res.data.data.count))
        .catch(err => console.error(err));
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
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
        { path: '/officer/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
      ]
    },
    {
      title: 'MY WORK',
      items: [
        { path: '/officer/projects', icon: FolderKanban, label: 'Assigned Projects' },
        { path: '/officer/requests', icon: Activity, label: 'Citizen Requests' },
        { path: '/officer/inspections', icon: MapPin, label: 'Field Inspections' },
        { path: '/officer/kpis', icon: Target, label: 'KPI Updates' },
        { path: '/officer/evidence', icon: FileCheck, label: 'Evidence' }
      ]
    },
    {
      title: 'MONITORING',
      items: [
        { path: '/officer/sdg', icon: Target, label: 'Project Performance' },
        { path: '/officer/risk', icon: AlertTriangle, label: 'Risk Alerts' },
      ]
    },
    {
      title: 'REPORTING',
      items: [
        { path: '/officer/reports', icon: ClipboardList, label: 'Inspection Reports' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { path: '/officer/notifications', icon: Bell, label: 'Notifications' },
        { path: '/officer/profile', icon: Settings, label: 'Profile' }
      ]
    }
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-teal-900 text-white flex-shrink-0 flex flex-col z-20 transition-all duration-300 border-r border-teal-800"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-teal-800 shrink-0">
          <div className="flex items-center overflow-hidden">
            <ShieldCheck className="w-8 h-8 text-green-400 shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="ml-3 font-bold text-sm tracking-wide whitespace-nowrap">
                  FIELD OFFICER
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-teal-400 hover:text-white transition-colors p-1 rounded-md hidden md:block">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              {isSidebarOpen && <p className="px-6 text-xs font-bold text-teal-400/70 mb-2 uppercase tracking-wider">{group.title}</p>}
              <ul className="space-y-1">
                {group.items.map(item => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <li key={item.path}>
                      <Link 
                        to={item.path} 
                        className={`flex items-center px-6 py-2.5 mx-2 rounded-lg transition-colors group ${isActive ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-800 hover:text-white'}`}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-green-400' : 'text-teal-400 group-hover:text-green-300'}`} />
                        {isSidebarOpen && <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.label}</span>}
                        {isSidebarOpen && item.path === '/officer/notifications' && unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
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
            
            {/* Breadcrumbs */}
            <div className="hidden sm:flex text-sm text-slate-500 font-medium">
              Home <span className="mx-2">/</span> Officer <span className="mx-2">/</span> 
              <span className="text-slate-900 ml-2 capitalize">{location.pathname.split('/').pop()?.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none w-48 transition-all" />
            </div>
            
            <Link to="/officer/notifications" className="text-slate-500 hover:text-slate-700 relative p-1.5 bg-slate-100 rounded-full cursor-pointer">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border border-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="flex items-center border-l border-gray-200 pl-4 ml-2">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Officer</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'O'}
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
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
