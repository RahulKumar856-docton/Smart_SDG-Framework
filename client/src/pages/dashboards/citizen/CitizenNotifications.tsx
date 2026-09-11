import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Info, ShieldAlert, CheckCircle, Clock, 
  Search, Check, CheckCheck, Loader2, Wrench, AlertTriangle, FileText, Megaphone
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';
import { motion, AnimatePresence } from 'framer-motion';

export default function CitizenNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await citizenApi.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      } else {
        setError('Failed to load notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await citizenApi.markNotificationAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        // Force header update logic if a global state was used, otherwise reloading dashboard summary handles it.
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await citizenApi.markAllNotificationsAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      try {
        await citizenApi.markNotificationAsRead(notif.id);
        // Optimistically update local state just in case
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      } catch (e) {}
    }
    
    // Routing logic
    if (notif.entity_type === 'CITIZEN_REQUEST' || notif.type === 'CITIZEN_REQUEST') {
      if (notif.entity_id || notif.action_url) {
         navigate(notif.action_url || `/citizen/requests/${notif.entity_id}`);
      } else {
         navigate('/citizen/requests');
      }
    } else if (notif.entity_type === 'CITIZEN_REPORT' || notif.type === 'CITIZEN_REPORT' || notif.type === 'REPORT') {
      if (notif.entity_id || notif.action_url) {
         navigate(notif.action_url || `/citizen/reports/${notif.entity_id}`);
      } else {
         navigate('/citizen/reports');
      }
    } else if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (diffInSeconds < 172800) return 'Yesterday';
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getIcon = (type: string, priority: string) => {
    if (type === 'CITIZEN_REQUEST') return <Wrench className="w-5 h-5 text-blue-500" />;
    if (type === 'CITIZEN_REPORT' || type === 'REPORT') return <FileText className="w-5 h-5 text-orange-500" />;
    if (type === 'SYSTEM_ANNOUNCEMENT' || type === 'ANNOUNCEMENT') return <Megaphone className="w-5 h-5 text-purple-500" />;
    
    switch(priority?.toUpperCase()) {
      case 'HIGH': 
      case 'CRITICAL': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-teal-500" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) || 
        (n.message && n.message.toLowerCase().includes(q))
      );
    }

    // Tabs
    if (activeTab === 'Unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === 'Services') {
      filtered = filtered.filter(n => n.type === 'CITIZEN_REQUEST');
    } else if (activeTab === 'Reports') {
      filtered = filtered.filter(n => n.type === 'CITIZEN_REPORT' || n.type === 'REPORT');
    } else if (activeTab === 'Announcements') {
      filtered = filtered.filter(n => n.type === 'SYSTEM_ANNOUNCEMENT' || n.type === 'ANNOUNCEMENT');
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  // Grouping by time
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: any[] } = {
      'TODAY': [],
      'YESTERDAY': [],
      'EARLIER': []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredNotifications.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      notifDate.setHours(0, 0, 0, 0);

      if (notifDate.getTime() === today.getTime()) {
        groups['TODAY'].push(notif);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups['YESTERDAY'].push(notif);
      } else {
        groups['EARLIER'].push(notif);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const tabs = ['All', 'Unread', 'Services', 'Reports', 'Announcements'];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load notifications.</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={fetchNotifications} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-teal-600" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-3 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500">Stay updated on your requests and municipal announcements.</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header / Tabs */}
        <div className="border-b border-gray-100 px-2 sm:px-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50">
          <div className="flex overflow-x-auto hide-scrollbar w-full sm:w-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-teal-600 text-teal-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="hidden sm:flex items-center text-sm font-bold text-teal-600 hover:text-teal-800 transition-colors py-4 px-2"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all as read
            </button>
          )}
        </div>

        {/* List Content */}
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center bg-white">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <CheckCircle className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">You're all caught up!</h3>
            <p className="text-gray-500">You don't have any notifications yet.</p>
            <button onClick={() => navigate('/citizen/dashboard')} className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Back to Dashboard
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white">
            <p className="text-gray-500 font-medium">No notifications found for the current filter.</p>
          </div>
        ) : (
          <div className="bg-white">
            {['TODAY', 'YESTERDAY', 'EARLIER'].map(groupKey => {
              const groupItems = groupedNotifications[groupKey];
              if (groupItems.length === 0) return null;
              
              return (
                <div key={groupKey} className="mb-2">
                  <div className="px-6 py-2 bg-slate-50 border-y border-gray-100/60">
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider">{groupKey}</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {groupItems.map((notif, i) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, height: 0 }}
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 sm:p-6 flex items-start cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-teal-50/30 hover:bg-teal-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl mr-4 shrink-0 shadow-sm border ${
                            !notif.is_read ? 'bg-white border-teal-100 text-teal-600' : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}>
                            {getIcon(notif.type, notif.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex justify-between items-start mb-1.5 gap-2">
                              <div>
                                <span className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-1 block">
                                  {notif.type ? notif.type.replace(/_/g, ' ') : 'SYSTEM UPDATE'}
                                </span>
                                <h4 className={`text-base font-bold truncate ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notif.title}
                                </h4>
                              </div>
                            </div>
                            
                            <p className={`text-sm mb-2 line-clamp-2 ${!notif.is_read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              {notif.message}
                            </p>
                            
                            <div className="flex items-center text-xs font-medium text-gray-400">
                              <Clock className="w-3 h-3 mr-1.5" />
                              {getRelativeTime(notif.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {!notif.is_read && (
                              <button 
                                onClick={(e) => handleMarkAsRead(e, notif.id)}
                                className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            
                            {notif.action_url || notif.entity_id ? (
                              <button 
                                className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${
                                  !notif.is_read 
                                    ? 'bg-white border-teal-200 text-teal-700 hover:bg-teal-50' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }}
                              >
                                View {notif.type?.includes('REPORT') ? 'Report' : notif.type?.includes('REQUEST') ? 'Request' : 'Details'}
                              </button>
                            ) : null}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
