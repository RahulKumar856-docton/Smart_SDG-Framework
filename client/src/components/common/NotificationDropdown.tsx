import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Info, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
      const countRes = await axios.get('/api/notifications/unread-count');
      if (countRes.data.success) {
        setUnreadCount(countRes.data.count);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling fallback
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      try {
        await axios.patch(`/api/notifications/${notif.id}/read`);
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (priority: string) => {
    if (priority === 'CRITICAL' || priority === 'HIGH') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (priority === 'MEDIUM') return <Clock className="w-4 h-4 text-orange-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400">Mark all as read</button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">{getIcon(notif.priority)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-1 ${!notif.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
            <button onClick={() => { setIsOpen(false); navigate('/notifications'); }} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
