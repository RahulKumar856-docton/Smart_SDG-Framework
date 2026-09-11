import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../../services/adminApi';
import { ArrowLeft, MapPin, Calendar, CheckCircle, XCircle, Clock, FileText, AlertTriangle, User } from 'lucide-react';

export default function FieldInspectionDetails() {
  const { id } = useParams();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInspectionById(id!);
      setInspection(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load inspection details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleVerify = async () => {
    if (!window.confirm("Are you sure you want to verify this inspection?")) return;
    try {
      await adminApi.verifyInspection(id!);
      fetchData();
    } catch (err) {
      alert('Failed to verify inspection');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason) return;
    try {
      await adminApi.rejectInspection(id!, { reason: rejectReason });
      setIsRejectModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to reject inspection');
    }
  };

  if (loading) {
    return <div className="p-6 max-w-5xl mx-auto animate-pulse flex flex-col gap-6">
      <div className="h-10 w-48 bg-slate-200 rounded"></div>
      <div className="h-64 bg-slate-200 rounded-xl"></div>
    </div>;
  }

  if (error || !inspection) {
    return <div className="p-6 max-w-5xl mx-auto text-center text-red-600 font-bold">{error || 'Inspection not found.'}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-4">
        <Link to="/admin/inspections" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">INSP-{inspection.id.toString().padStart(4, '0')}</h1>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
              inspection.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
              inspection.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              (inspection.status === 'SUBMITTED' || inspection.status === 'PENDING_VERIFICATION') ? 'bg-amber-100 text-amber-700' :
              inspection.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {inspection.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">{inspection.inspection_type || 'Field Inspection'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800">Inspection Summary</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Project</div>
                <div className="font-medium text-slate-900">{inspection.project_name || 'No Associated Project'}</div>
                {inspection.project_ward && <div className="text-xs text-slate-500">{inspection.project_ward}</div>}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Citizen Request</div>
                <div className="font-medium text-slate-900">{inspection.request_title || 'No Associated Request'}</div>
                {inspection.request_id_code && <div className="text-xs text-blue-600">{inspection.request_id_code}</div>}
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Location</div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> {inspection.location}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="text-xs text-slate-500 font-bold uppercase mb-2">Admin Instructions</div>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-lg italic">
                {inspection.instructions || 'No specific instructions provided.'}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="text-xs text-slate-500 font-bold uppercase mb-2">Officer Findings / Remarks</div>
              <p className="text-slate-700 bg-blue-50 p-4 rounded-lg">
                {inspection.remarks || 'No remarks submitted by officer yet.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Evidence</h2>
            
            {inspection.evidence?.length > 0 ? (
              <div className="space-y-3">
                {inspection.evidence.map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded" />
                      <div>
                        <div className="font-bold text-sm text-slate-800">Evidence File</div>
                        <div className="text-xs text-slate-500">{new Date(ev.uploaded_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <a href={ev.file_path} target="_blank" rel="noreferrer" className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200">
                      View
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No evidence files uploaded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Assignment Details</h3>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <div className="font-medium text-slate-900">{inspection.officer_name || 'Unassigned'}</div>
                <div className="text-xs text-slate-500">{inspection.officer_email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-slate-500">Scheduled Date</div>
                <div className="font-medium text-slate-900">
                  {inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-slate-500">Priority</div>
                <div className={`font-bold ${inspection.priority === 'Urgent' ? 'text-red-600' : 'text-slate-900'}`}>
                  {inspection.priority || 'Normal'}
                </div>
              </div>
            </div>
          </div>

          {(inspection.status === 'SUBMITTED' || inspection.status === 'PENDING_VERIFICATION') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Admin Review</h3>
              <p className="text-sm text-slate-500 mb-4">
                This inspection has been submitted by the officer and is pending your verification.
              </p>
              <button onClick={handleVerify} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" /> Verify Inspection
              </button>
              <button onClick={() => setIsRejectModalOpen(true)} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors flex items-center justify-center">
                <XCircle className="w-5 h-5 mr-2" /> Reject
              </button>
            </div>
          )}

          {inspection.status === 'REJECTED' && (
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 space-y-2">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <AlertTriangle className="w-5 h-5" /> Inspection Rejected
              </div>
              <div className="text-sm text-red-600 mt-2">
                <strong>Reason:</strong> {inspection.rejection_reason}
              </div>
            </div>
          )}
          
          {inspection.status === 'VERIFIED' && (
            <div className="bg-green-50 p-6 rounded-xl border border-green-100 space-y-2">
              <div className="flex items-center gap-2 text-green-700 font-bold">
                <CheckCircle className="w-5 h-5" /> Inspection Verified
              </div>
              <div className="text-sm text-green-600 mt-2">
                This inspection has been successfully reviewed and closed.
              </div>
            </div>
          )}
        </div>
      </div>

      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" /> Reject Inspection
              </h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea required placeholder="e.g. Insufficient evidence, location mismatch..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 h-24" 
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg">Reject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
