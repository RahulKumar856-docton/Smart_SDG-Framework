import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Activity, PieChart, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/analytics', { withCredentials: true });
      if (res.data.success) {
        setData(res.data);
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

  const { status_distribution = [], priority_distribution = [], category_distribution = [], timeline = [] } = data || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Operational Analytics & Service Velocity</h1>
          <p className="text-slate-500 font-medium text-sm">
            Analysis of citizen request flows, category distributions, priority triage, and resolution velocity.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reports by Operational Status</h2>
          </div>
          <div className="space-y-3">
            {status_distribution.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="font-bold text-xs text-slate-800">{s.status || 'UNASSIGNED'}</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-black text-xs font-mono">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Priority Distribution</h2>
          </div>
          <div className="space-y-3">
            {priority_distribution.map((p: any, idx: number) => {
              const isHigh = (p.priority || '').toUpperCase() === 'HIGH';
              const isUrgent = (p.priority || '').toUpperCase() === 'URGENT';
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-xs text-slate-800">{p.priority || 'NORMAL'}</span>
                  <span className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono ${
                    isUrgent ? 'bg-red-100 text-red-800' : isHigh ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {p.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Top Municipal Service Categories</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {category_distribution.map((c: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{c.category}</span>
                <span className="text-xl font-black text-emerald-700 mt-2 font-mono">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
