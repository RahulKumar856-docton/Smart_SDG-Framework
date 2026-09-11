import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Inbox, AlertCircle, RefreshCw, Calendar, MapPin, ChevronRight, X, User, Tag, Clock } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function OfficerRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/officer/requests', { withCredentials: true });
      if (res.data.success) {
        setRequests(res.data.data);
      } else {
        setError(res.data.message || 'Unable to load requests');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to view these requests.');
      } else {
        setError('Unable to load your citizen requests.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await axios.put(`/api/officer/requests/${id}/status`, { status: newStatus }, { withCredentials: true });
      if (res.data.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (r.request_id_code && r.request_id_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (r.citizen_name && r.citizen_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (r.location && r.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  const summary = {
    total: requests.length,
    new: requests.filter(r => r.status === 'SUBMITTED' || r.status === 'ASSIGNED').length,
    inProgress: requests.filter(r => r.status === 'IN PROGRESS' || r.status === 'ACCEPTED').length,
    pendingVerif: requests.filter(r => r.status === 'PENDING VERIFICATION').length,
    completed: requests.filter(r => r.status === 'COMPLETED' || r.status === 'RESOLVED').length,
    overdue: 0 // Simulated for now since no due_date exists on the DB
  };

  const getStatusBadge = (status: string) => {
    let classes = 'bg-gray-100 text-gray-800';
    if (['SUBMITTED', 'ASSIGNED'].includes(status)) classes = 'bg-blue-100 text-blue-800 border-blue-200';
    if (['ACCEPTED', 'IN PROGRESS'].includes(status)) classes = 'bg-purple-100 text-purple-800 border-purple-200';
    if (['PENDING VERIFICATION'].includes(status)) classes = 'bg-orange-100 text-orange-800 border-orange-200';
    if (['COMPLETED', 'RESOLVED'].includes(status)) classes = 'bg-green-100 text-green-800 border-green-200';

    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    let classes = 'text-slate-700 bg-slate-100';
    if (priority === 'Critical') classes = 'text-red-700 bg-red-100';
    if (priority === 'High') classes = 'text-orange-700 bg-orange-100';
    if (priority === 'Medium') classes = 'text-blue-700 bg-blue-100';
    
    return <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${classes}`}>{priority}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CITIZEN REQUESTS</h1>
          <p className="text-slate-500">Manage service requests assigned to you.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total</p>
          <p className="text-2xl font-black text-slate-800">{summary.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">New</p>
          <p className="text-2xl font-black text-blue-700">{summary.new}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-purple-500 mb-1">In Progress</p>
          <p className="text-2xl font-black text-purple-700">{summary.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 mb-1">Pending Verif</p>
          <p className="text-2xl font-black text-orange-700">{summary.pendingVerif}</p>
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
            placeholder="Search requests..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['All', 'SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'IN PROGRESS', 'PENDING VERIFICATION', 'COMPLETED'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'SUBMITTED' ? 'New' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-teal-600" />
          <p className="font-medium">Loading requests...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to load citizen requests.</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchRequests}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
          <Inbox className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Requests Assigned</h3>
          <p className="text-slate-500 mb-6">New service requests assigned by the Municipal Administration will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Citizen</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-600">{r.request_id_code}</td>
                    <td className="p-4 font-bold text-slate-800">
                      <div className="line-clamp-1">{r.title}</div>
                      <div className="text-xs font-normal text-slate-500 mt-0.5">{r.service}</div>
                    </td>
                    <td className="p-4 text-slate-600 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {r.citizen_name || 'Anonymous'}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-1">{r.location || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {getPriorityBadge(r.priority)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedRequest(r)}
                        className="px-4 py-1.5 bg-white border border-gray-200 text-teal-700 font-bold text-xs rounded-lg hover:bg-teal-50 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{selectedRequest.request_id_code}</h2>
                  <p className="text-xs font-medium text-slate-500">{selectedRequest.service}</p>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedRequest.title}</h3>
                    {getStatusBadge(selectedRequest.status)}
                    <span className="ml-2">{getPriorityBadge(selectedRequest.priority)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center text-slate-500 mb-1">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Citizen</span>
                    </div>
                    <p className="font-semibold text-slate-800 ml-6">{selectedRequest.citizen_name || 'Anonymous'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center text-slate-500 mb-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                    </div>
                    <p className="font-semibold text-slate-800 ml-6">{selectedRequest.location || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center text-slate-500 mb-1">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Submitted</span>
                    </div>
                    <p className="font-semibold text-slate-800 ml-6">
                      {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{selectedRequest.description}</p>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-slate-50 flex flex-wrap gap-3">
                {(selectedRequest.status === 'SUBMITTED' || selectedRequest.status === 'ASSIGNED') && (
                  <button 
                    disabled={updating}
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'ACCEPTED')}
                    className="flex-1 py-2.5 px-4 bg-teal-700 text-white font-bold text-sm rounded-lg hover:bg-teal-800 transition-colors"
                  >
                    Accept Request
                  </button>
                )}
                
                {selectedRequest.status === 'ACCEPTED' && (
                  <button 
                    disabled={updating}
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'IN PROGRESS')}
                    className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Work
                  </button>
                )}

                {selectedRequest.status === 'IN PROGRESS' && (
                  <button 
                    disabled={updating}
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'PENDING VERIFICATION')}
                    className="flex-1 py-2.5 px-4 bg-orange-600 text-white font-bold text-sm rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Submit Verification
                  </button>
                )}

                <button className="py-2.5 px-4 bg-white border border-gray-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  Upload Evidence
                </button>
                <button className="py-2.5 px-4 bg-white border border-gray-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  Message Citizen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
