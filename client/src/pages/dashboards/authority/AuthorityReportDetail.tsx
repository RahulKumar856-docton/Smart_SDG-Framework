import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Brain, MapPin, Clock, ShieldCheck, Activity, Users, 
  AlertTriangle, FileText, Send, X, CheckCircle, UserCheck, 
  Sparkles, Mail, Phone, Calendar, Tag, ChevronRight, Loader2, Award
} from 'lucide-react';

export default function AuthorityReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals & form state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // AI analysis state
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  useEffect(() => {
    fetchReport();
    fetchOfficersAndDepts();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/authority/reports/${id}`);
      if (res.data.success) {
        setReport(res.data.data);
        if (res.data.data.department_id) {
          setSelectedDept(String(res.data.data.department_id));
        }
      } else {
        setError('Report not found');
      }
    } catch (err: any) {
      setError('Unable to load this report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficersAndDepts = async () => {
    try {
      const [offRes, deptRes] = await Promise.all([
        axios.get('/api/authority/officers'),
        axios.get('/api/authority/departments')
      ]);
      if (offRes.data.success) setOfficers(offRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (err) {
      console.error("Failed to load officers or departments", err);
    }
  };

  const handleRunAIAnalysis = async () => {
    setAnalyzingAI(true);
    setAiSuccessMsg('');
    try {
      const res = await axios.post(`/api/authority/reports/${id}/run-ai`);
      if (res.data.success) {
        setAiSuccessMsg('AI Municipal Analysis completed successfully!');
        await fetchReport();
      } else {
        alert(res.data.message || 'AI analysis failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error executing AI analysis');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleApplyAIRecommendation = async () => {
    if (!report?.ai_data) return;
    const recommendedDept = report.ai_data.recommended_department_id;
    if (!recommendedDept) return;
    
    try {
      await axios.post(`/api/authority/reports/${id}/assign-department`, { department_id: recommendedDept });
      await fetchReport();
      alert(`Applied AI recommendation: Department set to ${report.ai_data.recommended_department_name}!`);
    } catch (err) {
      alert("Failed to apply recommendation");
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedOfficer) {
      alert("Please select an officer to assign");
      return;
    }
    setAssigning(true);
    try {
      const res = await axios.post(`/api/authority/reports/${id}/assign-officer`, {
        officer_id: Number(selectedOfficer),
        department_id: selectedDept ? Number(selectedDept) : undefined,
        notes: assignmentNotes
      });
      if (res.data.success) {
        setShowAssignModal(false);
        setAssignmentNotes('');
        await fetchReport();
        alert(res.data.message || 'Officer assigned successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const res = await axios.post(`/api/authority/reports/${id}/auto-assign`);
      if (res.data.success) {
        setShowAssignModal(false);
        await fetchReport();
        alert(res.data.message || 'AI successfully assigned the optimal officer!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Auto-assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleVerify = async () => {
    try {
      await axios.post(`/api/authority/reports/${id}/verify`);
      fetchReport();
    } catch (err) {
      alert("Failed to verify report");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl col-span-2"></div>
          <div className="h-64 bg-slate-200 rounded-2xl col-span-1"></div>
        </div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{error || 'Report not found'}</h2>
        <p className="text-slate-500 mb-6">The requested citizen report could not be found or has been moved.</p>
        <button onClick={() => navigate('/authority/reports')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow">
          Back to Citizen Reports
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['VERIFIED', 'RESOLVED', 'COMPLETED'].includes(s)) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (['IN_PROGRESS', 'INVESTIGATION'].includes(s)) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (['ASSIGNED'].includes(s)) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (['DELAYED', 'ESCALATED'].includes(s)) return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  const getSeverityColor = (sev: string) => {
    const s = (sev || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-500 text-white';
    if (s === 'HIGH') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (s === 'MEDIUM') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-28">
      {/* NAVIGATION BACK */}
      <button 
        onClick={() => navigate('/authority/reports')} 
        className="flex items-center text-slate-500 hover:text-slate-900 font-semibold mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Citizen Reports
      </button>

      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b border-slate-200 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900">
              Citizen Report
            </h1>
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-sm font-bold rounded-lg">
              {report.report_id_code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusColor(report.status)}`}>
              Status: {report.status}
            </span>
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getSeverityColor(report.severity || 'MEDIUM')}`}>
              Priority: {report.severity || 'MEDIUM'}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-500"/> SLA: {report.sla_days ? `${report.sla_days * 24}h Target` : '48h Standard'}
            </span>
            {report.department_name && (
              <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" /> {report.department_name}
              </span>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* ASSIGN OFFICER BUTTON */}
          <button 
            onClick={() => setShowAssignModal(true)} 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            {report.officer_id ? 'Reassign Officer' : 'Assign Municipal Officer'}
          </button>

          {/* AI AUTO DISPATCH SHORTCUT */}
          {!report.officer_id && (
            <button 
              onClick={handleAutoAssign}
              disabled={assigning}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              AI Dispatch
            </button>
          )}

          {/* VERIFY COMPLETION */}
          {report.status === 'COMPLETION_SUBMITTED' && (
            <button 
              onClick={handleVerify} 
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Verify Completion
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO COLUMNS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. CITIZEN REQUEST & ISSUE DETAILS */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Citizen Request & Issue Details
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Submitted on {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>

            {/* Issue Title & Description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">{report.title || 'Civic Issue Report'}</h3>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 relative">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Citizen's Reported Problem:
                </span>
                <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {report.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Category
                </p>
                <p className="font-bold text-slate-800 text-sm">{report.category || 'General'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location / Ward
                </p>
                <p className="font-bold text-slate-800 text-sm truncate" title={report.location}>
                  {report.location || 'Location Unspecified'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Filed Date
                </p>
                <p className="font-bold text-slate-800 text-sm">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Source</p>
                <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                  Citizen Portal
                </span>
              </div>
            </div>

            {/* CITIZEN PROFILE SUB-CARD */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                Citizen Contact Information
              </h4>
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                    {(report.citizen_name || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{report.citizen_name || 'Registered Citizen'}</p>
                    <p className="text-xs text-slate-500 font-mono">Citizen ID #{report.citizen_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {report.citizen_email && (
                    <a 
                      href={`mailto:${report.citizen_email}`} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {report.citizen_email}
                    </a>
                  )}
                  {report.citizen_phone && (
                    <a 
                      href={`tel:${report.citizen_phone}`} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {report.citizen_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. AI MUNICIPAL ANALYSIS CARD */}
          <section className="bg-white rounded-2xl p-6 border-2 border-purple-200/80 shadow-md shadow-purple-900/5 relative overflow-hidden">
            <div className="flex flex-wrap justify-between items-center mb-6 border-b border-purple-100 pb-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-purple-900">
                    AI Municipal Intelligence & Triage
                  </h2>
                  <p className="text-xs text-purple-600">Automated classification, department routing, and SLA estimation</p>
                </div>
              </div>

              <button 
                onClick={handleRunAIAnalysis}
                disabled={analyzingAI}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow flex items-center gap-2 text-sm disabled:opacity-60"
              >
                {analyzingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Request...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    {report.ai_analyzed ? 'Re-run AI Analysis' : 'Run AI Analysis'}
                  </>
                )}
              </button>
            </div>

            {aiSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> {aiSuccessMsg}
              </div>
            )}
            
            {!report.ai_analyzed ? (
              <div className="text-center py-8 px-4 bg-purple-50/40 rounded-xl border border-dashed border-purple-200">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-slate-800 mb-1">AI analysis has not been generated for this report.</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Click the button below to parse the citizen's complaint using our NLP model, predict category, priority, department, and SLA target.
                </p>
                <button 
                  onClick={handleRunAIAnalysis}
                  disabled={analyzingAI}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition inline-flex items-center gap-2"
                >
                  {analyzingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Run AI Analysis Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI METRICS GRID */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Detected Category</p>
                    <p className="text-lg font-black text-purple-950">{report.ai_category || report.category}</p>
                    <span className="inline-block mt-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {report.ai_confidence || 94}% Confidence
                    </span>
                  </div>

                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Recommended Department</p>
                    <p className="text-lg font-black text-purple-950">
                      {report.ai_department_name || report.department_name || 'Public Works'}
                    </p>
                    <span className="inline-block mt-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Auto-routed
                    </span>
                  </div>

                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">SLA Target & Severity</p>
                    <p className="text-lg font-black text-purple-950">
                      {report.ai_resolution_hours || 48} Hours
                    </p>
                    <span className="inline-block mt-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      {report.ai_priority || report.severity || 'HIGH'} Priority
                    </span>
                  </div>
                </div>

                {/* SDG ALIGNMENT */}
                {report.ai_sdg_title && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                        SDG {report.ai_sdg_goal || 11}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-emerald-800">Sustainable Development Goal Alignment</p>
                        <p className="font-bold text-emerald-950">{report.ai_sdg_title}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* REASONING BULLETS */}
                <div className="bg-purple-50/80 p-5 rounded-xl border border-purple-200/80">
                  <p className="text-xs font-black text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-600" /> Why AI Recommended This
                  </p>
                  <ul className="text-sm text-purple-950 space-y-1.5 font-medium">
                    {report.ai_reasons && report.ai_reasons.length > 0 ? (
                      report.ai_reasons.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2">• Keyword match in title and complaint description</li>
                        <li className="flex items-start gap-2">• Mapped to appropriate municipal operational division</li>
                        <li className="flex items-start gap-2">• Standard SLA applied based on severity matrix</li>
                      </>
                    )}
                  </ul>

                  {/* APPLY RECOMMENDATION BUTTON */}
                  {report.ai_department_id && report.department_id !== report.ai_department_id && (
                    <div className="mt-4 pt-3 border-t border-purple-200 flex justify-end">
                      <button 
                        onClick={handleApplyAIRecommendation}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow"
                      >
                        Apply AI Department Recommendation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 3. WORK PROGRESS & HISTORY */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Work Progress</h2>
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-blue-600">{report.progress_percentage || report.progress || 0}%</span>
                <span className="text-sm font-bold text-slate-500">Actual Completion</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-3.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${report.progress_percentage || report.progress || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 px-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase mb-3 border-b border-slate-200 pb-2">Progress Updates</h3>
              {(report.progress_percentage || report.progress) > 0 ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 text-xs text-slate-500 font-medium">Recent</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Progress updated to {report.progress_percentage || report.progress}%</p>
                      <p className="text-xs text-slate-500">Field work underway by assigned officer.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No progress updates have been recorded yet.</p>
              )}
            </div>
          </section>

          {/* 4. EVIDENCE GALLERY */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Evidence & Photos</h2>
            {report.evidence_path ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 max-w-sm">
                <img 
                  src={`/${report.evidence_path}`} 
                  alt="Evidence" 
                  className="w-full h-48 object-cover" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="p-3 bg-slate-50 text-xs font-bold text-slate-600">
                  Uploaded by Citizen
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No photo evidence has been uploaded for this report.</p>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* ASSIGNMENTS PANEL */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Assignments & Dispatch
              </h2>
              <button 
                onClick={() => setShowAssignModal(true)} 
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Change
              </button>
            </div>
            
            {/* CURRENT DEPARTMENT */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-blue-500"/> Current Department
              </p>
              {report.department_name ? (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                  <p className="font-bold text-blue-950 text-base">{report.department_name}</p>
                  <p className="text-xs text-blue-700">Department ID #{report.department_id}</p>
                </div>
              ) : report.department_id ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-bold text-slate-800">Department #{report.department_id}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Department not assigned
                </p>
              )}
            </div>

            {/* ASSIGNED OFFICER */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center">
                <Users className="w-4 h-4 mr-1 text-emerald-500"/> Assigned Municipal Officer
              </p>
              {report.officer_name ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                      {report.officer_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950">{report.officer_name}</p>
                      <p className="text-xs text-emerald-700">{report.officer_email || `Officer #${report.officer_id}`}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-center">
                  <p className="text-sm font-bold text-amber-800 mb-2">Officer not assigned</p>
                  <button 
                    onClick={() => setShowAssignModal(true)} 
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow"
                  >
                    Assign Officer Now
                  </button>
                </div>
              )}
            </div>

            {/* ACTION DISPATCH BUTTON */}
            <button 
              onClick={() => setShowAssignModal(true)} 
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {report.officer_id ? 'Change Assigned Officer' : 'Assign to Municipal Officer'}
            </button>
          </section>

          {/* SLA & RISK MONITORING */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">
              Delay & SLA Monitoring
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">SLA Resolution Target</span>
                <span className="text-sm font-bold text-slate-900">
                  {report.sla_days ? `${report.sla_days * 24} Hours` : '48 Hours'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Risk Assessment</span>
                <span className="text-sm font-bold text-rose-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1"/>
                  {report.severity === 'HIGH' || report.delay_status === 'DELAYED' ? 'High Delay Risk' : 'Standard'}
                </span>
              </div>
            </div>
          </section>

          {/* DYNAMIC TIMELINE */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">
              Action Timeline
            </h2>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
              {/* Event 1: Submission */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-bold text-slate-800">Citizen submitted report</p>
                <p className="text-xs text-slate-400">
                  {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>

              {/* Dynamic Events from report_timeline */}
              {report.timeline && report.timeline.length > 0 ? (
                report.timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                    <p className="text-sm font-bold text-slate-800">{event.description}</p>
                    <p className="text-xs text-slate-400">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : 'Recorded'}
                    </p>
                  </div>
                ))
              ) : (
                !report.officer_id && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
                    <p className="text-sm font-bold text-amber-700">Pending Officer Assignment</p>
                    <p className="text-xs text-slate-400">Awaiting department triage</p>
                  </div>
                )
              )}

              {report.officer_name && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                  <p className="text-sm font-bold text-emerald-800">Assigned to Officer {report.officer_name}</p>
                  <p className="text-xs text-slate-400">Ready for inspection & resolution</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Assign Municipal Officer</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dispatch field officer to inspect & resolve report #{report.report_id_code}</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* AI AUTO ASSIGN QUICK ACTION */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-900 uppercase">AI Smart Dispatch</p>
                  <p className="text-xs text-purple-700">Auto-assign based on department and lowest workload</p>
                </div>
              </div>
              <button
                onClick={handleAutoAssign}
                disabled={assigning}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition shrink-0 disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : '⚡ Auto-Assign'}
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* DEPARTMENT SELECTION */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  1. Municipal Department
                </label>
                <select 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* OFFICER SELECTION */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  2. Select Field Officer
                </label>
                <select 
                  value={selectedOfficer} 
                  onChange={(e) => setSelectedOfficer(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Choose an active municipal officer...</option>
                  {officers
                    .filter((o: any) => !selectedDept || String(o.department_id) === String(selectedDept))
                    .map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.full_name} ({o.department_name || 'Municipal Officer'}) • {o.active_task_count || 0} active tasks
                      </option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Officers with fewer active tasks are prioritized for faster SLA completion.
                </p>
              </div>

              {/* SPECIAL INSTRUCTIONS */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  3. Field Instructions / Notes (Optional)
                </label>
                <textarea 
                  value={assignmentNotes} 
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g., Prioritize inspection before 5 PM, citizen requested callback..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex gap-3">
              <button 
                onClick={handleAssignOfficer} 
                disabled={assigning || !selectedOfficer} 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Confirm Assignment
              </button>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="py-3 px-5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
