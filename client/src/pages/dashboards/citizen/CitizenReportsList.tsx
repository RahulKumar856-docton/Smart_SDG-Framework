import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Search, AlertCircle, ArrowRight, Filter, Calendar } from 'lucide-react';
import axios from 'axios';

export default function CitizenReportsList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/citizen/reports', { withCredentials: true });
      if (res.data.success) {
        setReports(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'SUBMITTED': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">SUBMITTED</span>;
      case 'INVESTIGATION': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">INVESTIGATING</span>;
      case 'ACTION_IN_PROGRESS': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">ACTION IN PROGRESS</span>;
      case 'RESOLVED': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">RESOLVED</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'LOW': return <span className="text-xs font-bold text-gray-500">Low</span>;
      case 'MEDIUM': return <span className="text-xs font-bold text-yellow-600">Medium</span>;
      case 'HIGH': return <span className="text-xs font-bold text-orange-600">High</span>;
      case 'CRITICAL': return <span className="text-xs font-bold text-red-600">Critical</span>;
      default: return null;
    }
  };

  const filteredReports = reports.filter((req: any) => {
    if (statusFilter !== 'All' && req.status !== statusFilter) return false;
    if (severityFilter !== 'All' && req.severity !== severityFilter) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!req.title?.toLowerCase().includes(term) && !req.report_id_code?.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    if (dateFilter !== 'All Time') {
      const date = new Date(req.created_at);
      const now = new Date();
      if (dateFilter === 'Today' && date.toDateString() !== now.toDateString()) return false;
      if (dateFilter === 'Last 7 Days') {
        const diff = now.getTime() - date.getTime();
        if (diff > 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (dateFilter === 'This Month') {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
          <p className="text-gray-600">Track the status of infrastructure issues you have reported.</p>
        </div>
        
        <Link to="/citizen/report" className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Report an Issue
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search reports by ID or title..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="INVESTIGATION">Investigating</option>
            <option value="ACTION_IN_PROGRESS">Action In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div className="relative">
          <AlertCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white"
          >
            <option value="All">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-300" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500 mb-6">No issues match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4">Report ID</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 align-top">
                      <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{req.report_id_code}</span>
                      <div className="text-xs text-gray-400 mt-2">{new Date(req.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-gray-900 mb-1">{req.title}</div>
                      <div className="text-xs text-gray-500 flex items-center mb-1">
                        <FileText className="w-3 h-3 mr-1" /> {req.category}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {req.location || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {getSeverityBadge(req.severity)}
                    </td>
                    <td className="p-4 align-top">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-4 align-top text-right">
                      <Link to={`/citizen/reports/${req.id}`} className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
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
