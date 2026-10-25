import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  Map as MapIcon,
  AlertTriangle,
  FileText,
  Users,
  Settings,
  LogOut,
  Bell,
  CheckCircle,
  Activity,
  Cpu
} from 'lucide-react';

const AuthorityLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Command Center', path: '/authority/dashboard', icon: BarChart2 },
    { name: 'Citizen Reports', path: '/authority/reports', icon: FileText },
    { name: 'Operations', path: '/authority/operations', icon: Users },
    { name: 'GIS Intelligence', path: '/authority/gis', icon: MapIcon },
    { name: 'AI Insights', path: '/authority/ai-insights', icon: Cpu },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className="w-72 bg-[#1e293b] border-r border-slate-700/50 flex flex-col shadow-2xl relative z-10">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/40 to-transparent">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wider">MONITOR</h1>
              <p className="text-xs text-blue-400 font-medium tracking-widest">COMMAND CENTER</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2 px-3">Oversight & Intelligence</p>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                )}
                <Icon size={20} className={`mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-50"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50 bg-[#1e293b]">
          <div className="flex items-center p-3 mb-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg">
              HO
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Higher Official</p>
              <p className="text-xs text-slate-400">System Oversight</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#020617] -z-10"></div>
        
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-between px-8 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {menuItems.find(i => location.pathname.startsWith(i.path))?.name || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                <AlertTriangle size={18} className="text-orange-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold ring-2 ring-[#0f172a]">
                  3
                </span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700/50"></div>
            <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthorityLayout;
