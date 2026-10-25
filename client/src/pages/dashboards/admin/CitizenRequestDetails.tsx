import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../../services/adminApi';
import { ArrowLeft, User, MapPin, Calendar, Clock, AlertTriangle, FileText, CheckCircle, MessageSquare, ShieldCheck, Activity, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import CaseMessageChat from '../../../components/common/CaseMessageChat';
import { motion } from 'framer-motion';

export default function CitizenRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  
  // Form State
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [slaDays, setSlaDays] = useState('7');
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('1');
  const [escalationReason, setEscalationReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, offRes, deptRes] = await Promise.all([
        adminApi.getRequestById(id!),
        adminApi.getOfficers(),
        adminApi.getDepartments()
      ]);
      setRequest(reqRes.data);
      setOfficers(offRes.data?.filter((o: any) => o.status === 'ACTIVE') || []);
      setDepartments(deptRes.data || []);
      setNewStatus(reqRes.data.status);
    } catch (err) {
      console.error(err);
      setError('Unable to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleVerify = async () => {
    if (confirm("Are you sure you want to verify this report?")) {
      await adminApi.verifyRequest(id!);
      fetchData();
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason) return;
    try {
      await adminApi.rejectRequest(id!, { reason: rejectReason });
      setIsRejectModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  const handleAssignDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await adminApi.assignDepartment(id!, { department_id: selectedDept, sla_days: parseInt(slaDays) });
      setIsDeptModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to assign department');
    }
  };

  const handleAssignOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficer) return;
    try {
      await adminApi.assignRequest(id!, { officer_id: selectedOfficer });
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to assign officer');
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationReason) return;
    try {
      await adminApi.escalateRequest(id!, { level: parseInt(escalationLevel), reason: escalationReason });
      setIsEscalateModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to escalate request');
    }
  };

  const handleVerifyCompletion = async () => {
    if (confirm("Approve completion and resolve this request?")) {
      try {
        await adminApi.verifyCompletion(id!);
        fetchData();
      } catch (err) {
        alert("Verification failed.");
      }
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote) return;
    try {
      await adminApi.addRequestNote(id!, { note: internalNote });
      setIsNoteModalOpen(false);
      setInternalNote('');
      fetchData();
    } catch (err) {
      alert('Failed to add note');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return <div className="p-6 max-w-5xl mx-auto text-center text-red-600 font-bold">{error || 'Request not found.'}</div>;
  }

  const progress = request.progress_percentage || 0;

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/citizen-requests" className="p-2 bg-white text-slate-500 hover:text-slate-800 hover:shadow-md rounded-full transition-all border border-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{request.request_id_code}</h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                request.status === 'RESOLVED' ? 'bg-green-100 text-green-700 border border-green-200' :
                request.status === 'ESCALATED' ? 'bg-red-100 text-red-700 border border-red-200' :
                request.status === 'DELAYED' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                request.status === 'AWAITING_VERIFICATION' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                request.status === 'VERIFIED' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                request.status === 'DEPARTMENT_ASSIGNED' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Submitted on {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          {request.status === 'SUBMITTED' && (
            <>
              <button onClick={handleVerify} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                <CheckCircle className="w-4 h-4" /> Verify
              </button>
              <button onClick={() => setIsRejectModalOpen(true)} className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-bold rounded-lg border border-red-200 transition-colors">
                Reject
              </button>
            </>
          )}

          {request.status === 'VERIFIED' && (
            <button onClick={() => setIsDeptModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
              Assign Department
            </button>
          )}

          {request.status === 'DEPARTMENT_ASSIGNED' && (
            <button onClick={() => setIsAssignModalOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
              Assign Officer
            </button>
          )}

          {request.status === 'AWAITING_VERIFICATION' && (
            <button onClick={handleVerifyCompletion} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Verify Completion
            </button>
          )}

          <button onClick={() => setIsEscalateModalOpen(true)} className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-bold rounded-lg border border-orange-300 transition-colors flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Escalate
          </button>
          
          <button onClick={() => setIsNoteModalOpen(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg shadow-sm">
            + Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Work Progress Tracker */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> Work Progress
              </h2>
              <span className="text-2xl font-black text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden border border-slate-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-4 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
              ></motion.div>
            </div>
            {request.actual_completion_date && (
              <p className="text-sm text-slate-500 mt-2">Completed on: {new Date(request.actual_completion_date).toLocaleString()}</p>
            )}
          </div>

          {/* AI Intelligence Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-indigo-900" />
            </div>
            <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
              <PlayCircle className="w-4 h-4" /> AI Analysis (Prediction)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              <div className="bg-white/60 p-3 rounded-xl border border-white">
                <div className="text-xs text-indigo-600 font-bold mb-1">Intent</div>
                <div className="font-bold text-slate-800">Issue Report</div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl border border-white">
                <div className="text-xs text-indigo-600 font-bold mb-1">Confidence</div>
                <div className="font-bold text-slate-800">94%</div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl border border-white">
                <div className="text-xs text-indigo-600 font-bold mb-1">Delay Risk</div>
                <div className="font-bold text-red-600">Low</div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl border border-white">
                <div className="text-xs text-indigo-600 font-bold mb-1">Rec Dept</div>
                <div className="font-bold text-slate-800">{request.department_name || 'Public Works'}</div>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">{request.title}</h2>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 mb-4 border border-slate-200">
              {request.category}
            </div>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{request.description}</p>
            
            {request.evidence_path && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Initial Evidence
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <a href={request.evidence_path} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img src={request.evidence_path} alt="Evidence" className="w-full h-full object-cover" onError={(e: any) => e.target.style.display='none'} />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold text-sm">View File</span>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Complete Timeline</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
              {request.timeline?.map((event: any, i: number) => (
                <div key={event.id} className="relative flex items-start gap-4 group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 z-10 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {event.status_change ? <CheckCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm group-hover:border-blue-100 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 text-sm">{event.status_change || 'Internal Note'}</span>
                      <time className="text-xs text-slate-500 font-medium">{new Date(event.created_at).toLocaleString()}</time>
                    </div>
                    {event.remarks && <p className="text-slate-600 text-sm mt-2">{event.remarks}</p>}
                    <p className="text-xs text-slate-400 mt-3 font-medium">By {event.author_name || 'System'} ({event.author_role || 'User'})</p>
                  </div>
                </div>
              ))}
              {!request.timeline?.length && (
                <div className="text-center text-slate-500 italic relative z-10 bg-white p-2">No history available yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Context & Actions */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Context & Meta</h3>
            
            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-700 mb-1">Citizen</div>
                  <div className="text-slate-900 font-bold">{request.citizen_name || 'Anonymous'}</div>
                  <div className="text-slate-500">{request.citizen_email || 'No email'}</div>
                  <div className="text-slate-500">{request.citizen_phone || 'No phone'}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-700 mb-1">Location</div>
                  <div className="text-slate-900 font-bold">{request.location}</div>
                  <div className="text-slate-500">{request.ward}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-700 mb-1">Priority</div>
                  <div className={`font-bold ${request.priority === 'Urgent' ? 'text-red-600' : 'text-slate-900'}`}>
                    {request.priority}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-700 mb-1">SLA & Deadlines</div>
                  {request.expected_completion_date ? (
                    <>
                      <div className="text-slate-900 font-bold">Due: {new Date(request.expected_completion_date).toLocaleDateString()}</div>
                      {request.delay_days > 0 && <div className="text-red-600 font-bold mt-1">Delayed by {request.delay_days} days</div>}
                    </>
                  ) : (
                    <div className="text-slate-500 italic">Not set</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Assignment</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Department</div>
                <div className="font-bold text-slate-800">{request.department_name || 'Unassigned'}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Officer</div>
                <div className="font-bold text-slate-800">{request.officer_name || 'Unassigned'}</div>
              </div>
            </div>
          </div>

          {/* Messaging */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <CaseMessageChat
              entityType="SERVICE_REQUEST"
              entityId={id!}
              caseTitle="Internal / Citizen Chat"
              isClosed={request.status === 'RESOLVED' || request.status === 'CLOSED'}
            />
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Reject Report</h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Rejection Reason (Mandatory) <span className="text-red-500">*</span></label>
                <textarea required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500" 
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}></textarea>
                <p className="text-xs text-slate-500">This will be communicated to the citizen.</p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg">Reject Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Dept Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Assign Department & SLA</h2>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAssignDept} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Department <span className="text-red-500">*</span></label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                  <option value="">-- Select Department --</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Resolution SLA (Days) <span className="text-red-500">*</span></label>
                <input type="number" required min="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={slaDays} onChange={e => setSlaDays(e.target.value)} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Officer Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Assign Officer</h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAssignOfficer} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Select Active Officer <span className="text-red-500">*</span></label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white" 
                  value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)}>
                  <option value="">-- Select Officer --</option>
                  {officers.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.full_name} ({o.department_name || 'General'})</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Escalate Report</h2>
              <button onClick={() => setIsEscalateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleEscalate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Escalation Level <span className="text-red-500">*</span></label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white" 
                  value={escalationLevel} onChange={e => setEscalationLevel(e.target.value)}>
                  <option value="1">Level 1 - Department Head</option>
                  <option value="2">Level 2 - Senior Municipal Authority</option>
                  <option value="3">Level 3 - Higher Authority / Mayor</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Trigger Reason <span className="text-red-500">*</span></label>
                <textarea required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500" 
                  value={escalationReason} onChange={e => setEscalationReason(e.target.value)}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEscalateModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg">Escalate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Add Internal Note</h2>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Note <span className="text-red-500">*</span></label>
                <textarea required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 h-24" 
                  value={internalNote} onChange={e => setInternalNote(e.target.value)}></textarea>
                <p className="text-xs text-slate-500">Internal notes are not visible to citizens.</p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg">Add Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
