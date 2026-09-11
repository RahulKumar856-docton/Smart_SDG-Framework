import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FolderKanban, AlertCircle, RefreshCw, Calendar, MapPin, Building, ChevronRight, BarChart } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function OfficerProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/officer/projects', { withCredentials: true });
      if (res.data.success) {
        setProjects(res.data.data);
      } else {
        setError(res.data.message || 'Unable to load projects');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not authorized to view these projects.');
      } else {
        setError('Unable to load your projects.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Overdue') {
      const isOverdue = p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'COMPLETED';
      return matchesSearch && isOverdue;
    }
    return matchesSearch && p.status === statusFilter;
  });

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'High': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Medium': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Low': return 'text-slate-700 bg-slate-100 border-slate-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const renderProgress = (progress: number) => {
    return (
      <div className="w-full flex items-center space-x-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-600 w-8">{progress}%</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MY PROJECTS</h1>
          <p className="text-slate-500">Manage and monitor projects assigned to you.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['All', 'PLANNED', 'IN PROGRESS', 'ON HOLD', 'COMPLETED', 'Overdue'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === f ? 'bg-teal-700 text-white shadow-sm' : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-teal-600" />
          <p className="font-medium">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to load your projects.</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchProjects}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
          <FolderKanban className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Projects Assigned</h3>
          <p className="text-slate-500 mb-6">You currently have no municipal projects assigned to you.</p>
          <div className="flex space-x-4">
            <Link to="/officer/dashboard" className="px-6 py-2 bg-white border border-gray-300 text-slate-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              View Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border ${getPriorityColor(p.priority)}`}>
                    {p.priority} PRIORITY
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-1">{p.project_name}</h3>
                <p className="text-xs text-slate-400 font-mono">PRJ-{p.id.toString().padStart(4, '0')}</p>
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start text-sm">
                    <Building className="w-4 h-4 text-slate-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                      <p className="font-semibold text-slate-700 line-clamp-1">{p.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start text-sm">
                    <MapPin className="w-4 h-4 text-slate-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="font-semibold text-slate-700 line-clamp-1">{p.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center text-sm">
                      <BarChart className="w-4 h-4 text-slate-400 mr-2" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                    </div>
                  </div>
                  {renderProgress(p.progress || 0)}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <div className="flex items-center text-slate-500">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    <span className="font-medium">Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'None'}</span>
                  </div>
                  {p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'COMPLETED' && (
                    <span className="text-red-600 font-bold">Overdue</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-gray-100 mt-auto">
                <Link 
                  to={`/officer/projects/${p.id}`}
                  className="w-full flex items-center justify-center py-2.5 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors"
                >
                  View Project <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
