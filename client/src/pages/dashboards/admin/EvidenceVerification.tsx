import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { 
  Search, Shield, FileText, CheckCircle, XCircle, AlertTriangle, 
  Clock, Eye, Image as ImageIcon, File, Filter, ChevronDown, 
  Download, FileVideo, History, User
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EvidenceVerification() {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, verified: 0, rejected: 0, replacement_required: 0, recently_submitted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evidenceRes, statsRes] = await Promise.all([
        adminApi.getEvidence(statusFilter ? { status: statusFilter } : {}),
        adminApi.getEvidenceStats()
      ]);
      setEvidence(evidenceRes.data || []);
      setStats(statsRes.data || {});
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load evidence.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      await adminApi.verifyEvidence(selectedEvidence.id, { verification_note: actionReason });
      setIsVerifyModalOpen(false);
      setActionReason('');
      setSelectedEvidence(null);
      fetchData();
    } catch (err) {
      alert('Unable to verify this evidence.');
    }
  };

  const handleReject = async () => {
    if (!actionReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    try {
      await adminApi.rejectEvidence(selectedEvidence.id, { reason: actionReason });
      setIsRejectModalOpen(false);
      setActionReason('');
      setSelectedEvidence(null);
      fetchData();
    } catch (err) {
      alert('Unable to reject this evidence.');
    }
  };

  const handleRequestReplacement = async () => {
    if (!actionReason.trim()) {
      alert('Reason is required.');
      return;
    }
    try {
      await adminApi.requestEvidenceReplacement(selectedEvidence.id, { reason: actionReason });
      setIsReplaceModalOpen(false);
      setActionReason('');
      setSelectedEvidence(null);
      fetchData();
    } catch (err) {
      alert('Unable to request replacement.');
    }
  };

  const loadHistory = async (id: number) => {
    try {
      const res = await adminApi.getEvidenceHistory(id);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetails = (ev: any) => {
    setSelectedEvidence(ev);
    loadHistory(ev.id);
  };

  const filteredEvidence = evidence.filter(e => 
    e.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id?.toString().includes(searchTerm) ||
    e.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.submitter_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'VERIFIED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'REPLACEMENT_REQUIRED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PENDING': default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getFileIcon = (type: string) => {
    if (!type) return <File className="w-5 h-5" />;
    const t = type.toLowerCase();
    if (t.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (t.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (t.includes('video')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/admin" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Evidence Verification</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Evidence Verification
          </h1>
          <p className="text-slate-500 mt-1">Review, verify and manage evidence submitted for municipal projects, inspections and citizen requests.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Evidence" value={stats.total} icon={FileText} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} colorClass="bg-yellow-50 text-yellow-600" />
        <StatCard title="Verified" value={stats.verified} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} colorClass="bg-red-50 text-red-600" />
        <StatCard title="Replace Req" value={stats.replacement_required} icon={AlertTriangle} colorClass="bg-orange-50 text-orange-600" />
        <StatCard title="Recent" value={stats.recently_submitted} icon={History} colorClass="bg-purple-50 text-purple-600" />
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by ID, name, project, or submitter..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select 
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="REPLACEMENT_REQUIRED">Replacement Required</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="w-8 h-8" />
          <p>{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Retry</button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg w-full"></div>
            ))}
          </div>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No evidence submitted yet.</h3>
          <p className="text-slate-500 max-w-md">Evidence submitted through inspections, projects and citizen requests will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold">Evidence</th>
                  <th className="p-4 font-semibold">Related Source</th>
                  <th className="p-4 font-semibold">Submitted By</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEvidence.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getFileIcon(ev.file_type)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{ev.file_name}</div>
                          <div className="text-xs text-slate-400">ID: EV-{ev.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {ev.project_id && (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 line-clamp-1">{ev.project_name}</span>
                          <span className="text-xs text-slate-500">
                            {ev.inspection_id ? `Inspection INS-${ev.inspection_id}` : 
                             ev.citizen_request_id ? `Request REQ-${ev.citizen_request_id}` : 'Project File'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{ev.submitter_name}</span>
                        <span className="text-xs text-slate-500">{ev.submitter_role}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ev.status)}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => openDetails(ev)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> <span className="font-medium">Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Drawer/Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-50 w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">Evidence Verification</h2>
              </div>
              <button 
                onClick={() => setSelectedEvidence(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor(selectedEvidence.status)}`}>
                <div className="flex items-center gap-3">
                  {selectedEvidence.status === 'VERIFIED' ? <CheckCircle className="w-6 h-6" /> : 
                   selectedEvidence.status === 'REJECTED' ? <XCircle className="w-6 h-6" /> :
                   <Clock className="w-6 h-6" />}
                  <div>
                    <h3 className="font-bold text-sm">Status: {selectedEvidence.status}</h3>
                    {selectedEvidence.verified_by_name && (
                      <p className="text-xs mt-0.5 opacity-80">By {selectedEvidence.verified_by_name} on {new Date(selectedEvidence.verified_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex justify-between items-center">
                  Preview
                  <a href={selectedEvidence.file_path} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
                <div className="p-4 flex items-center justify-center bg-slate-100 min-h-[250px]">
                  {selectedEvidence.file_type?.toLowerCase().includes('image') ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-16 h-16 text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Preview unavailable in demo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <File className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="text-slate-700 font-medium">{selectedEvidence.file_name}</p>
                      <p className="text-slate-500 text-sm mt-1">Preview unavailable. Please download to view.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Source Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedEvidence.project_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Project:</span>
                        <span className="font-medium text-right text-slate-800 line-clamp-1 max-w-[150px]">{selectedEvidence.project_name}</span>
                      </div>
                    )}
                    {selectedEvidence.inspection_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Inspection:</span>
                        <span className="font-medium text-slate-800">INS-{selectedEvidence.inspection_id}</span>
                      </div>
                    )}
                    {selectedEvidence.citizen_request_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Request:</span>
                        <span className="font-medium text-slate-800">REQ-{selectedEvidence.citizen_request_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-100 mt-2">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium text-slate-800">{new Date(selectedEvidence.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Submitter Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-medium text-slate-800">{selectedEvidence.submitter_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Role:</span>
                      <span className="font-medium text-slate-800">{selectedEvidence.submitter_role}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version History */}
              {history.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> Version History
                  </h4>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {history.map((h, i) => (
                      <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          v{h.version}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${getStatusColor(h.status).split(' ')[1]}`}>{h.status}</span>
                            <time className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString()}</time>
                          </div>
                          {h.reason && <p className="text-slate-600 text-xs mt-1">{h.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {selectedEvidence.status === 'PENDING' && (
              <div className="bg-white p-4 border-t border-slate-200 shrink-0 flex gap-3">
                <button 
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Verify Evidence
                </button>
                <button 
                  onClick={() => setIsReplaceModalOpen(true)}
                  className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Request Replacement
                </button>
                <button 
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-6 bg-red-100 hover:bg-red-200 text-red-700 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verify Confirmation Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Verify Evidence</h3>
            <p className="text-slate-600 mb-4">Are you sure this evidence is valid and supports the related record?</p>
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Verification Note (Optional)</label>
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Add any notes about this verification..."
              ></textarea>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsVerifyModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
              <button onClick={handleVerify} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Confirm Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-red-600 mb-2">Reject Evidence</h3>
            <p className="text-slate-600 mb-4">Provide a reason for rejecting this evidence. The submitter will be notified.</p>
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500" 
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Incorrect location, unclear image..."
                required
              ></textarea>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Reject Evidence</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Replacement Modal */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-orange-600 mb-2">Request Replacement</h3>
            <p className="text-slate-600 mb-4">Request the submitter to upload a replacement. This will create a new version of the evidence.</p>
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Required Correction <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500" 
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Please upload a higher resolution photo..."
                required
              ></textarea>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsReplaceModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
              <button onClick={handleRequestReplacement} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
