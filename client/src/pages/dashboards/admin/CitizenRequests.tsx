import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Link, useLocation } from 'react-router-dom';
import { Search, FileText, AlertCircle, RefreshCw, ArrowRight, CheckCircle, Clock, ShieldAlert, Sparkles, Filter } from 'lucide-react';

export default function CitizenRequests() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const location = useLocation();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [delayFilter, setDelayFilter] = useState('');

  // Read URL query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const delay = params.get('delay');
    if (status) setStatusFilter(status);
    if (delay) setDelayFilter(delay);
  }, [location.search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRequests();
      setRequests(res.data || []);
      setStats(res.stats || null);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load citizen reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRequests = requests.filter((r: any) => {
    const term = searchTerm.toLowerCase();
    const searchMatch = 
      r.request_id_code?.toLowerCase().includes(term) || 
      r.title?.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term) ||
      r.citizen_name?.toLowerCase().includes(term) ||
      r.location?.toLowerCase().includes(term);
      
    const statusMatch = statusFilter ? r.status === statusFilter : true;
    const catMatch = categoryFilter ? r.category === categoryFilter : true;
    const priorityMatch = priorityFilter ? r.priority === priorityFilter : true;
    const wardMatch = wardFilter ? r.ward === wardFilter : true;
    const delayMatch = delayFilter === 'delayed' ? (r.delay_days > 0 || r.status === 'DELAYED') : true;
    
    return searchMatch && statusMatch && catMatch && priorityMatch && wardMatch && delayMatch;
  });

  const uniqueCategories = Array.from(new Set(requests.map((r: any) => r.category).filter(Boolean)));
  const uniqueWards = Array.from(new Set(requests.map((r: any) => r.ward).filter(Boolean)));

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Report Review Module</h1>
          <p className="text-slate-500 font-medium mt-1">Review newly submitted reports, monitor delays, and manage citizen accountability.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center text-sm font-bold text-slate-700 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Records
          </button>
          <button className="px-4 py-2 bg-slate-800 border border-slate-800 hover:bg-slate-900 rounded-lg flex items-center text-sm font-bold text-white transition-colors shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center justify-between border border-red-100 shadow-sm">
          <div className="flex items-center font-bold">
            <AlertCircle className="w-5 h-5 mr-2" /> {error}
          </div>
          <button onClick={fetchData} className="bg-red-100 hover:bg-red-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Retry Connection</button>
        </div>
      )}

      {!error && (
        <>
          {/* Quick Stats Summary */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Total Records</div>
                <div className="text-2xl font-black text-slate-800">{stats.total || 0}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-blue-600 text-[10px] font-black uppercase tracking-wider mb-1">Requires Review</div>
                <div className="text-2xl font-black text-blue-700">{stats.new || 0}</div>
              </div>
              <div className="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100">
                <div className="text-teal-600 text-[10px] font-black uppercase tracking-wider mb-1">Active Work</div>
                <div className="text-2xl font-black text-teal-700">{stats.in_progress || 0}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100">
                <div className="text-orange-600 text-[10px] font-black uppercase tracking-wider mb-1">Delayed</div>
                <div className="text-2xl font-black text-orange-700">{stats.delayed || 0}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                <div className="text-red-600 text-[10px] font-black uppercase tracking-wider mb-1">Escalated</div>
                <div className="text-2xl font-black text-red-700">{stats.escalated || 0}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100">
                <div className="text-green-600 text-[10px] font-black uppercase tracking-wider mb-1">Resolved</div>
                <div className="text-2xl font-black text-green-700">{stats.resolved || 0}</div>
              </div>
            </div>
          )}

          {/* Search & Filters Panel */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by Report ID, Citizen Name, Location, or Description..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center text-sm font-bold text-slate-500 mr-2">
                <Filter className="w-4 h-4 mr-1" /> Filters:
              </div>
              
              <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted (Pending Review)</option>
                <option value="VERIFIED">Verified</option>
                <option value="DEPARTMENT_ASSIGNED">Department Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="AWAITING_VERIFICATION">Awaiting Completion Varification</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              
              <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>

              <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => <option key={cat as string} value={cat as string}>{cat}</option>)}
              </select>

              <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={wardFilter} onChange={(e) => setWardFilter(e.target.value)}>
                <option value="">All Wards</option>
                {uniqueWards.map(w => <option key={w as string} value={w as string}>{w}</option>)}
              </select>

              <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={delayFilter} onChange={(e) => setDelayFilter(e.target.value)}>
                <option value="">Delay Status: All</option>
                <option value="delayed">Delayed Reports Only</option>
              </select>

              {(searchTerm || statusFilter || categoryFilter || priorityFilter || wardFilter || delayFilter) && (
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter(''); setCategoryFilter(''); setPriorityFilter(''); setWardFilter(''); setDelayFilter(''); }}
                  className="px-3 py-2 text-sm text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Loading records...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">No Reports Found</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  We couldn't find any citizen reports matching your current filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-5 py-4 font-black text-slate-500 text-[10px] uppercase tracking-wider">Report Info</th>
                      <th className="px-5 py-4 font-black text-slate-500 text-[10px] uppercase tracking-wider">Issue & Location</th>
                      <th className="px-5 py-4 font-black text-slate-500 text-[10px] uppercase tracking-wider">Department & AI</th>
                      <th className="px-5 py-4 font-black text-slate-500 text-[10px] uppercase tracking-wider">Status & Delay</th>
                      <th className="px-5 py-4 font-black text-slate-500 text-[10px] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((r: any) => {
                      const submittedDate = new Date(r.created_at);
                      const ageDays = Math.floor((new Date().getTime() - submittedDate.getTime()) / (1000 * 3600 * 24));
                      
                      return (
                        <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-5 py-4 align-top">
                            <div className="font-black text-slate-800">{r.request_id_code}</div>
                            <div className="text-xs font-bold text-slate-500 mt-1">{r.citizen_name || 'Anonymous'}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1">{submittedDate.toLocaleDateString()} ({ageDays}d old)</div>
                          </td>
                          
                          <td className="px-5 py-4 align-top max-w-[280px]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                r.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                r.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                r.priority === 'Low' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {r.priority}
                              </span>
                              <span className="text-xs font-bold text-slate-700 truncate">{r.category}</span>
                            </div>
                            <div className="font-bold text-slate-900 truncate mb-1">{r.title}</div>
                            <div className="text-xs font-medium text-slate-500 truncate">{r.location} • <span className="font-bold text-slate-700">{r.ward}</span></div>
                          </td>
                          
                          <td className="px-5 py-4 align-top">
                            <div className="font-bold text-slate-800 mb-1">{r.department_name || 'Unassigned'}</div>
                            <div className="inline-flex items-center gap-1 text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                              <Sparkles className="w-3 h-3" /> AI Conf: 94%
                            </div>
                          </td>
                          
                          <td className="px-5 py-4 align-top">
                            <div className="mb-1">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                r.status === 'AWAITING_VERIFICATION' ? 'bg-teal-100 text-teal-700' :
                                r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                r.status === 'DEPARTMENT_ASSIGNED' ? 'bg-purple-100 text-purple-700' :
                                r.status === 'VERIFIED' ? 'bg-indigo-100 text-indigo-700' :
                                r.status === 'ESCALATED' ? 'bg-red-100 text-red-700' :
                                r.status === 'DELAYED' ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {r.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            
                            {r.delay_days > 0 ? (
                              <div className="text-xs font-bold text-red-600 flex items-center">
                                <ShieldAlert className="w-3 h-3 mr-1" /> Delayed: {r.delay_days}d
                              </div>
                            ) : r.expected_completion_date ? (
                              <div className="text-[10px] font-bold text-slate-400">
                                SLA: {new Date(r.expected_completion_date).toLocaleDateString()}
                              </div>
                            ) : null}
                          </td>
                          
                          <td className="px-5 py-4 align-top text-right">
                            <Link 
                              to={`/admin/citizen-requests/${r.id}`}
                              className="inline-flex items-center justify-center h-8 px-4 text-xs font-black bg-slate-900 text-white hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
                            >
                              Review <ArrowRight className="w-3 h-3 ml-2" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
