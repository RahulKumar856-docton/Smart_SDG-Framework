import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, ShieldCheck, Key, Settings, 
  Building2, Cpu, ShieldAlert, FileText, Activity, 
  Sliders, LogOut, Menu, X, Bell, Database, CheckCircle2,
  AlertTriangle, Layers, Zap, Clock, Terminal, Search
} from 'lucide-react';
import axios from 'axios';

export default function SystemLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dbHealthy, setDbHealthy] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check current auth profile
    axios.get('/api/auth/me')
      .then(res => {
        if (res.data.success) {
          setUser(res.data.data);
          // If somehow not superadmin, bounce them
          if ((res.data.data.role || '').toUpperCase() !== 'SUPER_ADMIN') {
            navigate('/admin/dashboard', { replace: true });
          }
        }
      })
      .catch(() => {
        navigate('/system-access/login', { replace: true });
      });

    // Check system telemetry ping
    axios.get('/api/system/overview')
      .then(res => {
        if (res.data.success) {
          setDbHealthy(res.data.system_health?.database_connected ?? true);
        }
      })
      .catch(() => setDbHealthy(false));
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('user_data');
      navigate('/system-access/login');
    }
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/system/dashboard', icon: LayoutDashboard, label: 'System Dashboard' }
      ]
    },
    {
      title: 'USER ACCESS',
      items: [
        { path: '/system/users', icon: Users, label: 'User Management' },
        { path: '/system/admin-accounts', icon: ShieldCheck, label: 'Admin Accounts' },
        { path: '/system/roles-permissions', icon: Key, label: 'Roles & Permissions' }
      ]
    },
    {
      title: 'MUNICIPAL CONFIGURATION',
      items: [
        { path: '/system/departments', icon: Building2, label: 'Departments' },
        { path: '/system/wards-services', icon: Layers, label: 'Wards & Services' },
        { path: '/system/categories', icon: Sliders, label: 'Categories' },
        { path: '/system/sla-policies', icon: Clock, label: 'SLA Policies' },
        { path: '/system/escalation-rules', icon: Zap, label: 'Escalation Rules' }
      ]
    },
    {
      title: 'AI & INTEGRATIONS',
      items: [
        { path: '/system/ai-configuration', icon: Cpu, label: 'AI Configuration' },
        { path: '/system/model-performance', icon: Activity, label: 'Model Performance' },
        { path: '/system/integrations', icon: Terminal, label: 'Integrations' }
      ]
    },
    {
      title: 'SECURITY',
      items: [
        { path: '/system/security', icon: ShieldAlert, label: 'Security Monitoring' },
        { path: '/system/audit-logs', icon: FileText, label: 'Audit Logs' },
        { path: '/system/access-history', icon: Search, label: 'Access History' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/system/health', icon: Database, label: 'System Health' },
        { path: '/system/notifications', icon: Bell, label: 'Notifications' },
        { path: '/system/settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR (Desktop) */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-30 select-none shadow-2xl`}
      >
        {/* Brand / Root Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/10 shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider uppercase text-white truncate">
                  MUNICIPAL MONITOR
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
                  ROOT SYSTEM ADMIN
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {isSidebarOpen && (
                <div className="px-3 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/system/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive 
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Super Admin Status Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'S'}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{user?.username || 'Super Administrator'}</div>
                <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Root Privilege
                </div>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Terminate root session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="relative w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">
                  MUNICIPAL SYSTEM ADMIN
                </span>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {navGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2">
                      {group.title}
                    </div>
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
                      >
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>Municipal Monitor — System Administration</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
                  ROOT
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Authoritative platform infrastructure, access governance & audit telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live DB indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              dbHealthy 
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span>DB: {dbHealthy ? 'HEALTHY' : 'DEGRADED'}</span>
            </div>

            {/* Quick Link to Operational Admin (Super Admin can inspect Admin view) */}
            <Link 
              to="/admin/dashboard"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              Operational View
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* BODY OUTLET */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
