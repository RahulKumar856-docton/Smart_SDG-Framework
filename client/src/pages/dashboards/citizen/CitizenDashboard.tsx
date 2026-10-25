import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, FileText, Clock, MapPin, 
  ArrowRight, Shield, ShieldCheck, Activity, Search
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';
import AICitizenAssistant from '../../../components/AICitizenAssistant';

const getTimeBasedGreeting = (date: Date) => {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) return "Good Morning";
  if (hours >= 12 && hours < 17) return "Good Afternoon";
  if (hours >= 17 && hours < 21) return "Good Evening";
  return "Good Night";
};

export default function CitizenDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await citizenApi.getDashboardSummary();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Dashboard failed to load", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayDate = currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const greeting = getTimeBasedGreeting(currentDate);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load dashboard</h2>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const user = data.user || {};
  const serviceStats = data.stats?.services || { Total: 0, Submitted: 0, 'In Progress': 0, 'Under Review': 0, Resolved: 0, 'Awaiting Verification': 0 };
  const reportStats = data.stats?.reports || { Total: 0, 'Under Investigation': 0, 'Action in Progress': 0, Resolved: 0, Reopened: 0 };
  
  const recent_requests = data.recent_requests || [];
  const recent_reports = data.recent_reports || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Shield className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <p className="text-slate-300 font-medium mb-1">{todayDate}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Citizen'}
          </h1>
          <p className="text-slate-200 max-w-2xl mb-8 text-lg">
            Stay connected with your municipality. Request municipal services or report infrastructure issues directly from your dashboard.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/citizen/request-service" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center">
              <Activity className="w-5 h-5 mr-2" /> Request a Service
            </Link>
            <Link to="/citizen/report" className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" /> Report an Issue
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: AI Assistant */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
            <Activity className="w-5 h-5 mr-2 text-indigo-600" /> AI Assistant
          </h2>
          <AICitizenAssistant />
        </div>

        {/* RIGHT COLUMN: Dashboard Stats */}
        <div className="lg:col-span-2 space-y-8">
        
        {/* SERVICE REQUESTS SECTION */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
              <FileText className="w-5 h-5 mr-2 text-blue-600" /> Service Requests Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Total</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStats.Total}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 min-w-0">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 truncate">Active</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStats['In Progress'] + serviceStats['Under Review'] + serviceStats.Submitted}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 min-w-0">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1 truncate">Verify</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStats['Awaiting Verification'] || 0}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white p-4 rounded-xl shadow-sm border border-green-100 min-w-0">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1 truncate">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStats.Resolved}</p>
              </motion.div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-gray-800 text-sm">Recent Services</h3>
              <Link to="/citizen/services" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            {recent_requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No service requests found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent_requests.map((req: any) => (
                  <Link key={req.id} to={`/citizen/services/${req.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">{req.request_id}</span>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{req.title}</h4>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()} &bull; {req.category}</div>
                    </div>
                    <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">{req.status.replace('_', ' ')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CITIZEN REPORTS SECTION */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" /> Citizen Reports Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Total</p>
                <p className="text-2xl font-bold text-gray-900">{reportStats.Total}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 min-w-0">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1 truncate">Investigating</p>
                <p className="text-2xl font-bold text-gray-900">{reportStats['Under Investigation']}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 min-w-0">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 truncate">In Action</p>
                <p className="text-2xl font-bold text-gray-900">{reportStats['Action in Progress']}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white p-4 rounded-xl shadow-sm border border-green-100 min-w-0">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1 truncate">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{reportStats.Resolved}</p>
              </motion.div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-gray-800 text-sm">Recent Reports</h3>
              <Link to="/citizen/reports" className="text-xs font-bold text-red-600 hover:text-red-700">View All</Link>
            </div>
            {recent_reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No recent reports found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent_reports.map((req: any) => (
                  <Link key={req.id} to={`/citizen/reports/${req.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">{req.report_id}</span>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{req.title}</h4>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()} &bull; {req.category}</div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${req.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>{req.status.replace('_', ' ')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

