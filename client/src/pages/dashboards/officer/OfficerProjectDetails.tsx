import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, ArrowLeft, Calendar, MapPin, Building, BarChart, CheckCircle, ShieldAlert, FileText, ClipboardList } from 'lucide-react';
import axios from 'axios';

export default function OfficerProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [newStatus, setNewStatus] = useState('');
  const [updateComment, setUpdateComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProject = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/officer/projects/${id}`, { withCredentials: true });
      if (res.data.success) {
        setProject(res.data.data);
        setNewProgress(res.data.data.progress || 0);
        setNewStatus(res.data.data.status || '');
      } else {
        setError(res.data.message || 'Unable to load project details');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to view this project.');
      } else {
        setError('Unable to load project details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await axios.put(`/api/officer/projects/${id}/progress`, {
        progress: newProgress,
        status: newStatus,
        comment: updateComment
      }, { withCredentials: true });
      
      if (res.data.success) {
        setShowUpdateModal(false);
        setUpdateComment('');
        fetchProject(); // reload data
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ON HOLD': return 'bg-orange-100 text-orange-800';
      case 'PLANNED': return 'bg-slate-100 text-slate-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-teal-600" />
        <p className="font-medium">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/officer/projects" className="inline-flex items-center text-teal-700 font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Projects
        </Link>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">{error || 'Project not found.'}</h3>
          <button 
            onClick={fetchProject}
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
      <Link to="/officer/projects" className="inline-flex items-center text-teal-700 font-semibold mb-2 hover:underline">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Projects
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200">
                {project.priority} PRIORITY
              </span>
              <span className="text-slate-500 text-sm font-mono ml-auto">PRJ-{project.id.toString().padStart(4, '0')}</span>
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-4">{project.project_name}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center text-slate-600">
                <Building className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                  <p className="font-semibold">{project.department || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center text-slate-600">
                <MapPin className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                  <p className="font-semibold">{project.location || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center text-slate-600">
                <Calendar className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</p>
                  <p className="font-semibold">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center text-slate-600">
                <AlertCircle className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected End</p>
                  <p className={`font-semibold ${project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'COMPLETED' ? 'text-red-600' : ''}`}>
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Actions Section */}
        <div className="p-8 border-b border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-teal-600" /> Project Progress
              </h3>
              <span className="text-2xl font-black text-slate-900">{project.progress || 0}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-1000 relative"
                style={{ width: `${project.progress || 0}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => setShowUpdateModal(true)}
              className="w-full py-3 px-4 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors shadow-sm flex justify-center items-center"
            >
              Update Progress
            </button>
            <div className="flex gap-3">
              <button className="flex-1 py-2 px-3 bg-white border border-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm text-center">
                Log Inspection
              </button>
              <button className="flex-1 py-2 px-3 bg-white border border-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm text-center">
                Upload Evidence
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Description</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{project.description || 'No description provided.'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
                <span>Recent Inspections</span>
                <span className="text-xs font-semibold text-teal-600 cursor-pointer">View All</span>
              </h3>
              {project.inspections && project.inspections.length > 0 ? (
                <div className="space-y-3">
                  {project.inspections.slice(0, 3).map((ins: any) => (
                    <div key={ins.id} className="p-4 bg-slate-50 border border-gray-100 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">Inspection on {new Date(ins.inspection_date).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-500">Status: {ins.status}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No inspections recorded yet.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
                <span>Related Citizen Requests</span>
              </h3>
              {project.requests && project.requests.length > 0 ? (
                <div className="space-y-3">
                  {project.requests.slice(0, 3).map((req: any) => (
                    <div key={req.id} className="p-4 bg-slate-50 border border-gray-100 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">{req.title}</p>
                        <p className="text-sm text-slate-500">{req.request_id_code} • {req.status}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${req.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                        {req.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No related citizen requests.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Project Overview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Budget</p>
                  <p className="font-bold text-slate-800">${project.budget?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Risk Level</p>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    project.risk_level === 'High' || project.risk_level === 'Critical' ? 'bg-red-100 text-red-700' : 
                    project.risk_level === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {project.risk_level || 'Low'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">KPIs Tracking</p>
                  <p className="font-bold text-slate-800">{project.kpis?.length || 0} Metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Progress Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-slate-900">Update Project Progress</h2>
            </div>
            
            <form onSubmit={handleUpdateProgress} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Progress Percentage (%)</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={newProgress}
                    onChange={(e) => setNewProgress(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="font-black text-xl w-12 text-teal-700">{newProgress}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Project Status</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="ON HOLD">ON HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Update Comment (Optional)</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none h-24"
                  placeholder="Describe what was accomplished..."
                  value={updateComment}
                  onChange={(e) => setUpdateComment(e.target.value)}
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-slate-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="flex-1 py-3 px-4 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
