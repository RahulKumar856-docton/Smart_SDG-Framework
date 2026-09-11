import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, MapPin, Clock, ShieldAlert, 
  CheckCircle, MessageSquare, RotateCcw, Star, Loader2, Image as ImageIcon,
  CheckSquare, XCircle, AlertTriangle
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, text: '' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await citizenApi.getRequestDetails(id!);
      if (res.success) {
        setData(res.data);
      } else {
        navigate('/citizen/requests');
      }
    } catch (err) {
      console.error(err);
      navigate('/citizen/requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await citizenApi.reopenRequest(id!, reopenReason);
      if (res.success) {
        setMessage({ type: 'success', text: 'Request successfully reopened.' });
        setShowReopen(false);
        fetchDetails();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to reopen request.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reopen request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [showVerifyAction, setShowVerifyAction] = useState<'RESOLVED' | 'REWORK' | 'REOPENED' | null>(null);

  const handleVerify = async (status: 'RESOLVED' | 'REWORK' | 'REOPENED') => {
    setActionLoading(true);
    try {
      // Use standard fetch if citizenApi.verifyRequest isn't defined yet, or add it to citizenApi
      // (assuming I'll add verifyRequest to citizenApi.ts)
      const res = await citizenApi.verifyRequest(id!, status, verifyFeedback);
      if (res.success) {
        setMessage({ type: 'success', text: `Successfully marked as ${status}.` });
        setShowVerifyAction(null);
        fetchDetails();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to verify request.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to verify request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.rating === 0) {
      setMessage({ type: 'error', text: 'Please provide a star rating.' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await citizenApi.submitFeedback(id!, { rating: feedback.rating, feedback: feedback.text });
      if (res.success) {
        setMessage({ type: 'success', text: 'Thank you for your feedback!' });
        setShowFeedback(false);
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to submit feedback.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit feedback.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading request details...</p>
      </div>
    );
  }

  if (!data || !data.request) return null;

  const req = data.request;
  const timeline = data.timeline || [];
  
  const statusColors: any = {
    'SUBMITTED': 'bg-orange-100 text-orange-700',
    'UNDER_REVIEW': 'bg-yellow-100 text-yellow-700',
    'ASSIGNED': 'bg-blue-100 text-blue-700',
    'IN_PROGRESS': 'bg-indigo-100 text-indigo-700',
    'PENDING_VERIFICATION': 'bg-purple-100 text-purple-700',
    'REWORK': 'bg-yellow-100 text-yellow-800',
    'RESOLVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
    'REOPENED': 'bg-purple-100 text-purple-700'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/citizen/requests" className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200 text-sm">
                {req.request_id_code}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border border-opacity-20 ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                {req.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{req.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link 
            to={`/citizen/messages?conv=SR-${req.id}`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm text-sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Message Staff
          </Link>

          {req.status === 'RESOLVED' && (
            <>
              <button 
                onClick={() => { setShowReopen(true); setShowFeedback(false); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm text-sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reopen
              </button>
              <button 
                onClick={() => { setShowFeedback(true); setShowReopen(false); }}
                className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center shadow-sm text-sm"
              >
                <Star className="w-4 h-4 mr-2" /> Feedback
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5" /> : <ShieldAlert className="w-5 h-5 mr-3 mt-0.5" />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* Forms (Reopen & Feedback) */}
      {showReopen && (
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center">
            <RotateCcw className="w-5 h-5 mr-2" /> Reopen this Request
          </h3>
          <p className="text-sm text-purple-700 mb-4">If the issue has not been fully resolved, you can reopen it for further investigation.</p>
          <form onSubmit={handleReopen}>
            <textarea 
              required rows={3} placeholder="Please explain why the issue is not resolved..."
              value={reopenReason} onChange={e => setReopenReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowReopen(false)} className="px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Submit Reopen Request
              </button>
            </div>
          </form>
        </div>
      )}

      {showFeedback && (
        <div className="bg-teal-50 p-6 rounded-xl border border-teal-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center">
            <Star className="w-5 h-5 mr-2" /> Rate the Resolution
          </h3>
          <p className="text-sm text-teal-700 mb-4">Your feedback helps us improve municipal services.</p>
          <form onSubmit={handleFeedbackSubmit}>
            <div className="flex items-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} type="button" 
                  onClick={() => setFeedback({...feedback, rating: star})}
                  className={`p-1 rounded-full transition-colors ${feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            <textarea 
              rows={2} placeholder="Optional comments..."
              value={feedback.text} onChange={e => setFeedback({...feedback, text: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowFeedback(false)} className="px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Submit Feedback
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h2 className="font-bold text-gray-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" /> Issue Description
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{req.description}</p>
              
              {req.evidence_path && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2" /> Initial Evidence
                  </h3>
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <p className="text-xs text-gray-400 text-center px-2">Image attached</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {req.status === 'PENDING_VERIFICATION' && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-purple-900 flex items-center mb-2">
                <CheckSquare className="w-5 h-5 mr-2" /> Verification Required
              </h2>
              <p className="text-sm text-purple-700 mb-6">
                The assigned officer has marked this service request as completed. Please review their updates and evidence in the timeline below, then verify if the work is acceptable.
              </p>
              
              {!showVerifyAction ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setShowVerifyAction('RESOLVED')} className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center">
                    <CheckCircle className="w-5 h-5 mr-2" /> Yes, Completed
                  </button>
                  <button onClick={() => setShowVerifyAction('REWORK')} className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" /> Partially Done
                  </button>
                  <button onClick={() => setShowVerifyAction('REOPENED')} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center">
                    <XCircle className="w-5 h-5 mr-2" /> Not Completed
                  </button>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-lg border border-purple-100">
                  <h4 className="font-bold text-gray-900 mb-2">
                    {showVerifyAction === 'RESOLVED' ? 'Confirm Completion' : showVerifyAction === 'REWORK' ? 'Request Rework' : 'Reopen Request'}
                  </h4>
                  <textarea 
                    rows={3} placeholder="Please provide any comments or feedback for the officer..."
                    value={verifyFeedback} onChange={e => setVerifyFeedback(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm mb-4 bg-gray-50 focus:bg-white"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowVerifyAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={() => handleVerify(showVerifyAction)} disabled={actionLoading} className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center">
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h2 className="font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-gray-500" /> Request Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-gray-100 ml-3 md:ml-4 space-y-8 pb-4">
                {timeline.map((event: any, index: number) => {
                  const isLatest = index === timeline.length - 1;
                  const isSubmit = event.status_change === 'SUBMITTED';
                  const isResolve = event.status_change === 'RESOLVED';
                  
                  return (
                    <div key={event.id} className="relative pl-6 md:pl-8">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        isResolve ? 'bg-green-500' : isSubmit ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-baseline mb-1">
                        <span className={`text-sm font-bold mr-2 ${isResolve ? 'text-green-700' : isSubmit ? 'text-orange-700' : 'text-blue-700'}`}>
                          {event.status_change.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {event.remarks && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {event.remarks}
                        </div>
                      )}
                      
                      {event.evidence_path && (
                        <div className="mt-3 inline-block">
                          <div className="flex items-center text-xs font-semibold text-teal-700 mb-1">
                            <ImageIcon className="w-3 h-3 mr-1" /> Attached Evidence
                          </div>
                          {/* If actual file server is up, use <img src={`http://localhost:5000/${event.evidence_path}`} /> */}
                          <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center relative group">
                             {event.evidence_path.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                               <img src={`http://localhost:5000/${event.evidence_path}`} alt="Evidence" className="w-full h-full object-cover" />
                             ) : (
                               <p className="text-xs text-gray-500 text-center px-2">Document attached: {event.evidence_path.split('/').pop()}</p>
                             )}
                          </div>
                        </div>
                      )}
                      
                      {event.author_name && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                          <span className="font-medium mr-1">{event.author_name}</span> 
                          ({event.role})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Meta */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-semibold text-gray-900 flex items-center">
                  {req.category}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Location</p>
                <div className="flex items-start mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-800">{req.location}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Submitted</p>
                <div className="flex items-start mt-1">
                  <Clock className="w-4 h-4 text-gray-400 mr-2 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-800">{new Date(req.created_at).toLocaleString()}</p>
                </div>
              </div>

              {req.department_name && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Responsible Dept</p>
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-block mt-1">
                    {req.department_name}
                  </p>
                </div>
              )}

              {req.assigned_officer_name && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assigned Officer</p>
                  <div className="mt-1 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mr-2 text-xs">
                      {req.assigned_officer_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{req.assigned_officer_name}</p>
                      {req.assigned_officer_phone && <p className="text-xs text-gray-500">{req.assigned_officer_phone}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
