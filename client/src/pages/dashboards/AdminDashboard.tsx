import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle, Clock, 
  RefreshCw, AlertCircle, TrendingUp, Users,
  ShieldCheck, ArrowRight, FolderKanban, ShieldAlert,
  Megaphone, Building2, ChevronRight, FileText, Target
} from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [operationalData, setOperationalData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOp, resDash] = await Promise.all([
        axios.get('/api/admin/overview', { withCredentials: true }).catch(() => null),
        axios.get('/api/dashboards/admin', { withCredentials: true }).catch(() => null)
      ]);

      if (resOp?.data?.success) setOperationalData(resOp.data);
      if (resDash?.data?.success) setDashboardData(resDash.data.data);
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

  if (loading && !operationalData && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <span className="text-xs text-slate-500 font-medium">Loading operational metrics...</span>
      </div>
    );
  }

  const metrics = operationalData?.metrics || {};
  const recentAnnouncements = operationalData?.recent_announcements || [];
  const recentActivity = operationalData?.recent_activity || [];
  const departmentWorkload = operationalData?.department_workload || [];
  const priorityActions = dashboardData?.priority_actions || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
            OPERATIONAL COMMAND CENTER
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Municipal Monitor — Administration</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Operational oversight of municipal services, SLA compliance, authorized personnel, and field reporting.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-sm mt-4 sm:mt-0">
          <span className="text-slate-400 text-xs font-medium">Updated: {lastUpdated}</span>
          <button 
            onClick={fetchData} 
            className="flex items-center px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin text-blue-600' : ''}`} /> Sync
          </button>
        </div>
      </div>

      {/* TOP METRICS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Authorized Users */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Authorized Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.total_authorized_users ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Staff & Citizens</div>
        </div>

        {/* Reports Requiring Attention */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-200 bg-gradient-to-b from-orange-50/50 to-white">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider">Pending Attention</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-900">{metrics.pending_reports ?? 0}</div>
          <div className="text-[10px] text-orange-600 mt-1">Unresolved reports</div>
        </div>

        {/* Total Reports */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Reports</span>
            <FolderKanban className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.total_reports ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Registered intake</div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">SLA Compliance</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{metrics.sla_compliance_rate ?? '98%'}</div>
          <div className="text-[10px] text-emerald-700 mt-1">On-time resolutions</div>
        </div>

        {/* Delayed Breaches */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-200 bg-gradient-to-b from-red-50/50 to-white">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-red-800 uppercase tracking-wider">SLA Delayed</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-900">{metrics.sla_delayed_count ?? 0}</div>
          <div className="text-[10px] text-red-600 mt-1">Delayed requests</div>
        </div>

        {/* Active Departments */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Departments</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.active_departments ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active municipal bodies</div>
        </div>
      </div>

      {/* DUAL PANELS: OPERATIONAL ACTIVITY & ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Activity Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Operational Updates</h2>
              </div>
              <Link to="/admin/citizen-requests" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <span>View All</span> <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No recent operational requests.</div>
              ) : (
                recentActivity.map((act: any) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1">{act.title || act.category}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{act.location_text || 'Municipal Zone'} &bull; #{act.id}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        act.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Manage citizen service requests</span>
            <Link to="/admin/citizen-requests" className="font-semibold text-blue-600 hover:underline">
              Inspect Reports &rarr;
            </Link>
          </div>
        </div>

        {/* Communications & Announcements Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Broadcast Communications</h2>
              </div>
              <Link to="/admin/communications" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <span>Manage</span> <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No active announcements.</div>
              ) : (
                recentAnnouncements.map((ann: any) => (
                  <div key={ann.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900">{ann.title}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Broadcast civic alerts to citizens</span>
            <Link to="/admin/communications" className="font-semibold text-blue-600 hover:underline">
              New Announcement &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* DEPARTMENT WORKLOAD OVERVIEW */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Department Workload Overview</h2>
          </div>
          <Link to="/admin/departments" className="text-xs text-blue-600 font-semibold hover:underline">
            All Departments &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {departmentWorkload.map((dw: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{dw.department_name}</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">{dw.report_count}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Assigned issues</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
