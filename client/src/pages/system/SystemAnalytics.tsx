import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Activity, FolderKanban, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function SystemAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/analytics', { withCredentials: true });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const { total_requests = 0, total_inspections = 0, total_projects = 0, users_by_role = [] } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              PLATFORM TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Platform-Wide System Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global operational volume, inspection activity, infrastructure initiatives, and population reach.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Total Citizen Reports</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{total_requests}</div>
          <div className="text-xs text-slate-500 mt-1">Registered civic requests</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Field Inspections</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{total_inspections}</div>
          <div className="text-xs text-slate-500 mt-1">Officer verifications logged</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Municipal Projects</span>
            <FolderKanban className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{total_projects}</div>
          <div className="text-xs text-slate-500 mt-1">SDG aligned infrastructure</div>
        </div>
      </div>

      {/* USERS BY ROLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          User Account Distribution by Role
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {users_by_role.map((u: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">{u.role_name}</div>
              <div className="text-xl font-black text-white mt-1">{u.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
