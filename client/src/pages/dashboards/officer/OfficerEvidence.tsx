import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderOpen, RefreshCw, AlertCircle, UploadCloud, X, FileText, Image as ImageIcon, Camera, Building, User, Target, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function OfficerEvidence() {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [contextData, setContextData] = useState<any>({ projects: [], requests: [], inspections: [], kpis: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [contextType, setContextType] = useState('Project');
  const [relatedId, setRelatedId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvidence = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/officer/evidence', { withCredentials: true });
      if (res.data.success) {
        setEvidenceList(res.data.data);
      } else {
        setError(res.data.message || 'Unable to load evidence');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to view evidence.');
      } else {
        setError('Unable to load your evidence.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchContextData = async () => {
    try {
      const res = await axios.get('/api/officer/evidence/context', { withCredentials: true });
      if (res.data.success) {
        setContextData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load context data', err);
    }
  };

  useEffect(() => {
    fetchEvidence();
    fetchContextData();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload a JPG, PNG, WEBP, or PDF.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !relatedId) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('context_type', contextType);
    formData.append('related_id', relatedId);
    formData.append('description', description);

    try {
      const res = await axios.post('/api/officer/evidence', formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        alert('Evidence uploaded successfully!');
        setShowUploadModal(false);
        setSelectedFile(null);
        setDescription('');
        setRelatedId('');
        fetchEvidence();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to upload evidence.');
    } finally {
      setUploading(false);
    }
  };

  const filteredEvidence = evidenceList.filter(e => {
    const searchString = `${e.file_name} ${e.project_name} ${e.request_title} ${e.kpi_name}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
                          
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && e.status === statusFilter;
  });

  const summary = {
    total: evidenceList.length,
    pending: evidenceList.filter(e => e.status === 'PENDING VERIFICATION').length,
    approved: evidenceList.filter(e => e.status === 'VERIFIED' || e.status === 'APPROVED').length,
    rejected: evidenceList.filter(e => e.status === 'REJECTED' || e.status === 'REPLACEMENT_REQUIRED').length,
  };

  const getStatusBadge = (status: string) => {
    let classes = 'bg-gray-100 text-gray-800 border-gray-200';
    if (['PENDING VERIFICATION'].includes(status)) classes = 'bg-orange-100 text-orange-800 border-orange-200';
    if (['VERIFIED', 'APPROVED'].includes(status)) classes = 'bg-green-100 text-green-800 border-green-200';
    if (['REJECTED', 'REPLACEMENT_REQUIRED'].includes(status)) classes = 'bg-red-100 text-red-800 border-red-200';

    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  const getContextOptions = () => {
    switch(contextType) {
      case 'Project':
        return contextData.projects.map((p: any) => <option key={`p-${p.id}`} value={p.id}>{p.project_name}</option>);
      case 'Request':
        return contextData.requests.map((r: any) => <option key={`r-${r.id}`} value={r.id}>{r.request_id_code} - {r.title}</option>);
      case 'Inspection':
        return contextData.inspections.map((i: any) => <option key={`i-${i.id}`} value={i.id}>INS-{(i.id||0).toString().padStart(4,'0')} ({i.project_name || 'General'})</option>);
      case 'KPI':
        return contextData.kpis.map((k: any) => <option key={`k-${k.id}`} value={k.id}>{k.name} ({k.project_name})</option>);
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">EVIDENCE</h1>
          <p className="text-slate-500">Manage field evidence submitted for municipal projects, inspections, service requests, and KPI updates.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="py-2.5 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center whitespace-nowrap"
        >
          <UploadCloud className="w-5 h-5 mr-2" /> Upload Evidence
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Evidence</p>
          <p className="text-2xl font-black text-slate-800">{summary.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 mb-1">Pending Verification</p>
          <p className="text-2xl font-black text-orange-700">{summary.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-green-500 mb-1">Approved</p>
          <p className="text-2xl font-black text-green-700">{summary.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase text-red-500 mb-1">Rejected</p>
          <p className="text-2xl font-black text-red-700">{summary.rejected}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search evidence files..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['All', 'PENDING VERIFICATION', 'VERIFIED', 'REJECTED'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'VERIFIED' ? 'Approved' : f === 'PENDING VERIFICATION' ? 'Pending' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-600" />
          <p className="font-medium">Loading evidence...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to load evidence.</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchEvidence}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
          <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Evidence Submitted</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Evidence uploaded from your projects, inspections, service requests, and KPI updates will appear here.</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="py-2.5 px-6 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center"
          >
            <UploadCloud className="w-5 h-5 mr-2" /> Upload Evidence
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvidence.map(e => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-48 bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden border-b border-gray-200 group">
                {e.file_type === 'IMAGE' ? (
                  <img src={e.file_path} alt={e.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <FileText className="w-16 h-16 text-slate-300" />
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-sm border border-white/50">
                  EV-{(e.id||0).toString().padStart(5, '0')}
                </div>
                <div className="absolute top-3 right-3">
                  {getStatusBadge(e.status)}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight mb-3 line-clamp-1" title={e.file_name}>
                    {e.file_name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    {e.project_name && (
                      <div className="flex items-start text-xs text-slate-600">
                        <Building className="w-3.5 h-3.5 mr-2 mt-0.5 text-indigo-500 flex-shrink-0" />
                        <span className="line-clamp-1"><span className="font-semibold text-slate-500 mr-1">Project:</span> {e.project_name}</span>
                      </div>
                    )}
                    {e.request_title && (
                      <div className="flex items-start text-xs text-slate-600">
                        <User className="w-3.5 h-3.5 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                        <span className="line-clamp-1"><span className="font-semibold text-slate-500 mr-1">Request:</span> {e.request_title}</span>
                      </div>
                    )}
                    {e.inspection_id_num && (
                      <div className="flex items-start text-xs text-slate-600">
                        <CheckCircle className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span className="line-clamp-1"><span className="font-semibold text-slate-500 mr-1">Inspection:</span> INS-{e.inspection_id_num.toString().padStart(4,'0')}</span>
                      </div>
                    )}
                    {e.kpi_name && (
                      <div className="flex items-start text-xs text-slate-600">
                        <Target className="w-3.5 h-3.5 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                        <span className="line-clamp-1"><span className="font-semibold text-slate-500 mr-1">KPI:</span> {e.kpi_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-slate-400 text-xs mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {e.created_at ? new Date(e.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                  <a href={e.file_path} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800">
                    View File
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-black text-slate-900 flex items-center">
                  <UploadCloud className="w-5 h-5 mr-2 text-indigo-600" /> UPLOAD EVIDENCE
                </h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpload} className="p-6 overflow-y-auto flex-1 space-y-5">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Evidence Context <span className="text-red-500">*</span></label>
                  <select 
                    value={contextType}
                    onChange={(e) => {
                      setContextType(e.target.value);
                      setRelatedId('');
                    }}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  >
                    <option value="Project">Project Progress</option>
                    <option value="Request">Citizen Service Request</option>
                    <option value="Inspection">Field Inspection</option>
                    <option value="KPI">KPI Update</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Related Record <span className="text-red-500">*</span></label>
                  <select 
                    value={relatedId}
                    onChange={(e) => setRelatedId(e.target.value)}
                    required
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm disabled:opacity-50"
                  >
                    <option value="">-- Select {contextType} --</option>
                    {getContextOptions()}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">File <span className="text-red-500">*</span></label>
                  
                  {selectedFile ? (
                    <div className="p-4 border-2 border-indigo-100 bg-indigo-50 rounded-xl flex justify-between items-center">
                      <div className="flex items-center overflow-hidden">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 mr-3 text-indigo-500 flex-shrink-0" /> : <FileText className="w-5 h-5 mr-3 text-indigo-500 flex-shrink-0" />}
                        <span className="font-medium text-indigo-900 truncate">{selectedFile.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="ml-4 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group"
                    >
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-3 group-hover:text-indigo-500 transition-colors" />
                      <p className="font-bold text-slate-700 mb-1">Click to browse</p>
                      <p className="text-xs text-slate-500">JPG, PNG, WEBP, or PDF (Max 10MB)</p>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileSelect}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 shadow-sm"
                    placeholder="Provide details about what this evidence demonstrates..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div className="pt-4 flex gap-3 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-3 px-4 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading || !selectedFile || !relatedId || !description}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                  >
                    {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Upload Evidence'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
