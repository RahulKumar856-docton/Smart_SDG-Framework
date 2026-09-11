import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../../services/adminApi';
import { ArrowLeft, User, MapPin, Calendar, Clock, AlertTriangle, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import CaseMessageChat from '../../../components/common/CaseMessageChat';

export default function CitizenRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  // Form State
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [internalNote, setInternalNote] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, offRes] = await Promise.all([
        adminApi.getRequestById(id!),
        adminApi.getOfficers()
      ]);
      setRequest(reqRes.data);
      // Only approved/active officers can be assigned
      setOfficers(offRes.data?.filter((o: any) => o.status === 'ACTIVE') || []);
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

  const handleAssign = async (e: React.FormEvent) => {
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

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock file upload: if a file is selected, pretend we uploaded it and got a path back
      let evidence_path = undefined;
      if (newStatus === 'PENDING_VERIFICATION' && evidenceFile) {
        evidence_path = `/uploads/mock_evidence_${Date.now()}.png`;
      }
      await adminApi.updateRequestStatus(id!, { status: newStatus, remarks: statusRemarks, evidence_path });
      setIsStatusModalOpen(false);
      setStatusRemarks('');
      setEvidenceFile(null);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
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
    return <div className="p-6 max-w-5xl mx-auto animate-pulse flex flex-col gap-6">
      <div className="h-10 w-48 bg-slate-200 rounded"></div>
      <div className="h-64 bg-slate-200 rounded-xl"></div>
      <div className="h-48 bg-slate-200 rounded-xl"></div>
    </div>;
  }

  if (error || !request) {
    return <div className="p-6 max-w-5xl mx-auto text-center text-red-600 font-bold">{error || 'Request not found.'}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-4">
        <Link to="/admin/citizen-requests" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{request.request_id_code}</h1>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
              request.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
              request.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
              request.status === 'PENDING_VERIFICATION' ? 'bg-purple-100 text-purple-700' :
              request.status === 'REWORK' ? 'bg-yellow-100 text-yellow-800' :
              request.status === 'SUBMITTED' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Submitted on {new Date(request.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{request.title}</h2>
            <p className="text-slate-600 whitespace-pre-wrap">{request.description}</p>
            
            {request.evidence_path && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Attached Evidence
                </h3>
                <a href={request.evidence_path} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-blue-600 hover:underline">
                  View Uploaded File
                </a>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Timeline & History</h2>
              <button onClick={() => setIsNoteModalOpen(true)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                + Add Note
              </button>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {request.timeline?.map((event: any, i: number) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    {event.status_change ? <CheckCircle className="w-4 h-4 text-slate-600" /> : <MessageSquare className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 text-sm">{event.status_change || 'Internal Note'}</span>
                      <time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</time>
                    </div>
                    {event.remarks && <p className="text-slate-600 text-sm mt-2">{event.remarks}</p>}
                    <p className="text-xs text-slate-400 mt-2 font-medium">By {event.author_name || 'System'}</p>
                  </div>
                </div>
              ))}
              {!request.timeline?.length && (
                <div className="text-center text-slate-500 italic relative z-10 bg-white p-2">No history available yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Request Context</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-700">Citizen Info</div>
                  <div className="text-slate-900 font-bold">{request.citizen_name || 'Anonymous'}</div>
                  <div className="text-slate-500">{request.citizen_email || 'No email'}</div>
                  <div className="text-slate-500">{request.citizen_phone || 'No phone'}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-700">Location</div>
                  <div className="text-slate-900 font-bold">{request.location}</div>
                  <div className="text-slate-500">{request.ward}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-700">Priority</div>
                  <div className={`font-bold ${request.priority === 'Urgent' ? 'text-red-600' : 'text-slate-900'}`}>
                    {request.priority}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Assignment & Actions</h3>
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1">Current Assignee</div>
              <div className="font-bold text-slate-800">{request.officer_name || 'Unassigned'}</div>
            </div>

            <button onClick={() => setIsAssignModalOpen(true)} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
              Assign Officer
            </button>
            <button onClick={() => setIsStatusModalOpen(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
              Update Status
            </button>
          </div>

          {/* Direct Citizen Messaging */}
          <CaseMessageChat
            entityType="SERVICE_REQUEST"
            entityId={id!}
            caseTitle={request.title}
            isClosed={request.status === 'RESOLVED' || request.status === 'CLOSED'}
          />
        </div>
      </div>

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Assign Officer</h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
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

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Update Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleStatusChange} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">New Status <span className="text-red-500">*</span></label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                  value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING_VERIFICATION">Pending Verification (Needs Citizen Review)</option>
                  <option value="REWORK">Rework</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              
              {newStatus === 'PENDING_VERIFICATION' && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Completion Evidence (Required) <span className="text-red-500">*</span></label>
                  <input type="file" accept="image/*,application/pdf" required
                    onChange={e => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                  <p className="text-xs text-slate-500">Upload a photo or document to prove the work is completed.</p>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Remarks / Reason</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={statusRemarks} onChange={e => setStatusRemarks(e.target.value)}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Update Status</button>
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
