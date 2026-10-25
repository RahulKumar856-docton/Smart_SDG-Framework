import React, { useEffect, useState } from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import axios from 'axios';

export default function AuthorityOperations() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/authority/operations')
      .then(res => {
        if (res.data.success) setData(res.data.data);
      })
      .catch(() => setData({})) // Fallback to empty state
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Municipal Operations</h1>
        <p className="text-slate-500">Monitor active work, delays, and officer performance across all departments.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase flex items-center"><Activity className="w-4 h-4 mr-1 text-blue-500"/> Active Work</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.active || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase flex items-center"><Users className="w-4 h-4 mr-1 text-emerald-500"/> Officers Working</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.officers || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase flex items-center"><Clock className="w-4 h-4 mr-1 text-orange-500"/> Delayed Work</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.delayed || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase flex items-center"><AlertTriangle className="w-4 h-4 mr-1 text-red-500"/> Escalated Work</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.escalated || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-teal-500"/> Completed Today</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.completed || 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Active Work Timeline</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading operations...</p>
          ) : !data?.active_tasks?.length ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">No active tasks currently underway.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Maps out active tasks when data is available */}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Department Performance</h2>
          {loading ? (
             <p className="text-slate-500 text-sm">Loading performance...</p>
          ) : !data?.departments?.length ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">Insufficient data for department performance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Maps out departments */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
