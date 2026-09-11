import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ClipboardCheck, AlertCircle, RefreshCw, MapPin, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function OfficerInspections() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchInspections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/officer/inspections', { withCredentials: true });
      if (res.data.success) {
        setInspections(res.data.data);
      } else {
        setError(res.data.message || 'Unable to load inspections');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to view these inspections.');
      } else {
        setError('Unable to load your inspections.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isOverdue = (dateString: string, status: string) => {
    if (!dateString || ['COMPLETED', 'RESOLVED'].includes(status)) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date < today && !isToday(dateString);
  };

  const filteredInspections = inspections.filter(i => {
    const searchString = `${i.project_name || ''} ${i.request_title || ''} ${i.request_id_code || ''} ${i.location || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Today') return matchesSearch && isToday(i.inspection_date);
    if (statusFilter === 'Overdue') return matchesSearch && isOverdue(i.inspection_date, i.status);
    return matchesSearch && i.status === statusFilter;
  });

  const summary = {
    total: inspections.length,
    scheduled: inspections.filter(i => i.status === 'SCHEDULED' || i.status === 'ASSIGNED').length,
    today: inspections.filter(i => isToday(i.inspection_date)).length,
    inProgress: inspections.filter(i => i.status === 'IN PROGRESS').length,
    completed: inspections.filter(i => i.status === 'COMPLETED').length,
    overdue: inspections.filter(i => isOverdue(i.inspection_date, i.status)).length
  };

  const getStatusBadge = (status: string) => {
    let classes = 'bg-gray-100 text-gray-800 border-gray-200';
    if (['SCHEDULED', 'ASSIGNED'].includes(status)) classes = 'bg-blue-100 text-blue-800 border-blue-200';
    if (['IN PROGRESS'].includes(status)) classes = 'bg-purple-100 text-purple-800 border-purple-200';
    if (['PENDING VERIFICATION'].includes(status)) classes = 'bg-orange-100 text-orange-800 border-orange-200';
    if (['COMPLETED', 'RESOLVED'].includes(status)) classes = 'bg-green-100 text-green-800 border-green-200';

    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    let classes = 'text-slate-700 bg-slate-100';
    if (priority === 'Critical') classes = 'text-red-700 bg-red-100';
    if (priority === 'High') classes = 'text-orange-700 bg-orange-100';
    if (priority === 'Medium') classes = 'text-blue-700 bg-blue-100';
    
    return <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${classes}`}>{priority || 'NORMAL'}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">FIELD INSPECTIONS</h1>
          <p className="text-slate-500">View and complete inspections assigned to you.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total</p>
          <p className="text-2xl font-black text-slate-800">{summary.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">Scheduled</p>
          <p className="text-2xl font-black text-blue-700">{summary.scheduled}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-teal-500 mb-1">Today</p>
          <p className="text-2xl font-black text-teal-700">{summary.today}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-purple-500 mb-1">In Progress</p>
          <p className="text-2xl font-black text-purple-700">{summary.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-green-500 mb-1">Completed</p>
          <p className="text-2xl font-black text-green-700">{summary.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-red-500 mb-1">Overdue</p>
          <p className="text-2xl font-black text-red-700">{summary.overdue}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search inspections..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['All', 'Today', 'SCHEDULED', 'IN PROGRESS', 'COMPLETED', 'Overdue'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-teal-600" />
          <p className="font-medium">Loading inspections...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to load field inspections.</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchInspections}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
          <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Field Inspections Assigned</h3>
          <p className="text-slate-500 mb-6">Inspections assigned to you by the Municipal Administration will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInspections.map(i => (
            <div key={i.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-gray-100 bg-slate-50">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono font-bold text-slate-500">INS-{(i.id || 0).toString().padStart(4, '0')}</span>
                  {getStatusBadge(i.status)}
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">
                  {i.project_name ? `Project: ${i.project_name}` : i.request_title ? `Request: ${i.request_title}` : 'General Inspection'}
                </h3>
                
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold uppercase">
                  {i.request_id_code && <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{i.request_id_code}</span>}
                  {getPriorityBadge(i.priority)}
                </div>
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start text-slate-600">
                  <Calendar className="w-4 h-4 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Date</p>
                    <p className={`text-sm font-semibold ${isOverdue(i.inspection_date, i.status) ? 'text-red-600' : ''}`}>
                      {i.inspection_date ? new Date(i.inspection_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start text-slate-600">
                  <MapPin className="w-4 h-4 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                    <p className="text-sm font-semibold">{i.location || 'Not Specified'}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-white">
                <Link 
                  to={`/officer/inspections/${i.id}`}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors flex justify-center items-center"
                >
                  View Inspection
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
