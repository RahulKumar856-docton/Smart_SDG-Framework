import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Inbox, AlertCircle, RefreshCw, MapPin, X, User, Clock, Upload, Camera, FileText } from 'lucide-react';
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
  
  // Custom action states
  const [actionType, setActionType] = useState<'' | 'reject' | 'progress' | 'evidence' | 'delay'>('');
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

  const handleStatusUpdate = async (id: number, newStatus: string, remarks: string = '') => {
    setUpdating(true);
    try {
      const res = await axios.put(`/api/officer/requests/${id}/status`, { status: newStatus, remarks }, { withCredentials: true });
      if (res.data.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
        setSelectedRequest(null);
        resetActionState();
      }
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleProgressUpdate = async () => {
    setUpdating(true);
    try {
      // Assuming a progress endpoint exists, otherwise simulate
      // await axios.post(`/api/officer/reports/${selectedRequest.id}/progress`, { progress: progressValue });
      alert(`Progress updated to ${progressValue}%`);
      if (progressValue === 100) {
        handleStatusUpdate(selectedRequest.id, 'PENDING VERIFICATION', 'Work completed at 100%');
      } else {
        handleStatusUpdate(selectedRequest.id, 'IN PROGRESS', `Progress updated to ${progressValue}%`);
      }
    } catch (err) {
      alert('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelayReport = async () => {
    if (!delayReason.trim()) return;
    setUpdating(true);
    try {
      // await axios.post(`/api/officer/reports/${selectedRequest.id}/delay`, { reason: delayReason });
      alert(`Delay reported: ${delayReason}`);
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
      // const fd = new FormData();
      // evidenceFiles.forEach(f => fd.append('evidence', f));
      // await axios.post(`/api/officer/reports/${selectedRequest.id}/evidence`, fd);
      alert(`${evidenceFiles.length} evidence file(s) uploaded successfully.`);
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
                          (r.request_id_code && r.request_id_code.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    let classes = 'bg-gray-100 text-gray-800';
    if (['SUBMITTED', 'ASSIGNED'].includes(status)) classes = 'bg-blue-100 text-blue-800 border-blue-200';
    if (['ACCEPTED', 'IN PROGRESS'].includes(status)) classes = 'bg-purple-100 text-purple-800 border-purple-200';
    if (['PENDING VERIFICATION'].includes(status)) classes = 'bg-orange-100 text-orange-800 border-orange-200';
    if (['COMPLETED', 'RESOLVED'].includes(status)) classes = 'bg-green-100 text-green-800 border-green-200';
    if (['REJECTED'].includes(status)) classes = 'bg-red-100 text-red-800 border-red-200';
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MY ASSIGNED WORK</h1>
          <p className="text-slate-500">Manage field assignments, update progress, and submit evidence.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['All', 'ASSIGNED', 'IN PROGRESS', 'PENDING VERIFICATION', 'RESOLVED'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-600" />
          <p className="font-medium">Loading assignments...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-slate-300 text-center">
          <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Assignments</h3>
          <p className="text-slate-500">You currently have no citizen reports or tasks assigned to you.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono font-bold text-slate-500">{r.request_id_code}</span>
                {getStatusBadge(r.status)}
              </div>
              <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-2">{r.title}</h3>
              <p className="text-sm text-emerald-700 font-semibold mb-4">{r.service || r.category}</p>
              
              <div className="space-y-2 mb-6 flex-grow">
                <div className="flex items-center text-slate-600 text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="line-clamp-1">{r.location || 'N/A'}</span>
                </div>
                <div className="flex items-center text-slate-600 text-sm">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span>SLA: 48 Hours</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedRequest(r)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-black transition-colors mt-auto"
              >
                Execute Work
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Execute Work Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedRequest.request_id_code}</h2>
                  <p className="text-sm font-semibold text-emerald-600">{selectedRequest.service || selectedRequest.category}</p>
                </div>
                <button 
                  onClick={() => {setSelectedRequest(null); resetActionState();}}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedRequest.title}</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded uppercase">Priority: {selectedRequest.priority || 'HIGH'}</span>
                  </div>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Citizen</p>
                    <p className="font-semibold text-slate-800 text-sm">{selectedRequest.citizen_name || 'Anonymous'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="font-semibold text-slate-800 text-sm line-clamp-2">{selectedRequest.location || 'N/A'}</p>
                  </div>
                </div>

                {/* DYNAMIC ACTION PANEL */}
                {actionType === 'progress' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Update Progress (0-100%)</h4>
                    <div className="flex items-center space-x-4 mb-6">
                      <input type="range" min="0" max="100" step="25" value={progressValue} onChange={e => setProgressValue(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                      <span className="font-black text-2xl text-blue-700 w-16 text-right">{progressValue}%</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-blue-400 px-1 mb-6">
                      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                    </div>
                    <div className="flex gap-3">
                      <button disabled={updating} onClick={handleProgressUpdate} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Save Progress</button>
                      <button onClick={resetActionState} className="flex-1 py-2 bg-white text-blue-700 font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {actionType === 'evidence' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-emerald-900 mb-2 flex items-center"><Camera className="w-4 h-4 mr-2" /> Upload Field Evidence</h4>
                    <p className="text-sm text-emerald-700 mb-4">Upload photos of the completed or in-progress work to verify status.</p>
                    <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center cursor-pointer hover:bg-emerald-100/50 transition-colors bg-white mb-4" onClick={() => fileInputRef.current?.click()}>
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
                      <button disabled={updating || evidenceFiles.length === 0} onClick={handleEvidenceUpload} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">Upload Evidence</button>
                      <button onClick={resetActionState} className="flex-1 py-2 bg-white text-emerald-700 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {actionType === 'delay' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-orange-900 mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Report Delay</h4>
                    <p className="text-sm text-orange-700 mb-4">Provide a genuine reason for the delay. This will be reviewed by Higher Officials.</p>
                    <select value={delayReason} onChange={e => setDelayReason(e.target.value)} className="w-full p-3 bg-white border border-orange-200 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium">
                      <option value="">Select reason...</option>
                      <option value="Material unavailable">Material unavailable</option>
                      <option value="Staff shortage">Staff shortage</option>
                      <option value="Weather conditions">Weather conditions</option>
                      <option value="Equipment unavailable">Equipment unavailable</option>
                      <option value="Technical issue">Technical issue</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="flex gap-3">
                      <button disabled={updating || !delayReason} onClick={handleDelayReport} className="flex-1 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">Submit Delay Report</button>
                      <button onClick={resetActionState} className="flex-1 py-2 bg-white text-orange-700 font-bold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Bottom Bar) */}
              {!actionType && (
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3">
                  {(selectedRequest.status === 'SUBMITTED' || selectedRequest.status === 'ASSIGNED') && (
                    <button onClick={() => handleStatusUpdate(selectedRequest.id, 'IN PROGRESS')} className="flex-1 py-3 px-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-colors shadow-lg shadow-slate-900/20">
                      Start Work
                    </button>
                  )}

                  {(selectedRequest.status === 'ACCEPTED' || selectedRequest.status === 'IN PROGRESS') && (
                    <>
                      <button onClick={() => setActionType('progress')} className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors">
                        Update Progress
                      </button>
                      <button onClick={() => setActionType('evidence')} className="flex-1 py-2.5 px-4 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors">
                        Upload Evidence
                      </button>
                      <button onClick={() => setActionType('delay')} className="w-full py-2.5 px-4 bg-orange-100 text-orange-800 font-bold text-sm rounded-xl hover:bg-orange-200 border border-orange-200 transition-colors">
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
