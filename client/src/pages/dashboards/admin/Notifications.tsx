import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Filter, 
  Search, Archive, Clock, MoreVertical, ChevronRight, X, XCircle, FileText, CheckCircle, Activity,
  Calendar, Layers
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  'Projects', 'Citizen Requests', 'Inspections', 'Evidence', 
  'Data Quality', 'Impact', 'Risk', 'GIS', 'Reports', 'System'
];

const PRIORITIES = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['ALL', 'UNREAD', 'READ'];
const DATE_RANGES = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month'];

export default function Notifications() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, unread: 0, critical: 0, action_required: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    date_range: 'Last 30 Days',
    module: '',
    priority: '',
    status: 'ALL',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  useEffect(() => {
    loadStats();
    loadNotifications();
  }, [filters]);

  const loadStats = async () => {
    try {
      const res = await adminApi.getNotificationStats();
      if (res.success) setStats(res.data);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const queryParams: any = { ...filters };
      if (!queryParams.module) delete queryParams.module;
      if (!queryParams.priority) delete queryParams.priority;
      if (queryParams.status === 'ALL') delete queryParams.status;
      
      const res = await adminApi.getNotifications(queryParams);
      if (res.success) setNotifications(res.data);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await adminApi.markNotificationRead(id);
      loadNotifications();
      loadStats();
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif({ ...selectedNotif, is_read: 1, read_at: new Date().toISOString() });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await adminApi.archiveNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      loadStats();
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!window.confirm("Are you sure you want to mark all unread notifications as read?")) return;
    try {
      await adminApi.markAllNotificationsRead();
      loadNotifications();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const navigateToAction = (url: string) => {
    if (url) {
      navigate(url);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM': return <Info className="w-5 h-5 text-blue-500" />;
      case 'LOW': return <Info className="w-5 h-5 text-slate-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-200">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">MEDIUM</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full border border-slate-200">{priority}</span>;
    }
  };

  const getModuleColor = (module: string) => {
    if (!module) return 'bg-gray-100 text-gray-800';
    const m = module.toLowerCase();
    if (m.includes('project')) return 'bg-indigo-100 text-indigo-800';
    if (m.includes('request')) return 'bg-teal-100 text-teal-800';
    if (m.includes('inspect')) return 'bg-amber-100 text-amber-800';
    if (m.includes('evidence')) return 'bg-emerald-100 text-emerald-800';
    if (m.includes('data')) return 'bg-purple-100 text-purple-800';
    if (m.includes('risk')) return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-12 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-8 flex flex-col justify-between shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 text-slate-800 opacity-50 pointer-events-none">
          <Bell size={250} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center text-sm text-slate-400 mb-2">
            <span>Home</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Admin</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-slate-200 font-medium">Notifications</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center mb-2 tracking-tight">
                <Bell className="h-8 w-8 mr-3 text-indigo-400" />
                Notifications Center
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm">
                Monitor important municipal activities, alerts, approvals, verification requests and system events.
              </p>
            </div>
            {stats.unread > 0 && (
              <button onClick={handleMarkAllRead} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors shadow-sm flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark All as Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="px-8 mt-[-30px] relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Notifications</h3>
              <Layers className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Unread</h3>
              <div className="relative">
                <Bell className="h-4 w-4 text-slate-500" />
                {stats.unread > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.unread}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 flex flex-col bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-red-600 uppercase">Critical Alerts</h3>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 flex flex-col bg-orange-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-orange-600 uppercase">Action Required</h3>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-700">{stats.action_required}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 mt-6 flex flex-col lg:flex-row gap-6">
        
        {/* List Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-t-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setFilters({...filters, status: 'ALL'})}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filters.status === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilters({...filters, status: 'UNREAD'})}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filters.status === 'UNREAD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Unread
                </button>
              </div>

              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filters.module || filters.priority || filters.date_range !== 'Last 30 Days') && (
                  <span className="ml-2 flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 border-x border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date Range</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.date_range}
                  onChange={e => setFilters({...filters, date_range: e.target.value})}
                >
                  {DATE_RANGES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Module</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.module}
                  onChange={e => setFilters({...filters, module: e.target.value})}
                >
                  <option value="">All Modules</option>
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Priority</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.priority}
                  onChange={e => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-end justify-end">
                <button 
                  onClick={() => setFilters({date_range: 'Last 30 Days', module: '', priority: '', status: 'ALL', search: ''})}
                  className="text-xs text-gray-500 hover:text-gray-700 underline mb-2"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 overflow-hidden flex-1 flex flex-col">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Activity className="h-8 w-8 text-slate-400 animate-spin mb-3" />
                <p className="text-slate-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <Bell className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications yet</h3>
                <p className="text-slate-500 max-w-sm">
                  Important municipal activities, verification requests, and system alerts will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => {
                  const isUnread = notif.is_read === 0;
                  return (
                    <li 
                      key={notif.id} 
                      className={`relative flex items-start p-4 hover:bg-slate-50 transition-colors cursor-pointer ${isUnread ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => {
                        setSelectedNotif(notif);
                        if (isUnread) handleMarkRead(notif.id);
                      }}
                    >
                      {/* Unread dot */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                      )}
                      
                      <div className="shrink-0 mr-4 mt-1">
                        {getPriorityIcon(notif.priority)}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center text-xs text-slate-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(notif.created_at).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <p className={`text-sm mb-2 line-clamp-2 ${isUnread ? 'text-slate-700' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getModuleColor(notif.module)}`}>
                            {notif.module || 'System'}
                          </span>
                          {notif.priority !== 'INFO' && notif.priority !== 'LOW' && getPriorityBadge(notif.priority)}
                        </div>
                      </div>
                      
                      <div className="shrink-0 ml-4">
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            
            <div className="bg-slate-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-sm text-slate-500">
              <span>Showing {notifications.length} notifications</span>
            </div>
          </div>
        </div>

      </div>

      {/* Detail Drawer */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                Notification Details
              </h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleArchive(selectedNotif.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Archive Notification"
                >
                  <Archive className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getModuleColor(selectedNotif.module)}`}>
                  {selectedNotif.module || 'System'}
                </span>
                {getPriorityBadge(selectedNotif.priority)}
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-4">{selectedNotif.title}</h1>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-6 text-sm text-slate-700 leading-relaxed">
                {selectedNotif.message}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Metadata</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-400 mb-1">Created At</span>
                    <span className="font-medium text-slate-900">
                      {new Date(selectedNotif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Status</span>
                    <span className="font-medium text-slate-900 flex items-center">
                      {selectedNotif.is_read ? <CheckCircle className="w-4 h-4 text-green-500 mr-1" /> : <Bell className="w-4 h-4 text-amber-500 mr-1" />}
                      {selectedNotif.is_read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Read At</span>
                    <span className="font-medium text-slate-900">
                      {selectedNotif.read_at ? new Date(selectedNotif.read_at).toLocaleString() : '-'}
                    </span>
                  </div>
                  {selectedNotif.entity_type && (
                    <div>
                      <span className="block text-slate-400 mb-1">Related Entity</span>
                      <span className="font-medium text-slate-900">
                        {selectedNotif.entity_type} {selectedNotif.entity_id ? `#${selectedNotif.entity_id}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Drawer Footer with Action Button */}
            {selectedNotif.action_url && (
              <div className="p-6 border-t border-gray-200 bg-slate-50 shrink-0">
                <button 
                  onClick={() => navigateToAction(selectedNotif.action_url)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                >
                  View Related Content <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
