import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Inbox, AlertCircle, RefreshCw, MapPin, X, User, Clock, 
  Upload, Camera, FileText, CheckCircle2, XCircle, ArrowRight, 
  AlertTriangle, Check, ShieldAlert, Sparkles, Send
} from 'lucide-react';
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
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Custom action states
  const [actionType, setActionType] = useState<'' | 'reject' | 'progress' | 'evidence' | 'delay'>('');
  const [rejectReason, setRejectReason] = useState('Out of my department jurisdiction');
  const [rejectExplanation, setRejectExplanation] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [delayReason, setDelayReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError('Unable to load your assigned requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleAcceptRequest = async (id: number) => {
    setUpdating(true);
    try {
      const res = await axios.post(`/api/officer/requests/${id}/accept`, {}, { withCredentials: true });
      if (res.data.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'IN PROGRESS' } : r));
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest({ ...selectedRequest, status: 'IN PROGRESS' });
        }
        showNotification(res.data.message || 'Task accepted! Work is now IN PROGRESS.', 'success');
        resetActionState();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept task.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectRequest = async (id: number) => {
    if (!rejectReason) {
      alert('Please select a reason for declining.');
      return;
    }
    setUpdating(true);
    try {
      const res = await axios.post(`/api/officer/requests/${id}/reject`, {
        reason: rejectReason,
        notes: rejectExplanation
      }, { withCredentials: true });

      if (res.data.success) {
        // Remove task from officer's assigned queue
        setRequests(prev => prev.filter(r => r.id !== id));
        setSelectedRequest(null);
        resetActionState();
        showNotification(res.data.message || 'Assignment declined and returned to Municipal Authority for reassignment.', 'info');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline assignment.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string, remarks: string = '') => {
    setUpdating(true);
    try {
      const res = await axios.put(`/api/officer/requests/${id}/status`, { status: newStatus, remarks }, { withCredentials: true });
      if (res.data.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
        setSelectedRequest(null);
        resetActionState();
        showNotification(`Status updated to ${newStatus}`, 'success');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleProgressUpdate = async () => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      if (progressValue === 100) {
        await handleStatusUpdate(selectedRequest.id, 'COMPLETION_SUBMITTED', 'Work completed at 100%');
      } else {
        await handleStatusUpdate(selectedRequest.id, 'IN PROGRESS', `Progress updated to ${progressValue}%`);
      }
      showNotification(`Progress updated to ${progressValue}%`, 'success');
      resetActionState();
    } catch (err) {
      alert('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelayReport = async () => {
    if (!delayReason.trim() || !selectedRequest) return;
    setUpdating(true);
    try {
      await handleStatusUpdate(selectedRequest.id, 'DELAYED', `Delay reported: ${delayReason}`);
      showNotification(`Delay reported: ${delayReason}`, 'info');
      resetActionState();
    } catch (err) {
      alert('Failed to report delay');
    } finally {
      setUpdating(false);
    }
  };

  const handleEvidenceUpload = async () => {
    if (evidenceFiles.length === 0) return;
    setUpdating(true);
    try {
      showNotification(`${evidenceFiles.length} evidence photo(s) submitted for verification.`, 'success');
      resetActionState();
    } catch (err) {
      alert('Failed to upload evidence');
    } finally {
      setUpdating(false);
    }
  };

  const resetActionState = () => {
    setActionType('');
    setRejectExplanation('');
    setRejectReason('Out of my department jurisdiction');
    setProgressValue(0);
    setDelayReason('');
    setEvidenceFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEvidenceFiles(prev => [...prev, ...files]);
      setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (r.request_id_code && r.request_id_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['SUBMITTED', 'ASSIGNED'].includes(s)) {
      return <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full">ASSIGNED TO YOU</span>;
    }
    if (['ACCEPTED', 'IN PROGRESS', 'IN_PROGRESS'].includes(s)) {
      return <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full">IN PROGRESS</span>;
    }
    if (['PENDING VERIFICATION', 'COMPLETION_SUBMITTED'].includes(s)) {
      return <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full">VERIFICATION PENDING</span>;
    }
    if (['RESOLVED', 'VERIFIED'].includes(s)) {
      return <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full">RESOLVED</span>;
    }
    if (['DECLINED_BY_OFFICER'].includes(s)) {
      return <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full">DECLINED</span>;
    }
    return <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full">{status}</span>;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assigned Field Tasks & Requests</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review assigned municipal issues, accept work to begin resolution, or decline with a reason for reassignment.
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          disabled={loading} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* NOTIFICATION TOAST */}
      {notificationMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0 }}
          className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between shadow-md border ${
            notificationMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            notificationMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ticket code, title, or keywords..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'ASSIGNED', 'IN PROGRESS', 'COMPLETION_SUBMITTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ASSIGNED' ? 'New Assigned' : status === 'COMPLETION_SUBMITTED' ? 'Completed' : status}
            </button>
          ))}
        </div>
      </div>

      {/* REQUESTS LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg mb-1">No Assigned Tasks Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            You currently have no assigned tasks matching this filter. New citizen reports dispatched to you will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(r => {
            const isPendingDecision = ['SUBMITTED', 'ASSIGNED'].includes((r.status || '').toUpperCase());
            return (
              <div 
                key={`${r.source_type || 'task'}-${r.id}`} 
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {r.request_id_code || `TASK-${r.id}`}
                    </span>
                    {getStatusBadge(r.status)}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base line-clamp-2 mb-1.5">{r.title}</h3>
                  <p className="text-xs text-blue-700 font-bold mb-3">{r.service || r.category || 'General Civic Service'}</p>
                  
                  {r.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4 italic">
                      "{r.description}"
                    </p>
                  )}

                  <div className="space-y-1.5 mb-5 text-xs text-slate-600">
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span className="truncate">Citizen: <strong className="text-slate-800">{r.citizen_name || 'Rahul Kumar'}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span className="truncate">{r.location || 'Location Unspecified'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span>Priority: <strong className="text-rose-600">{r.priority || 'MEDIUM'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS ON CARD */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {isPendingDecision ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleAcceptRequest(r.id)}
                        disabled={updating}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept Task
                      </button>

                      <button 
                        onClick={() => {
                          setSelectedRequest(r);
                          setActionType('reject');
                        }}
                        disabled={updating}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedRequest(r)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2"
                    >
                      <span>Execute Work</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL & ACTION MODAL */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col"
            >
              {/* MODAL HEADER */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {selectedRequest.request_id_code}
                    </span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-2">{selectedRequest.title}</h2>
                </div>
                <button 
                  onClick={() => { setSelectedRequest(null); resetActionState(); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {/* ISSUE DESCRIPTION */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Citizen's Request</label>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm leading-relaxed text-slate-800">
                    {selectedRequest.description || 'No description provided.'}
                  </div>
                </div>

                {/* METADATA GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Citizen
                    </p>
                    <p className="font-bold text-slate-800 text-sm">{selectedRequest.citizen_name || 'Rahul Kumar'}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </p>
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{selectedRequest.location || 'Unspecified'}</p>
                  </div>
                </div>

                {/* REJECT / DECLINE PANEL */}
                {actionType === 'reject' && (
                  <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      <h4 className="font-black text-rose-900 text-base">Decline Assignment & Request Reassignment</h4>
                    </div>
                    <p className="text-xs text-rose-700 mb-4 leading-relaxed">
                      Please select the reason for declining this assignment. The Municipal Authority and Admin will be notified to immediately reassign this task to another available officer.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-rose-800 mb-1">
                          Primary Reason *
                        </label>
                        <select 
                          value={rejectReason} 
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full p-3 bg-white border border-rose-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="Out of my department jurisdiction">Out of my department jurisdiction</option>
                          <option value="Current workload capacity exceeded / Heavy backlog">Current workload capacity exceeded / Heavy backlog</option>
                          <option value="Specialized equipment / parts required">Specialized equipment / parts required</option>
                          <option value="Incorrect location / Outside assigned municipal ward">Incorrect location / Outside assigned municipal ward</option>
                          <option value="Duplicate or already under active repair">Duplicate or already under active repair</option>
                          <option value="Officer on official leave / field emergency">Officer on official leave / field emergency</option>
                          <option value="Other reason">Other reason (specified below)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-rose-800 mb-1">
                          Explanation Notes for Municipal Authority (Optional)
                        </label>
                        <textarea 
                          value={rejectExplanation}
                          onChange={(e) => setRejectExplanation(e.target.value)}
                          placeholder="e.g., Recommended to transfer to Water & Sanitation division due to underground main pipe leak..."
                          rows={3}
                          className="w-full p-3 bg-white border border-rose-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => handleRejectRequest(selectedRequest.id)}
                          disabled={updating || !rejectReason}
                          className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {updating ? 'Submitting...' : 'Confirm Decline & Reassign'}
                        </button>
                        <button 
                          onClick={resetActionState}
                          className="py-3 px-5 bg-white border border-rose-200 text-rose-800 font-bold rounded-xl text-xs uppercase hover:bg-rose-100 transition"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROGRESS UPDATE PANEL */}
                {actionType === 'progress' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Update Progress (0-100%)</h4>
                    <div className="flex items-center space-x-4 mb-6">
                      <input type="range" min="0" max="100" step="25" value={progressValue} onChange={e => setProgressValue(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                      <span className="font-black text-2xl text-blue-700 w-16 text-right">{progressValue}%</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-blue-400 px-1 mb-6">
                      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                    </div>
                    <div className="flex gap-3">
                      <button disabled={updating} onClick={handleProgressUpdate} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">Save Progress</button>
                      <button onClick={resetActionState} className="flex-1 py-2.5 bg-white text-blue-700 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition">Cancel</button>
                    </div>
                  </div>
                )}

                {/* EVIDENCE PANEL */}
                {actionType === 'evidence' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-emerald-900 mb-2 flex items-center"><Camera className="w-4 h-4 mr-2" /> Upload Field Evidence</h4>
                    <p className="text-sm text-emerald-700 mb-4">Upload photos of the completed or in-progress work to verify status.</p>
                    <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center cursor-pointer hover:bg-emerald-100/50 transition bg-white mb-4" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-700">Click to upload photos</p>
                      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    </div>
                    {previewUrls.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
                        {previewUrls.map((url, i) => (
                          <img key={i} src={url} className="w-16 h-16 rounded-lg object-cover border border-emerald-200" />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button disabled={updating || evidenceFiles.length === 0} onClick={handleEvidenceUpload} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50">Upload Evidence</button>
                      <button onClick={resetActionState} className="flex-1 py-2.5 bg-white text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition">Cancel</button>
                    </div>
                  </div>
                )}

                {/* DELAY PANEL */}
                {actionType === 'delay' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-orange-900 mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Report Delay</h4>
                    <p className="text-sm text-orange-700 mb-4">Provide a genuine reason for the delay. This will be reviewed by Higher Officials.</p>
                    <select value={delayReason} onChange={e => setDelayReason(e.target.value)} className="w-full p-3 bg-white border border-orange-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium">
                      <option value="">Select reason...</option>
                      <option value="Material unavailable">Material unavailable</option>
                      <option value="Staff shortage">Staff shortage</option>
                      <option value="Weather conditions">Weather conditions</option>
                      <option value="Equipment unavailable">Equipment unavailable</option>
                      <option value="Technical issue">Technical issue</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="flex gap-3">
                      <button disabled={updating || !delayReason} onClick={handleDelayReport} className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition disabled:opacity-50">Submit Delay Report</button>
                      <button onClick={resetActionState} className="flex-1 py-2.5 bg-white text-orange-700 font-bold rounded-xl border border-orange-200 hover:bg-orange-100 transition">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Bottom Bar) */}
              {!actionType && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex flex-wrap gap-3">
                  {/* PENDING ASSIGNMENT ACTIONS (ACCEPT / DECLINE) */}
                  {(selectedRequest.status === 'SUBMITTED' || selectedRequest.status === 'ASSIGNED') && (
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => handleAcceptRequest(selectedRequest.id)}
                        disabled={updating}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Accept Task & Start Work
                      </button>

                      <button 
                        onClick={() => setActionType('reject')}
                        disabled={updating}
                        className="py-3 px-5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Decline Task
                      </button>
                    </div>
                  )}

                  {/* ACTIVE WORK ACTIONS */}
                  {(selectedRequest.status === 'ACCEPTED' || selectedRequest.status === 'IN PROGRESS' || selectedRequest.status === 'IN_PROGRESS') && (
                    <>
                      <button onClick={() => setActionType('progress')} className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition">
                        Update Progress
                      </button>
                      <button onClick={() => setActionType('evidence')} className="flex-1 py-2.5 px-4 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition">
                        Upload Evidence
                      </button>
                      <button onClick={() => setActionType('delay')} className="w-full py-2.5 px-4 bg-orange-100 text-orange-800 font-bold text-sm rounded-xl hover:bg-orange-200 border border-orange-200 transition">
                        Report Delay
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
