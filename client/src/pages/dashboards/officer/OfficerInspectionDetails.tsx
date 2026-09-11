import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, Calendar, MapPin, ClipboardCheck, Building, User, Clock, FileText, CheckCircle, Tag, UploadCloud } from 'lucide-react';
import axios from 'axios';

export default function OfficerInspectionDetails() {
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [issues, setIssues] = useState('');
  const [remarks, setRemarks] = useState('');
  const [observedProgress, setObservedProgress] = useState(0);

  const fetchInspection = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/officer/inspections/${id}`, { withCredentials: true });
      if (res.data.success) {
        setInspection(res.data.data);
        setIssues(res.data.data.issues || '');
        setRemarks(res.data.data.remarks || '');
        setObservedProgress(res.data.data.observed_progress || 0);
      } else {
        setError(res.data.message || 'Unable to load inspection details');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to access this inspection.');
      } else {
        setError('Unable to load inspection details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await axios.put(`/api/officer/inspections/${id}/status`, { status: newStatus }, { withCredentials: true });
      if (res.data.success) {
        fetchInspection();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update inspection status.');
    } finally {
      setUpdating(false);
    }
  };

  const saveObservations = async () => {
    setUpdating(true);
    try {
      const res = await axios.post(`/api/officer/inspections/${id}/observations`, { 
        issues, 
        remarks,
        observed_progress: observedProgress
      }, { withCredentials: true });
      if (res.data.success) {
        alert('Observations saved successfully!');
        fetchInspection();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save observations.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let classes = 'bg-gray-100 text-gray-800 border-gray-200';
    if (['SCHEDULED', 'ASSIGNED'].includes(status)) classes = 'bg-blue-100 text-blue-800 border-blue-200';
    if (['IN PROGRESS'].includes(status)) classes = 'bg-purple-100 text-purple-800 border-purple-200';
    if (['PENDING VERIFICATION'].includes(status)) classes = 'bg-orange-100 text-orange-800 border-orange-200';
    if (['COMPLETED', 'RESOLVED'].includes(status)) classes = 'bg-green-100 text-green-800 border-green-200';

    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    let classes = 'text-slate-700 bg-slate-100';
    if (priority === 'Critical') classes = 'text-red-700 bg-red-100';
    if (priority === 'High') classes = 'text-orange-700 bg-orange-100';
    if (priority === 'Medium') classes = 'text-blue-700 bg-blue-100';
    
    return <span className={`px-3 py-1 rounded text-xs font-black tracking-wider uppercase ${classes}`}>{priority || 'NORMAL'}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-teal-600" />
        <p className="font-medium">Loading inspection details...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/officer/inspections" className="inline-flex items-center text-teal-700 font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Inspections
        </Link>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">{error || 'Inspection not found.'}</h3>
          <button 
            onClick={fetchInspection}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 p-6">
      <Link to="/officer/inspections" className="inline-flex items-center text-teal-700 font-semibold mb-2 hover:underline">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Inspections
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex flex-wrap gap-3 items-center mb-4">
                {getStatusBadge(inspection.status)}
                {getPriorityBadge(inspection.priority)}
                <span className="text-slate-500 text-sm font-mono font-bold bg-white px-3 py-1 rounded border border-gray-200">
                  INS-{(inspection.id || 0).toString().padStart(4, '0')}
                </span>
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 mb-4">
                {inspection.project_name ? `Project: ${inspection.project_name}` : 
                 inspection.request_title ? `Request: ${inspection.request_title}` : 
                 'General Inspection'}
              </h1>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {inspection.status === 'SCHEDULED' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('IN PROGRESS')}
                  className="py-2.5 px-5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors shadow-sm"
                >
                  Start Inspection
                </button>
              )}
              {inspection.status === 'IN PROGRESS' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('PENDING VERIFICATION')}
                  className="py-2.5 px-5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Submit Inspection
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Context Section */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Date</p>
                  <p className="font-semibold">{inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'TBD'}</p>
                </div>
              </div>
              <div className="flex items-center text-slate-600">
                <MapPin className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                  <p className="font-semibold line-clamp-1">{inspection.location || 'Not Specified'}</p>
                </div>
              </div>
              {inspection.project_id && (
                <div className="flex items-center text-slate-600 col-span-2">
                  <Building className="w-5 h-5 mr-3 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Related Project</p>
                    <Link to={`/officer/projects/${inspection.project_id}`} className="font-semibold text-teal-700 hover:underline">
                      {inspection.project_name}
                    </Link>
                  </div>
                </div>
              )}
              {inspection.request_id && (
                <div className="flex items-center text-slate-600 col-span-2">
                  <User className="w-5 h-5 mr-3 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Related Request</p>
                    <Link to="/officer/requests" className="font-semibold text-teal-700 hover:underline">
                      {inspection.request_id_code} — {inspection.request_title}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Field Observations Form */}
            {['IN PROGRESS', 'PENDING VERIFICATION', 'COMPLETED'].includes(inspection.status) && (
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <ClipboardCheck className="w-4 h-4 mr-2" /> Field Observations
                  </h3>
                  {inspection.status === 'IN PROGRESS' && (
                    <button 
                      disabled={updating}
                      onClick={saveObservations}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Save Observations'}
                    </button>
                  )}
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Observed Progress (%)</label>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={observedProgress}
                      onChange={(e) => setObservedProgress(Number(e.target.value))}
                      disabled={inspection.status !== 'IN PROGRESS'}
                      className="w-full accent-teal-600 mb-1"
                    />
                    <div className="text-right font-black text-teal-700">{observedProgress}%</div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Issues Found</label>
                    <textarea 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none h-24"
                      placeholder="Describe any issues or deviations found..."
                      value={issues}
                      onChange={(e) => setIssues(e.target.value)}
                      disabled={inspection.status !== 'IN PROGRESS'}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">General Remarks</label>
                    <textarea 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none h-24"
                      placeholder="Overall inspection notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      disabled={inspection.status !== 'IN PROGRESS'}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-2.5 px-4 bg-white border border-gray-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 mr-2" /> Upload Evidence
                </button>
                <button className="w-full py-2.5 px-4 bg-white border border-gray-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <FileText className="w-4 h-4 mr-2" /> View Checklist
                </button>
              </div>
            </div>

            {inspection.instructions && (
              <div className="bg-teal-50 p-5 rounded-xl border border-teal-100">
                <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">Instructions from Admin</h3>
                <p className="text-sm text-teal-900 whitespace-pre-wrap">{inspection.instructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
