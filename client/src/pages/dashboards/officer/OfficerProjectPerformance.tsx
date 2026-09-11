import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Target, AlertTriangle, CheckCircle, Clock, 
  BarChart2, FileText, Search, Filter, HardHat,
  ChevronRight, Activity, Calendar, ShieldCheck, MapPin, Layers, X
} from 'lucide-react';

interface ProjectStats {
  total: number;
  approved?: number;
  completed?: number;
  resolved?: number;
  pending?: number;
  in_progress?: number;
  overdue?: number;
  rejected?: number;
  needs_update?: number;
}

interface ProjectData {
  id: number;
  project_name: string;
  department: string;
  status: string;
  priority: string;
  due_date: string;
  start_date: string;
  reported_progress: number;
  performance_score: number;
  kpi_achievement: number;
  needs_attention: boolean;
  attention_reasons: string[];
  kpis: ProjectStats;
  milestones: ProjectStats;
  inspections: ProjectStats;
  evidence: ProjectStats;
  requests: ProjectStats;
}

export default function OfficerProjectPerformance() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/officer/project-performance');
      setProjects(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href = '/officer/login';
      } else {
        setError('Unable to load project performance.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELAYED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PLANNING': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'NEEDS ATTENTION') return matchesSearch && p.needs_attention;
    if (statusFilter === 'HIGH PRIORITY') return matchesSearch && p.priority.toUpperCase() === 'HIGH';
    if (statusFilter === 'ACTIVE') return matchesSearch && p.status.toUpperCase() === 'IN PROGRESS';
    return matchesSearch && p.status.toUpperCase() === statusFilter;
  });

  const totalAssigned = projects.length;
  const activeProjects = projects.filter(p => p.status.toUpperCase() === 'IN PROGRESS').length;
  const needsAttentionCount = projects.filter(p => p.needs_attention).length;
  const avgPerformance = projects.length > 0 ? 
    Math.round(projects.reduce((sum, p) => sum + p.performance_score, 0) / projects.length) : 0;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 animate-pulse rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-slate-200 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
        <button onClick={fetchPerformanceData} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">PROJECT PERFORMANCE</h1>
        <p className="text-slate-500 mt-2">Monitor the progress, targets and operational performance of your assigned municipal projects.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-4 bg-teal-50 rounded-lg mr-4"><Target className="w-8 h-8 text-teal-600" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Assigned Projects</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalAssigned}</h3>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-4 bg-blue-50 rounded-lg mr-4"><Activity className="w-8 h-8 text-blue-600" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Projects</p>
            <h3 className="text-2xl font-bold text-slate-900">{activeProjects}</h3>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-4 bg-red-50 rounded-lg mr-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Needs Attention</p>
            <h3 className="text-2xl font-bold text-slate-900">{needsAttentionCount}</h3>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-4 bg-purple-50 rounded-lg mr-4"><BarChart2 className="w-8 h-8 text-purple-600" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg Performance</p>
            <h3 className="text-2xl font-bold text-slate-900">{avgPerformance}%</h3>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-5 h-5 text-slate-400 mr-2" />
          {['ALL', 'ACTIVE', 'COMPLETED', 'NEEDS ATTENTION', 'HIGH PRIORITY'].map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === filter ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Projects Assigned</h3>
          <p className="text-slate-500">Project performance information will appear here when projects are assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, idx) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-xl shadow-sm border ${project.needs_attention ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} overflow-hidden flex flex-col`}
            >
              {project.needs_attention && (
                <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center text-red-700 text-sm font-bold">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  NEEDS ATTENTION
                </div>
              )}
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{project.project_name}</h3>
                    <p className="text-sm text-slate-500 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> {project.department || 'General'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Progress</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-slate-800">{project.reported_progress}%</span>
                      <div className="ml-3 flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${project.reported_progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Performance</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-slate-800">{project.performance_score}%</span>
                      <div className="ml-3 flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${project.performance_score}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-4 h-4 mr-1.5" /> Due: {new Date(project.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(project.priority)}`}>
                    {project.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                
                <button 
                  onClick={() => setSelectedProject(project)}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center"
                >
                  View Performance <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedProject(null)}
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                <div>
                  <div className="text-xs font-bold text-teal-600 mb-1 tracking-wider">PROJECT PERFORMANCE DASHBOARD</div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedProject.project_name}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(selectedProject.status)}`}>{selectedProject.status.toUpperCase()}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(selectedProject.priority)}`}>{selectedProject.priority.toUpperCase()} PRIORITY</span>
                  </div>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
                
                {selectedProject.needs_attention && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center text-red-800 font-bold mb-2">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      NEEDS ATTENTION
                    </div>
                    <ul className="list-disc pl-7 text-sm text-red-700 space-y-1">
                      {selectedProject.attention_reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* PROGRESS BLOCK */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-700 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-500" /> PROJECT PROGRESS</h4>
                      <span className="text-2xl font-black text-slate-900">{selectedProject.reported_progress}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedProject.reported_progress}%` }}></div>
                    </div>
                    <div className="flex justify-end">
                      <Link to="/officer/projects" className="text-sm font-semibold text-blue-600 hover:underline">View Project →</Link>
                    </div>
                  </div>

                  {/* KPI BLOCK */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-700 flex items-center"><Target className="w-5 h-5 mr-2 text-teal-500" /> KPI PERFORMANCE</h4>
                      <span className="text-2xl font-black text-slate-900">{selectedProject.kpi_achievement}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="font-bold text-slate-800">{selectedProject.kpis.total}</div>
                        <div className="text-slate-500 text-xs">Total</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-bold text-green-700">{selectedProject.kpis.approved || 0}</div>
                        <div className="text-green-600 text-xs">Approved</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <div className="font-bold text-orange-700">{(selectedProject.kpis.pending || 0) + (selectedProject.kpis.needs_update || 0)}</div>
                        <div className="text-orange-600 text-xs">Pending</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link to="/officer/kpis" className="text-sm font-semibold text-teal-600 hover:underline">View KPIs →</Link>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MILESTONES BLOCK */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-700 flex items-center mb-4"><CheckCircle className="w-5 h-5 mr-2 text-indigo-500" /> MILESTONES</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Total Milestones</span>
                        <span className="font-bold">{selectedProject.milestones.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Completed</span>
                        <span className="font-bold text-green-600">{selectedProject.milestones.completed || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">In Progress</span>
                        <span className="font-bold text-blue-600">{selectedProject.milestones.in_progress || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Overdue</span>
                        <span className="font-bold text-red-600">{selectedProject.milestones.overdue || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* INSPECTIONS BLOCK */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-700 flex items-center mb-4"><HardHat className="w-5 h-5 mr-2 text-amber-500" /> INSPECTIONS</h4>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Total Inspections</span>
                        <span className="font-bold">{selectedProject.inspections.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Completed</span>
                        <span className="font-bold text-green-600">{selectedProject.inspections.completed || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Pending</span>
                        <span className="font-bold text-amber-600">{selectedProject.inspections.pending || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Link to="/officer/inspections" className="text-sm font-semibold text-amber-600 hover:underline">View Inspections →</Link>
                    </div>
                  </div>

                  {/* EVIDENCE BLOCK */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-700 flex items-center mb-4"><ShieldCheck className="w-5 h-5 mr-2 text-purple-500" /> EVIDENCE</h4>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Submitted</span>
                        <span className="font-bold">{selectedProject.evidence.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Approved</span>
                        <span className="font-bold text-green-600">{selectedProject.evidence.approved || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Pending</span>
                        <span className="font-bold text-orange-600">{selectedProject.evidence.pending || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Link to="/officer/evidence" className="text-sm font-semibold text-purple-600 hover:underline">View Evidence →</Link>
                    </div>
                  </div>

                  {/* CITIZEN REQUESTS BLOCK */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-700 flex items-center mb-4"><FileText className="w-5 h-5 mr-2 text-rose-500" /> CITIZEN REQUESTS</h4>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Total Requests</span>
                        <span className="font-bold">{selectedProject.requests.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Resolved</span>
                        <span className="font-bold text-green-600">{selectedProject.requests.resolved || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">In Progress</span>
                        <span className="font-bold text-blue-600">{selectedProject.requests.in_progress || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Link to="/officer/requests" className="text-sm font-semibold text-rose-600 hover:underline">View Service Requests →</Link>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
