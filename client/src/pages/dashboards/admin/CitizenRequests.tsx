import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, FileText, AlertCircle, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

export default function CitizenRequests() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRequests();
      setRequests(res.data || []);
      setStats(res.stats || null);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load citizen requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRequests = requests.filter((r: any) => {
    const searchMatch = 
      r.request_id_code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.citizen_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const statusMatch = statusFilter ? r.status === statusFilter : true;
    const catMatch = categoryFilter ? r.category === categoryFilter : true;
    const priorityMatch = priorityFilter ? r.priority === priorityFilter : true;
    
    return searchMatch && statusMatch && catMatch && priorityMatch;
  });

  const uniqueCategories = Array.from(new Set(requests.map((r: any) => r.category).filter(Boolean)));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Requests</h1>
          <p className="text-slate-500">Manage, assign and monitor service requests submitted by citizens.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg flex items-center text-sm font-medium text-slate-700 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg flex items-center text-sm font-medium text-slate-700 transition-colors shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Export
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between shadow-sm">
          {error}
          <button onClick={fetchData} className="bg-red-100 px-3 py-1 rounded text-sm font-bold">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>)}
          </div>
          <div className="h-96 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Requests</div>
                <div className="text-2xl font-black text-slate-800">{stats.total}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">New</div>
                <div className="text-2xl font-black text-blue-600">{stats.new}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Assigned</div>
                <div className="text-2xl font-black text-purple-600">{stats.assigned}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">In Progress</div>
                <div className="text-2xl font-black text-amber-500">{stats.in_progress}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Resolved</div>
                <div className="text-2xl font-black text-green-600">{stats.resolved}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Overdue (Urgent)</div>
                <div className="text-2xl font-black text-red-600">{stats.overdue}</div>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search requests..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <select className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
                value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => <option key={cat as string} value={cat as string}>{cat}</option>)}
              </select>
              <select className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
                value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter(''); setCategoryFilter(''); setPriorityFilter(''); }}
                className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg shrink-0 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Request ID</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Citizen</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Title & Location</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Priority</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-blue-600">{r.request_id_code}</div>
                          <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{r.citizen_name || 'Anonymous'}</div>
                          <div className="text-xs text-slate-500">{r.citizen_email || 'No email provided'}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          <div className="font-bold text-slate-800 truncate">{r.title}</div>
                          <div className="text-xs text-slate-500 truncate">{r.location}, {r.ward}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                            r.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                            r.priority === 'Low' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {r.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.status === 'RESOLVED' || r.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                            r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            r.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/admin/citizen-requests/${r.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            View <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No citizen requests found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                          Requests submitted through the Citizen Portal will appear here. Adjust your filters if you are looking for something specific.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
