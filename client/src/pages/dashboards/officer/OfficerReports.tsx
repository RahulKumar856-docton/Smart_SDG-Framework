import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FileText, Search, Plus, X, Save, Send, AlertCircle, 
  CheckCircle, FileSignature, MapPin, ChevronRight, ListChecks, CheckSquare, Settings2, Trash2
} from 'lucide-react';

export default function OfficerReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [inspectionsContext, setInspectionsContext] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    id: null as number | null,
    inspection_id: '',
    project_id: '',
    request_id: '',
    summary: '',
    overall_result: 'SATISFACTORY',
    observations: [] as any[],
    findings: [] as any[],
    status: 'DRAFT'
  });
  
  // Form temp inputs
  const [newObs, setNewObs] = useState({ title: '', description: '', condition: 'Moderate', severity: 'MEDIUM' });
  const [newFinding, setNewFinding] = useState({ title: '', description: '', severity: 'HIGH', recommended_action: '', responsible_department: '' });

  useEffect(() => {
    fetchReports();
    fetchContext();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/officer/reports');
      setReports(res.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) window.location.href = '/officer/login';
      setError('Unable to load inspection reports.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchContext = async () => {
    try {
      const res = await axios.get('/api/officer/reports/context');
      setInspectionsContext(res.data.data?.inspections || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReportDetails = async (id: number) => {
    try {
      const res = await axios.get(`/api/officer/reports/${id}`);
      const data = res.data.data;
      setFormData({
        id: data.id,
        inspection_id: data.inspection_id || '',
        project_id: data.project_id || '',
        request_id: data.request_id || '',
        summary: data.summary || '',
        overall_result: data.overall_result || 'SATISFACTORY',
        observations: data.observations || [],
        findings: data.findings || [],
        status: data.status || 'DRAFT'
      });
      setSelectedReportId(data.id);
      setIsDetailOpen(data.status !== 'DRAFT' && data.status !== 'REJECTED');
      setIsCreateOpen(data.status === 'DRAFT' || data.status === 'REJECTED');
    } catch (err) {
      alert("Failed to load report details");
    }
  };

  const handleInspectionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inspId = e.target.value;
    const insp = inspectionsContext.find(i => i.id.toString() === inspId);
    if (insp) {
      setFormData({ ...formData, inspection_id: inspId, project_id: insp.project_id || '' });
    } else {
      setFormData({ ...formData, inspection_id: inspId });
    }
  };

  const addObservation = () => {
    if (!newObs.title || !newObs.description) return;
    setFormData({ ...formData, observations: [...formData.observations, newObs] });
    setNewObs({ title: '', description: '', condition: 'Moderate', severity: 'MEDIUM' });
  };
  
  const addFinding = () => {
    if (!newFinding.title || !newFinding.description) return;
    setFormData({ ...formData, findings: [...formData.findings, newFinding] });
    setNewFinding({ title: '', description: '', severity: 'HIGH', recommended_action: '', responsible_department: '' });
  };

  const removeObservation = (idx: number) => {
    const updated = [...formData.observations];
    updated.splice(idx, 1);
    setFormData({ ...formData, observations: updated });
  };
  
  const removeFinding = (idx: number) => {
    const updated = [...formData.findings];
    updated.splice(idx, 1);
    setFormData({ ...formData, findings: updated });
  };

  const saveReport = async (status: string) => {
    if (!formData.inspection_id) {
      alert("Please select an inspection.");
      return;
    }
    if (status === 'SUBMITTED' && !formData.summary) {
      alert("Summary is required to submit a report.");
      return;
    }
    
    try {
      const payload = { ...formData, status };
      if (formData.id) {
        await axios.put(`/api/officer/reports/${formData.id}`, payload);
      } else {
        await axios.post('/api/officer/reports', payload);
      }
      setIsCreateOpen(false);
      setFormData({ id: null, inspection_id: '', project_id: '', request_id: '', summary: '', overall_result: 'SATISFACTORY', observations: [], findings: [], status: 'DRAFT' });
      fetchReports();
    } catch (err) {
      alert("Failed to save report");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUBMITTED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'DRAFT': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredReports = reports.filter(r => {
    const matchSearch = r.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.inspection_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.id.toString().includes(searchQuery);
    if (statusFilter === 'ALL') return matchSearch;
    return matchSearch && r.status === statusFilter;
  });
  
  const counts = {
    total: reports.length,
    drafts: reports.filter(r => r.status === 'DRAFT').length,
    submitted: reports.filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING REVIEW').length,
    approved: reports.filter(r => r.status === 'APPROVED').length,
    rejected: reports.filter(r => r.status === 'REJECTED').length
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 animate-pulse rounded w-1/4"></div>
        <div className="grid grid-cols-5 gap-6"><div className="h-32 bg-slate-200 animate-pulse rounded-xl col-span-5"></div></div>
        <div className="h-96 bg-slate-200 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
        <button onClick={fetchReports} className="px-6 py-2 bg-slate-900 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">INSPECTION REPORTS</h1>
          <p className="text-slate-500 mt-2">Create, submit and track reports from your field inspections.</p>
        </div>
        <button onClick={() => {
          setFormData({ id: null, inspection_id: '', project_id: '', request_id: '', summary: '', overall_result: 'SATISFACTORY', observations: [], findings: [], status: 'DRAFT' });
          setIsCreateOpen(true);
        }} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center shadow-sm transition-colors">
          <Plus className="w-5 h-5 mr-2" /> Create Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 mb-1">TOTAL REPORTS</p>
          <h3 className="text-2xl font-black text-slate-900">{counts.total}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 mb-1">DRAFTS</p>
          <h3 className="text-2xl font-black text-slate-900">{counts.drafts}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 mb-1">PENDING REVIEW</p>
          <h3 className="text-2xl font-black text-blue-600">{counts.submitted}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 mb-1">APPROVED</p>
          <h3 className="text-2xl font-black text-green-600">{counts.approved}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-bold text-red-600 mb-1">REJECTED</p>
          <h3 className="text-2xl font-black text-red-700">{counts.rejected}</h3>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search reports by ID, project, or type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Drafts</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Report List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileSignature className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Inspection Reports</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Reports created from your field inspections will appear here.
          </p>
          <button onClick={() => setIsCreateOpen(true)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
            Create Report
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 tracking-wider">REPORT</th>
                <th className="p-4 text-xs font-bold text-slate-500 tracking-wider">PROJECT / INSPECTION</th>
                <th className="p-4 text-xs font-bold text-slate-500 tracking-wider">DATE</th>
                <th className="p-4 text-xs font-bold text-slate-500 tracking-wider">STATUS</th>
                <th className="p-4 text-xs font-bold text-slate-500 tracking-wider text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">RPT-{r.id.toString().padStart(4, '0')}</div>
                    {r.overall_result && <div className="text-xs text-slate-500 mt-1">{r.overall_result}</div>}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{r.project_name || 'General'}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                      <ListChecks className="w-3 h-3 mr-1" /> {r.inspection_type || `INS-${r.inspection_id}`}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => loadReportDetails(r.id)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      {r.status === 'DRAFT' || r.status === 'REJECTED' ? 'Continue' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT DRAFT MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}></motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden">
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{formData.id ? 'Edit Inspection Report' : 'Create Inspection Report'}</h2>
                <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                
                {formData.status === 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-900 mb-1">Report Rejected - Needs Correction</h4>
                      <p className="text-sm text-red-700">Please review the admin feedback and resubmit your report.</p>
                    </div>
                  </div>
                )}

                {/* META INFO */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-wider flex items-center"><ListChecks className="w-4 h-4 mr-2" /> INSPECTION CONTEXT</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Select Inspection *</label>
                      <select 
                        value={formData.inspection_id} 
                        onChange={handleInspectionSelect}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Select Completed/Active Inspection --</option>
                        {inspectionsContext.map(i => (
                          <option key={i.id} value={i.id}>INS-{i.id} : {i.inspection_type} ({new Date(i.inspection_date).toLocaleDateString()})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Related Project</label>
                      <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">
                        {formData.project_id ? (inspectionsContext.find(i => i.id.toString() === formData.inspection_id)?.project_name || `Project ID: ${formData.project_id}`) : 'Auto-populated'}
                      </div>
                    </div>
                  </div>
                </section>

                {/* SUMMARY */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-wider flex items-center"><FileText className="w-4 h-4 mr-2" /> INSPECTION SUMMARY</h3>
                  <textarea 
                    value={formData.summary}
                    onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    placeholder="Provide a concise summary of what was observed during the field inspection..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                  ></textarea>
                </section>

                {/* OBSERVATIONS */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-wider">FIELD OBSERVATIONS</h3>
                  
                  {formData.observations.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {formData.observations.map((obs, idx) => (
                        <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-800">{obs.title}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{obs.condition}</span>
                            </div>
                            <p className="text-sm text-slate-600">{obs.description}</p>
                          </div>
                          <button onClick={() => removeObservation(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                    <h5 className="text-xs font-bold text-slate-500 mb-3 uppercase">Add New Observation</h5>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input type="text" placeholder="Observation Title" value={newObs.title} onChange={e => setNewObs({...newObs, title: e.target.value})} className="p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400" />
                      <select value={newObs.condition} onChange={e => setNewObs({...newObs, condition: e.target.value})} className="p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400">
                        <option>Good</option><option>Moderate</option><option>Needs Attention</option><option>Critical</option>
                      </select>
                      <textarea placeholder="Description" value={newObs.description} onChange={e => setNewObs({...newObs, description: e.target.value})} className="col-span-2 p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 resize-none h-20"></textarea>
                    </div>
                    <button onClick={addObservation} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300 transition-colors">
                      + Add Observation
                    </button>
                  </div>
                </section>

                {/* FINDINGS */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-wider">CRITICAL FINDINGS & RECOMMENDATIONS</h3>
                  
                  {formData.findings.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {formData.findings.map((f, idx) => (
                        <div key={idx} className="flex justify-between items-start p-4 bg-orange-50 border border-orange-100 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-orange-900">{f.title}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-200 text-orange-800">{f.severity}</span>
                            </div>
                            <p className="text-sm text-orange-800 mb-2">{f.description}</p>
                            <p className="text-xs font-medium text-orange-700 bg-white p-2 rounded border border-orange-100"><span className="font-bold">Action:</span> {f.recommended_action}</p>
                          </div>
                          <button onClick={() => removeFinding(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 border border-dashed border-orange-200 rounded-lg bg-orange-50/30">
                    <h5 className="text-xs font-bold text-orange-500 mb-3 uppercase">Add New Finding</h5>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input type="text" placeholder="Finding Title" value={newFinding.title} onChange={e => setNewFinding({...newFinding, title: e.target.value})} className="p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-orange-400" />
                      <select value={newFinding.severity} onChange={e => setNewFinding({...newFinding, severity: e.target.value})} className="p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-orange-400">
                        <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                      </select>
                      <textarea placeholder="Description of finding" value={newFinding.description} onChange={e => setNewFinding({...newFinding, description: e.target.value})} className="col-span-2 p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-orange-400 resize-none h-16"></textarea>
                      <input type="text" placeholder="Recommended Action" value={newFinding.recommended_action} onChange={e => setNewFinding({...newFinding, recommended_action: e.target.value})} className="col-span-2 p-2 border border-slate-200 rounded-md text-sm outline-none focus:border-orange-400" />
                    </div>
                    <button onClick={addFinding} className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-bold rounded-lg hover:bg-orange-200 transition-colors">
                      + Add Finding
                    </button>
                  </div>
                </section>

                {/* OVERALL RESULT */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-wider flex items-center"><CheckSquare className="w-4 h-4 mr-2" /> OVERALL INSPECTION RESULT</h3>
                  <select 
                    value={formData.overall_result}
                    onChange={e => setFormData({...formData, overall_result: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SATISFACTORY">SATISFACTORY</option>
                    <option value="SATISFACTORY WITH OBSERVATIONS">SATISFACTORY WITH OBSERVATIONS</option>
                    <option value="REQUIRES ACTION">REQUIRES ACTION</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </section>

              </div>

              <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
                <button onClick={() => setIsCreateOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <div className="flex gap-3">
                  <button onClick={() => saveReport('DRAFT')} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center">
                    <Save className="w-4 h-4 mr-2" /> Save Draft
                  </button>
                  <button onClick={() => saveReport('SUBMITTED')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md">
                    <Send className="w-4 h-4 mr-2" /> Submit Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL (VIEW ONLY) */}
      <AnimatePresence>
        {isDetailOpen && formData.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)}></motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden">
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">RPT-{formData.id.toString().padStart(4, '0')}</h2>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(formData.status)}`}>{formData.status}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{formData.overall_result}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 mb-6 flex items-start gap-4 shadow-sm">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><FileText className="w-6 h-6" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-1 uppercase">Inspection Summary</h4>
                    <p className="text-slate-800 text-sm leading-relaxed">{formData.summary}</p>
                  </div>
                </div>

                {formData.observations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Observations</h4>
                    <div className="space-y-3">
                      {formData.observations.map((obs, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-bold text-slate-800 text-sm">{obs.title}</h5>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">{obs.condition}</span>
                          </div>
                          <p className="text-sm text-slate-600">{obs.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.findings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Findings & Actions</h4>
                    <div className="space-y-3">
                      {formData.findings.map((f, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-orange-200 border-l-4 border-l-orange-500 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-bold text-slate-800 text-sm">{f.title}</h5>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded">{f.severity}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{f.description}</p>
                          <div className="bg-slate-50 p-2 rounded text-xs font-medium text-slate-700 border border-slate-100">
                            <span className="font-bold uppercase mr-1">Action:</span> {f.recommended_action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              
              <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
