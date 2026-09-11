import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, RefreshCw, AlertCircle, Calendar, TrendingUp, CheckCircle, ArrowRight, Activity, TrendingDown, Clock, FileText, UploadCloud, X } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function OfficerKPIs() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [actualValue, setActualValue] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  const fetchKpis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/officer/kpis', { withCredentials: true });
      if (res.data.success) {
        setKpis(res.data.data);
      } else {
        setError(res.data.message || 'Unable to load KPIs');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to view these KPIs.');
      } else {
        setError('Unable to load your KPIs.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleUpdate = async (status: string) => {
    if (!selectedKpi) return;
    
    setUpdating(true);
    try {
      const res = await axios.post(`/api/officer/kpis/${selectedKpi.id}/update`, {
        actual_value: Number(actualValue),
        remarks,
        status
      }, { withCredentials: true });
      
      if (res.data.success) {
        alert(status === 'Draft' ? 'Draft saved!' : 'KPI update submitted for verification!');
        setSelectedKpi(null);
        setActualValue('');
        setRemarks('');
        fetchKpis();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit KPI update.');
    } finally {
      setUpdating(false);
    }
  };

  const calculatePerformance = (current: number, target: number) => {
    if (!target || target === 0) return 0;
    const ratio = (current / target) * 100;
    return ratio > 100 ? 100 : ratio;
  };

  const filteredKpis = kpis.filter(k => {
    const matchesSearch = (k.name && k.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (k.project_name && k.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
                          
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && k.status === statusFilter;
  });

  const summary = {
    total: kpis.length,
    pending: kpis.filter(k => k.status === 'NEEDS UPDATE').length,
    submitted: kpis.filter(k => k.status === 'Pending').length,
    approved: kpis.filter(k => k.status === 'Active' || k.status === 'Approved').length,
    needsAttention: kpis.filter(k => {
      if (!k.target_value || !k.current_value) return true;
      const perf = calculatePerformance(k.current_value, k.target_value);
      return perf < 50;
    }).length
  };

  const getStatusBadge = (status: string) => {
    let classes = 'bg-gray-100 text-gray-800 border-gray-200';
    if (['NEEDS UPDATE'].includes(status)) classes = 'bg-orange-100 text-orange-800 border-orange-200';
    if (['Pending', 'Submitted'].includes(status)) classes = 'bg-blue-100 text-blue-800 border-blue-200';
    if (['Active', 'Approved'].includes(status)) classes = 'bg-green-100 text-green-800 border-green-200';

    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">KPI UPDATES</h1>
          <p className="text-slate-500">Monitor and update performance indicators assigned to your projects.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total KPIs</p>
          <p className="text-2xl font-black text-slate-800">{summary.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 mb-1">Needs Update</p>
          <p className="text-2xl font-black text-orange-700">{summary.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">Submitted</p>
          <p className="text-2xl font-black text-blue-700">{summary.submitted}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-green-500 mb-1">Approved</p>
          <p className="text-2xl font-black text-green-700">{summary.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-red-500 mb-1">Needs Attention</p>
          <p className="text-2xl font-black text-red-700">{summary.needsAttention}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search KPIs..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['All', 'NEEDS UPDATE', 'Pending', 'Active'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'Active' ? 'Approved' : f === 'Pending' ? 'Submitted' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-600" />
          <p className="font-medium">Loading KPIs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to load KPI data.</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchKpis}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredKpis.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
          <Target className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No KPIs Assigned</h3>
          <p className="text-slate-500 mb-6">Performance indicators assigned to your projects will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKpis.map(k => {
            const perf = calculatePerformance(k.current_value, k.target_value);
            return (
              <div key={k.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-gray-100 bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {k.frequency || 'Monthly'}
                    </span>
                    {getStatusBadge(k.status)}
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2">
                    {k.name}
                  </h3>
                  
                  <Link to={`/officer/projects/${k.project_id}`} className="text-xs font-semibold text-indigo-700 hover:underline line-clamp-1">
                    Project: {k.project_name}
                  </Link>
                </div>
                
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target</p>
                      <p className="font-black text-slate-800 text-lg">{k.target_value} <span className="text-xs font-semibold text-slate-500">{k.unit}</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Current</p>
                      <p className="font-black text-indigo-700 text-lg">{k.current_value || 0} <span className="text-xs font-semibold text-slate-500">{k.unit}</span></p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performance</p>
                      <span className="text-xs font-black text-slate-700">{perf.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${perf < 50 ? 'bg-red-500' : perf < 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                        style={{ width: `${perf}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-500 text-xs">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Last updated: {k.updated_at ? new Date(k.updated_at).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-white">
                  <button 
                    onClick={() => {
                      setSelectedKpi(k);
                      setActualValue((k.current_value || '').toString());
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex justify-center items-center"
                  >
                    Update KPI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI Update Modal */}
      <AnimatePresence>
        {selectedKpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-black text-slate-900">UPDATE KPI</h2>
                  <p className="text-xs font-medium text-slate-500">{selectedKpi.project_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedKpi(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{selectedKpi.name}</h3>
                  <p className="text-sm text-slate-600">{selectedKpi.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target</p>
                    <p className="font-black text-slate-800 text-2xl">{selectedKpi.target_value} <span className="text-sm text-slate-500">{selectedKpi.unit}</span></p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Previous Approved Value</p>
                    <p className="font-black text-indigo-700 text-2xl">{selectedKpi.current_value || 0} <span className="text-sm text-slate-500">{selectedKpi.unit}</span></p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      New Actual Value <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        className="w-full p-3 pr-16 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-slate-800 shadow-sm"
                        value={actualValue}
                        onChange={(e) => setActualValue(e.target.value)}
                        placeholder="Enter measured value..."
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {selectedKpi.unit}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 shadow-sm"
                      placeholder="Explain the measurement methodology or factors affecting performance..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Evidence</label>
                    <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center">
                      <UploadCloud className="w-5 h-5 mr-2" /> Upload Evidence Document/Image
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-slate-50 flex gap-3">
                <button 
                  disabled={updating}
                  onClick={() => handleUpdate('Draft')}
                  className="flex-1 py-3 px-4 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Save Draft
                </button>
                <button 
                  disabled={updating || !actualValue || !remarks}
                  onClick={() => handleUpdate('Pending')}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
