import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Brain, MapPin, Clock, ShieldCheck, Activity, Users, AlertTriangle, FileText, Send, X, CheckCircle } from 'lucide-react';

export default function AuthorityReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/authority/reports/${id}`);
      if (res.data.success) {
        setReport(res.data.data);
      } else {
        setError('Report not found');
      }
    } catch (err: any) {
      setError('Unable to load this report.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDepartment = async () => {
    if (!selectedDept) return;
    try {
      await axios.post(`/api/authority/reports/${id}/assign-department`, { department_id: selectedDept });
      setShowAssignModal(false);
      fetchReport();
    } catch (err) {
      alert("Failed to assign department");
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
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl col-span-2"></div>
          <div className="h-64 bg-slate-200 rounded-xl col-span-1"></div>
        </div>
        <div className="h-48 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{error || 'Report not found'}</h2>
        <button onClick={() => navigate('/authority/reports')} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-black">
          Back to Citizen Reports
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (['VERIFIED', 'RESOLVED'].includes(status)) return 'bg-emerald-100 text-emerald-800';
    if (['INVESTIGATION', 'IN_PROGRESS'].includes(status)) return 'bg-blue-100 text-blue-800';
    if (['DELAYED', 'ESCALATED'].includes(status)) return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      {/* HEADER */}
      <button onClick={() => navigate('/authority/reports')} className="flex items-center text-slate-500 hover:text-slate-800 font-semibold mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Citizen Reports
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center">
            Citizen Report
            <span className="ml-4 text-xl font-mono text-slate-500 font-normal">{report.report_id_code}</span>
          </h1>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${getStatusColor(report.status)}`}>
              Status: {report.status}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-orange-100 text-orange-800">
              Priority: {report.severity || 'MEDIUM'}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-rose-100 text-rose-800 flex items-center">
              <Clock className="w-3 h-3 mr-1"/> SLA: At Risk
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {report.status === 'SUBMITTED' && (
            <button onClick={() => setShowAssignModal(true)} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full md:w-auto">
              Assign Department
            </button>
          )}
          {report.status === 'COMPLETION_SUBMITTED' && (
            <button onClick={handleVerify} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full md:w-auto flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Verify Completion
            </button>
          )}
          <button className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors shadow-sm w-full md:w-auto">
            Escalate
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ISSUE OVERVIEW */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Issue Overview</h2>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{report.title || 'Untitled Issue'}</h3>
            <p className="text-slate-700 mb-6 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{report.description || 'Description not provided.'}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <p className="font-semibold text-slate-800">{report.category}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created Date</p>
                <p className="font-semibold text-slate-800">{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                <p className="font-semibold text-slate-800 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                  {report.location || 'Location information is unavailable.'}
                </p>
              </div>
            </div>
          </section>

          {/* AI ANALYSIS CARD */}
          <section className="bg-white rounded-2xl p-6 border border-purple-200 shadow-sm shadow-purple-900/5">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-purple-600 uppercase tracking-widest flex items-center">
                <Brain className="w-5 h-5 mr-2" /> AI Municipal Analysis
              </h2>
            </div>
            
            {!report.ai_analyzed ? (
              <div className="text-center py-6">
                <p className="text-slate-500 mb-4">AI analysis has not been generated for this report.</p>
                <button className="px-6 py-2 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200">Run AI Analysis</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Detected Category</p>
                    <p className="font-semibold text-slate-800">{report.ai_category || report.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Recommended Department</p>
                    <p className="font-semibold text-slate-800">Sanitation & Drainage</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Confidence Score</p>
                    <p className="font-semibold text-emerald-600">94% High Confidence</p>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-800 uppercase mb-2">Why AI Recommended This</p>
                  <ul className="text-sm text-purple-900 space-y-2">
                    <li>• "Drainage" detected in description</li>
                    <li>• Previous similar reports nearby</li>
                    <li>• Keyword match: public road</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* PROGRESS SECTION */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Work Progress</h2>
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-blue-600">{report.progress || 0}%</span>
                <span className="text-sm font-bold text-slate-500">Actual Progress</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                <div className="bg-blue-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${report.progress || 0}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 px-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase mb-3 border-b border-slate-200 pb-2">Progress History</h3>
              {report.progress > 0 ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 text-xs text-slate-500 font-medium">Today<br/>09:20</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Progress updated to {report.progress}%</p>
                      <p className="text-xs text-slate-500">Field work underway.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No progress updates have been recorded yet.</p>
              )}
            </div>
          </section>

          {/* EVIDENCE GALLERY */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Evidence</h2>
            <p className="text-sm text-slate-500 italic">No evidence has been uploaded.</p>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* ASSIGNMENTS */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Assignments</h2>
            
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-blue-500"/> Current Department</p>
              {report.department_id ? (
                <p className="font-bold text-slate-800">Department #{report.department_id}</p>
              ) : (
                <p className="text-sm text-slate-500 italic">Department not assigned</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center"><Users className="w-4 h-4 mr-1 text-emerald-500"/> Assigned Officer</p>
              {report.officer_id ? (
                <p className="font-bold text-slate-800">Officer #{report.officer_id}</p>
              ) : (
                <p className="text-sm text-slate-500 italic">Officer not assigned</p>
              )}
            </div>
          </section>

          {/* DELAY / SLA PANEL */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Delay & SLA Monitoring</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">SLA Target</span>
                <span className="text-sm font-bold text-slate-900">48 Hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Risk Level</span>
                <span className="text-sm font-bold text-rose-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> High Delay Risk</span>
              </div>
            </div>
            <button className="w-full mt-6 py-2 bg-rose-50 text-rose-700 font-bold text-sm border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">
              Request Explanation
            </button>
          </section>

          {/* TIMELINE */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Timeline</h2>
            <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-bold text-slate-800">Citizen submitted report</p>
                <p className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                <p className="text-sm font-bold text-slate-800">Pending Assignment</p>
              </div>
            </div>
          </section>

          {/* CITIZEN FEEDBACK */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Citizen Feedback</h2>
            <p className="text-sm text-slate-500 italic">No citizen feedback has been submitted.</p>
          </section>
        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Assign Department</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Department</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose a department...</option>
                <option value="1">Sanitation & Solid Waste</option>
                <option value="2">Roads & Infrastructure</option>
                <option value="3">Water Supply</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAssignDepartment} disabled={!selectedDept} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">Assign Department</button>
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
