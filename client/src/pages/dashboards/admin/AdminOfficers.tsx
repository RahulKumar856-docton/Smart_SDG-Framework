import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, CheckCircle, XCircle, ShieldCheck, Users,
  MoreVertical, Loader2, Edit, Calendar, User, Mail, 
  Phone, Building, AlertTriangle, ChevronRight, X, Badge, RefreshCw
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';


interface Officer {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  department_name: string;
  department_id: number;
}

export default function AdminOfficers() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [stats, setStats] = useState({ Total: 0, 'Pending Approval': 0, Active: 0, Rejected: 0 });
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOfficers({
        search: searchTerm,
        status: statusFilter,
        department_id: deptFilter,
        date_range: dateFilter
      });
      if (res.success) {
        setOfficers(res.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Unable to load officer records.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndDepts = async () => {
    try {
      const statsRes = await adminApi.getOfficersStatistics();
      if (statsRes.success) setStats(statsRes.data);
      
      const deptsRes = await adminApi.getDepartments();
      if (deptsRes.success) setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchStatsAndDepts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOfficers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, deptFilter, dateFilter]);

  const handleApprove = async (officer: Officer) => {
    if (!window.confirm(`Approve Officer?\n\n${officer.full_name} will gain access to the authorized Officer Portal.`)) return;
    
    setActionLoading(officer.id);
    setMessage(null);
    try {
      const res = await adminApi.approveOfficer(officer.id);
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Officer approved successfully.' });
        fetchOfficers();
        fetchStatsAndDepts();
      } else {
        setMessage({ type: 'error', text: res.message || 'Unable to approve officer.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to approve officer. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (officer: Officer) => {
    setSelectedOfficer(officer);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedOfficer) return;
    setActionLoading(selectedOfficer.id);
    setMessage(null);
    try {
      const res = await adminApi.rejectOfficer(selectedOfficer.id, rejectReason);
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Officer rejected successfully.' });
        fetchOfficers();
        fetchStatsAndDepts();
        setShowRejectModal(false);
      } else {
        setMessage({ type: 'error', text: res.message || 'Unable to reject officer.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to reject officer. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDrawer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setEditForm({
      full_name: officer.full_name,
      phone: officer.phone || '',
      department_id: officer.department_id || ''
    });
    setShowEditDrawer(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficer) return;
    setActionLoading(selectedOfficer.id);
    try {
      const res = await adminApi.updateOfficer(selectedOfficer.id, editForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Officer profile updated successfully.' });
        fetchOfficers();
        setShowEditDrawer(false);
      } else {
        setMessage({ type: 'error', text: res.message || 'Unable to update officer.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to update officer.' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Stats */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Officer Management</h1>
        <p className="text-sm text-slate-500 mb-6">Review pending registrations and manage field operations access.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Officers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.Total}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg mr-4"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats['Pending Approval']}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.Active}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg mr-4"><XCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.Rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start shadow-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />}
          <p className="font-medium text-sm">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, email, phone, ID..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="relative">
          <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center flex-col items-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading officer records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Officer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officers.length > 0 ? officers.map((officer, i) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={officer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold mr-3 shrink-0">
                          {officer.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{officer.full_name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {officer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 flex items-center mb-1"><Mail className="w-3 h-3 mr-1.5 text-gray-400"/> {officer.email}</div>
                      <div className="text-xs text-slate-500 flex items-center"><Phone className="w-3 h-3 mr-1.5 text-gray-400"/> {officer.phone || 'Not Provided'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{officer.department_name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-slate-500">{officer.created_at ? new Date(officer.created_at).toLocaleDateString() : 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                        officer.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' :
                        officer.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {officer.status === 'PENDING_APPROVAL' ? 'PENDING' : officer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {officer.status === 'PENDING_APPROVAL' && (
                        <>
                          <button 
                            disabled={actionLoading === officer.id}
                            onClick={() => handleApprove(officer)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === officer.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approve
                          </button>
                          <button 
                            disabled={actionLoading === officer.id}
                            onClick={() => openRejectModal(officer)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </button>
                        </>
                      )}
                      {officer.status === 'ACTIVE' && (
                        <button 
                          onClick={() => openEditDrawer(officer)}
                          className="inline-flex items-center px-3 py-1.5 text-slate-600 hover:text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </button>
                      )}
                      {officer.status === 'REJECTED' && (
                        <span className="text-xs text-slate-400 italic">No actions available</span>
                      )}
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="font-semibold text-slate-700 text-lg">No officers found</p>
                      <p className="text-sm mt-1">New officer registrations requiring approval will appear here.</p>
                      <button onClick={fetchOfficers} className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Retry</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center text-red-600 mb-4">
                <AlertTriangle className="w-6 h-6 mr-3" />
                <h3 className="text-xl font-bold">Reject Officer?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{selectedOfficer.full_name}</strong> will not be able to access the Officer Portal. A notification will be sent.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (Optional)</label>
                <textarea 
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm h-24 resize-none"
                  placeholder="e.g. Invalid credentials, duplicate account..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleReject}
                  disabled={actionLoading === selectedOfficer.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center"
                >
                  {actionLoading === selectedOfficer.id ? 'Rejecting...' : 'Reject Officer'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedOfficer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-indigo-600" /> Edit Officer
                </h3>
                <button onClick={() => setShowEditDrawer(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl mr-4">
                    {selectedOfficer.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">{selectedOfficer.full_name}</h4>
                    <p className="text-sm text-indigo-700 font-mono">ID: {selectedOfficer.id} | {selectedOfficer.status}</p>
                  </div>
                </div>

                <form id="editForm" onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" required
                      value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" disabled value={selectedOfficer.email}
                      className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed directly.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text"
                      value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select 
                      value={editForm.department_id} onChange={e => setEditForm({...editForm, department_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white"
                    >
                      <option value="">Unassigned</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowEditDrawer(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" form="editForm"
                  disabled={actionLoading === selectedOfficer.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center"
                >
                  {actionLoading === selectedOfficer.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
