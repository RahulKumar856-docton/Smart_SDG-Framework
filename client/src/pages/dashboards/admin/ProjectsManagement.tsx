import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Search, Plus, Eye, Edit, Trash2, UserPlus, Filter } from 'lucide-react';

export default function ProjectsManagement() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ project_name: '', department_id: '', status: 'PLANNED', budget: 0, priority: 'Medium' });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, deptRes] = await Promise.all([
        adminApi.getProjects(),
        adminApi.getDepartments()
      ]);
      setProjects(projRes.data || []);
      setDepartments(deptRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createProject(newProject);
      setIsCreateModalOpen(false);
      // alert('Project created successfully.'); // Toast replacement
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Unable to save project.');
    }
  };

  const handleArchive = async (id: number) => {
    if (confirm('Are you sure you want to archive this project?')) {
      try {
        await adminApi.archiveProject(id);
        fetchData();
      } catch (err) {
        alert('Failed to archive project');
      }
    }
  };

  const filteredProjects = projects.filter((p: any) => 
    (p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.id?.toString().includes(searchTerm)) &&
    (statusFilter ? p.status === statusFilter : true)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects Management</h1>
          <p className="text-slate-500">Create, monitor and manage municipal development projects.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Create Project
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <select 
            className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={fetchData} className="text-red-700 font-semibold hover:underline">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No projects found</h3>
          <p className="text-slate-500 mb-6">No municipal projects match your current filters.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="text-teal-600 font-semibold hover:underline">
            + Create New Project
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Project</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Department</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Progress</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{p.project_name}</div>
                      <div className="text-xs text-slate-500">ID: {p.id} • {p.priority} Priority</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{p.department_name || 'Unassigned'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'ACTIVE' ? 'bg-teal-100 text-teal-700' :
                        p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        p.status === 'DELAYED' ? 'bg-red-100 text-red-700' :
                        p.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 rounded-full" 
                            style={{ width: `${p.reported_progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{p.reported_progress || 0}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Assign Officer">
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleArchive(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">Create New Project</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Project Name <span className="text-red-500">*</span></label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                    value={newProject.project_name} onChange={e => setNewProject({...newProject, project_name: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newProject.department_id} onChange={e => setNewProject({...newProject, department_id: e.target.value})}>
                    <option value="">Select Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                    <option value="PLANNED">PLANNED</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Priority</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newProject.priority} onChange={e => setNewProject({...newProject, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Budget</label>
                  <input type="number" min="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                    value={newProject.budget} onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})} />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
