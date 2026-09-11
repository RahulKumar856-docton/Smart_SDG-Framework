import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, Search, CheckCircle2, AlertCircle, X, CheckCheck, Archive, FileText, CheckSquare, Target, Activity
} from 'lucide-react';

export default function OfficerNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // In a real app we'd setup SSE or Polling here.
    // For now we simulate with a 15s polling.
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/officer/notifications');
      setNotifications(res.data.data || []);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 401) window.location.href = '/officer/login';
      if (loading) setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.patch(`/api/officer/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/officer/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`/api/officer/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      // Fallback inference based on type/entity_type if action_url is not set
      switch (notification.type?.toUpperCase()) {
        case 'PROJECT': navigate(`/officer/projects`); break;
        case 'REQUEST': navigate(`/officer/requests`); break;
        case 'INSPECTION': navigate(`/officer/inspections`); break;
        case 'KPI': navigate(`/officer/kpis`); break;
        case 'EVIDENCE': navigate(`/officer/evidence`); break;
        case 'RISK': navigate(`/officer/risk`); break;
        case 'REPORT': navigate(`/officer/reports`); break;
        case 'PERFORMANCE': navigate(`/officer/sdg`); break;
        default: break; // Do nothing
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PROJECT': return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'INSPECTION': return <CheckSquare className="w-5 h-5 text-green-500" />;
      case 'KPI': return <Target className="w-5 h-5 text-blue-500" />;
      case 'RISK': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PERFORMANCE': return <Activity className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'UNREAD') return matchSearch && !n.is_read;
    if (filter === 'IMPORTANT') return matchSearch && ['HIGH', 'CRITICAL'].includes(n.priority?.toUpperCase());
    return matchSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const importantCount = notifications.filter(n => ['HIGH', 'CRITICAL'].includes(n.priority?.toUpperCase())).length;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 animate-pulse rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4"><div className="h-24 bg-slate-200 animate-pulse rounded-xl col-span-4"></div></div>
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
        <button onClick={fetchNotifications} className="px-6 py-2 bg-slate-900 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-blue-600" /> NOTIFICATIONS
          </h1>
          <p className="text-slate-500 mt-2">Stay updated on assignments, approvals, inspections, risks and municipal operations.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center transition-colors">
            <CheckCheck className="w-4 h-4 mr-2" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 mb-1">ALL NOTIFICATIONS</p>
          <h3 className="text-2xl font-black text-slate-900">{notifications.length}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-bold text-blue-600 mb-1">UNREAD</p>
          <h3 className="text-2xl font-black text-blue-700">{unreadCount}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-bold text-red-600 mb-1">IMPORTANT</p>
          <h3 className="text-2xl font-black text-red-700">{importantCount}</h3>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button 
            onClick={() => setFilter('ALL')} 
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filter === 'ALL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('UNREAD')} 
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filter === 'UNREAD' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Unread
          </button>
          <button 
            onClick={() => setFilter('IMPORTANT')} 
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filter === 'IMPORTANT' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Important
          </button>
        </div>
      </div>

      {/* List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">You're all caught up!</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            You don't have any new notifications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.map(notification => (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex items-start p-5 bg-white border rounded-xl shadow-sm transition-all relative overflow-hidden ${
                  !notification.is_read ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200 opacity-80'
                }`}
              >
                {!notification.is_read && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                
                <div className={`p-3 rounded-xl mr-4 flex-shrink-0 ${!notification.is_read ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(notification.priority)}`}>
                      {notification.priority || 'INFO'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{notification.type || 'SYSTEM NOTIFICATION'}</span>
                  </div>
                  
                  <h4 className={`text-base mb-1 ${!notification.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                    {notification.title}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(notification.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </span>
                    
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                      View Action →
                    </button>
                  </div>
                </div>

                <div className="flex flex-col ml-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.is_read && (
                    <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Mark as Read">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Archive">
                    <Archive className="w-5 h-5" />
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
