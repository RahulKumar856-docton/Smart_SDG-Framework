import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderKanban, RefreshCw, AlertCircle, TrendingUp, Target, ShieldAlert, FileCheck, BrainCircuit, Sparkles, AlertTriangle, PlayCircle
} from 'lucide-react';
import axios from 'axios';

export default function OfficerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState<string>("Good Morning");

  const fetchData = async () => {
    setLoading(true);
    try {
      const authRes = await axios.get('/api/auth/me', { withCredentials: true });
      if (authRes.data.success) setUser(authRes.data.data);

      const res = await axios.get('/api/dashboards/officer', { withCredentials: true });
      setData(res.data.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update greeting based on local time every minute
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("Good Morning");
      else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
      else if (hour >= 17 && hour < 21) setGreeting("Good Evening");
      else setGreeting("Good Night");
    };
    updateGreeting(); // initial call
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center">
        <AlertCircle className="w-6 h-6 mr-3" />
        <div>
          <h3 className="font-bold">Unable to load dashboard data</h3>
          <button onClick={fetchData} className="text-sm underline mt-1 font-semibold hover:text-red-800">Retry</button>
        </div>
      </div>
    );
  }

  const { kpis, projects, requests, department_name } = data;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{greeting}, {user?.full_name || user?.username}</h1>
          <div className="flex items-center space-x-3 text-slate-600 font-medium">
            <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-md text-xs font-bold">{department_name}</span>
            <span>{currentDate}</span>
          </div>
          <p className="text-slate-500 mt-3">Here are the projects, inspections and citizen requirements that need your attention.</p>
        </div>
        <div className="flex items-center space-x-4 text-sm mt-4 sm:mt-0">
          <span className="text-slate-500 font-medium">Last updated: {lastUpdated}</span>
          <button onClick={fetchData} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-slate-700 font-semibold transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'ASSIGNED PROJECTS', value: kpis.assigned_projects || 0, icon: FolderKanban, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'PENDING INSPECTIONS', value: kpis.pending_inspections || 0, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'KPI UPDATES', value: kpis.kpi_updates || 0, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'EVIDENCE REQUIRED', value: kpis.evidence_required || 0, icon: FileCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'CITIZEN REQUESTS', value: kpis.citizen_requests || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'RISK ALERTS', value: kpis.risk_alerts || 0, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -top-4 w-16 h-16 ${stat.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            <stat.icon className={`w-6 h-6 ${stat.color} mb-3 relative z-10`} />
            <p className="text-3xl font-black text-slate-800 mb-1 relative z-10">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-500 tracking-wider relative z-10">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Today's Tasks */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Today's Work</h3>
            <div className="space-y-4">
              <div className="p-4 border border-orange-100 bg-orange-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider">High Priority</span>
                  <span className="text-xs font-bold text-slate-500">Today</span>
                </div>
                <h4 className="font-bold text-slate-900">Field Inspection</h4>
                <p className="text-sm text-slate-600 mb-3">Urban Drainage Improvement, Ward 4</p>
                <button className="flex items-center text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors"><PlayCircle className="w-4 h-4 mr-1" /> Open</button>
              </div>

              <div className="p-4 border border-blue-100 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wider">Medium</span>
                  <span className="text-xs font-bold text-slate-500">Today</span>
                </div>
                <h4 className="font-bold text-slate-900">Citizen Request Assessment</h4>
                <p className="text-sm text-slate-600 mb-3">CIT-2026-104928 - Blocked drainage</p>
                <button className="flex items-center text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors"><PlayCircle className="w-4 h-4 mr-1" /> Open</button>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">My Assigned Projects</h3>
              <button className="text-sm font-bold text-teal-700 hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects && projects.length > 0 ? projects.map((proj: any, i: number) => (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={proj.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{proj.project_name}</div>
                        <div className="text-xs text-slate-500">{proj.location}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="font-bold text-slate-700 w-8">{proj.progress_percentage}%</span>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full ml-2">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${proj.progress_percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          proj.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                          proj.risk_level === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {proj.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button className="text-teal-700 font-bold hover:underline">Inspect</button>
                        <button className="text-teal-700 font-bold hover:underline">KPI</button>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No assigned projects.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Citizen Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Assigned Citizen Requests</h3>
            <Link to="/officer/requests" className="text-sm font-bold text-teal-700 hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests && requests.length > 0 ? requests.map((req: any, i: number) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={req.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-700">{req.request_id_code}</td>
                    <td className="px-6 py-4 text-slate-800 font-bold">{req.category}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          req.priority === 'Urgent' || req.priority === 'High' ? 'bg-red-100 text-red-700' :
                          req.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {req.priority}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to="/officer/requests" className="text-teal-700 font-bold hover:underline">Open</Link>
                    </td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No pending citizen requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-teal-900 to-slate-900 p-6 rounded-2xl shadow-sm border border-teal-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit className="w-32 h-32" /></div>
          <h3 className="font-bold text-lg text-teal-100 mb-6 flex items-center z-10 relative"><Sparkles className="w-5 h-5 mr-2 text-teal-400" /> AI-Assisted Recommendations</h3>
          
          <div className="space-y-4 z-10 relative">
            <div className="bg-white/10 border border-white/20 p-5 rounded-xl backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider rounded border border-red-500/30">High Risk</span>
                <span className="text-xs font-medium text-teal-200">92% Confidence</span>
              </div>
              <p className="text-sm font-semibold mb-2">Observed progress is below reported progress for Urban Drainage Phase 2.</p>
              <div className="p-3 bg-teal-900/50 rounded-lg">
                <span className="text-xs text-teal-300 font-bold uppercase tracking-wider block mb-1">Recommendation</span>
                <span className="text-sm font-medium">Schedule follow-up inspection and require photographic evidence update.</span>
              </div>
            </div>
            
            <div className="bg-white/10 border border-white/20 p-5 rounded-xl backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider rounded border border-orange-500/30">Delay Alert</span>
                <span className="text-xs font-medium text-teal-200">85% Confidence</span>
              </div>
              <p className="text-sm font-semibold mb-2">Citizen complaints cluster in Ward 4 matches delayed Road Resurfacing.</p>
              <div className="p-3 bg-teal-900/50 rounded-lg">
                <span className="text-xs text-teal-300 font-bold uppercase tracking-wider block mb-1">Recommendation</span>
                <span className="text-sm font-medium">Link Citizen Requests CIT-2026-104928 and CIT-2026-104930 to project ID 14.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
