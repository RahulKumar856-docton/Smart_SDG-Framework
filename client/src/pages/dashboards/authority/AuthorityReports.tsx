import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, UserPlus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

export default function AuthorityReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/authority/reports')
      .then(res => {
        if (res.data.success) setReports(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Citizen Reports</h1>
        <p className="text-slate-500">Review, analyze and manage citizen reports across the municipality.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Reports</p>
          <p className="text-3xl font-black text-slate-800">{reports.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase">Pending Review</p>
          <p className="text-3xl font-black text-blue-700">{reports.filter(r => r.status === 'SUBMITTED').length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase">High Priority</p>
          <p className="text-3xl font-black text-red-700">{reports.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase">Resolved</p>
          <p className="text-3xl font-black text-emerald-700">{reports.filter(r => r.status === 'RESOLVED' || r.status === 'VERIFIED').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search reports..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No citizen reports have been submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-slate-600">Report ID</th>
                  <th className="p-4 font-bold text-slate-600">Issue</th>
                  <th className="p-4 font-bold text-slate-600">Category</th>
                  <th className="p-4 font-bold text-slate-600">Priority</th>
                  <th className="p-4 font-bold text-slate-600">Status</th>
                  <th className="p-4 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-slate-500">{r.report_id_code}</td>
                    <td className="p-4 font-semibold text-slate-800">{r.title}</td>
                    <td className="p-4 text-slate-600">{r.category}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-100">{r.severity || 'MEDIUM'}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-800">{r.status}</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => navigate(`/authority/reports/${r.id}`)} className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
