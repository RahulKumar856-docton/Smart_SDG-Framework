import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, Calendar, MapPin, ClipboardList, CheckCircle, ArrowRight, AlertTriangle, Plus } from 'lucide-react';

export default function FieldInspections() {
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data for create modal
  const [officers, setOfficers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    request_id: '',
    officer_id: '',
    scheduled_date: '',
    location: '',
    priority: 'Medium',
    inspection_type: 'Project Progress',
    instructions: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, offRes, projRes, reqRes] = await Promise.all([
        adminApi.getInspections(),
        adminApi.getOfficers(),
        adminApi.getProjects(),
        adminApi.getRequests()
      ]);
      setInspections(inspRes.data || []);
      setStats(inspRes.stats || null);
      setOfficers(offRes.data?.filter((o: any) => o.status === 'ACTIVE') || []);
      setProjects(projRes.data || []);
      setRequests(reqRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load field inspections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.scheduleInspection(formData);
      setIsModalOpen(false);
      setFormData({
        project_id: '', request_id: '', officer_id: '', scheduled_date: '',
        location: '', priority: 'Medium', inspection_type: 'Project Progress', instructions: ''
      });
      fetchData();
    } catch (err) {
      alert('Failed to schedule inspection.');
    }
  };

  const filteredInspections = inspections.filter((i: any) => {
    const searchStr = `${i.id} ${i.project_name || ''} ${i.officer_name || ''} ${i.location || ''}`.toLowerCase();
    const matchSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? i.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Inspections</h1>
          <p className="text-slate-500">Schedule, assign, monitor and verify municipal field inspections.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg flex items-center text-sm font-medium text-slate-700 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center text-sm font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Schedule Inspection
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between shadow-sm">
          {error}
          <button onClick={fetchData} className="bg-red-100 px-3 py-1 rounded text-sm font-bold">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>)}
          </div>
          <div className="h-96 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Inspections</div>
                <div className="text-2xl font-black text-slate-800">{stats.total}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Scheduled</div>
                <div className="text-2xl font-black text-blue-600">{stats.scheduled}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">In Progress</div>
                <div className="text-2xl font-black text-purple-600">{stats.in_progress}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Pending Verify</div>
                <div className="text-2xl font-black text-amber-500">{stats.submitted}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Verified</div>
                <div className="text-2xl font-black text-green-600">{stats.verified}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Rejected</div>
                <div className="text-2xl font-black text-red-600">{stats.rejected}</div>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search inspections by ID, Project, Officer, Location..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="REINSPECTION_REQUIRED">Reinspection Required</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Inspection ID</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Project / Target</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Officer</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Schedule</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInspections.length > 0 ? (
                    filteredInspections.map((i: any) => (
                      <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">INSP-{i.id.toString().padStart(4, '0')}</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block ${
                            i.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                            i.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{i.priority || 'Normal'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{i.project_name || i.request_title || 'General Area'}</div>
                          <div className="text-xs text-slate-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" /> {i.location || 'Location missing'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{i.officer_name || 'Unassigned'}</div>
                          <div className="text-xs text-slate-500">{i.department_name || 'No Dept'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700 font-medium">{i.scheduled_date ? new Date(i.scheduled_date).toLocaleDateString() : 'TBD'}</div>
                          <div className="text-xs text-slate-500">{i.inspection_type || 'General'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            i.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                            i.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            (i.status === 'SUBMITTED' || i.status === 'PENDING_VERIFICATION') ? 'bg-amber-100 text-amber-700' :
                            i.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {i.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/admin/inspections/${i.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            View <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                          <ClipboardList className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No field inspections found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-4">
                          Schedule a new field inspection to monitor municipal progress.
                        </p>
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                          Schedule Inspection
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Schedule Inspection
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSchedule} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Select Project (Optional)</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                    <option value="">-- No Project --</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Select Request (Optional)</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.request_id} onChange={e => setFormData({...formData, request_id: e.target.value})}>
                    <option value="">-- No Citizen Request --</option>
                    {requests.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Assign Officer <span className="text-red-500">*</span></label>
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.officer_id} onChange={e => setFormData({...formData, officer_id: e.target.value})}>
                    <option value="">-- Select Active Officer --</option>
                    {officers.map((o: any) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Scheduled Date <span className="text-red-500">*</span></label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Location <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="e.g. 123 Main Street, Ward 4" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Inspection Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.inspection_type} onChange={e => setFormData({...formData, inspection_type: e.target.value})}>
                    <option value="Project Progress">Project Progress</option>
                    <option value="Citizen Complaint">Citizen Complaint</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Verification">Verification</option>
                    <option value="Reinspection">Reinspection</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Priority</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Instructions / Notes</label>
                <textarea placeholder="Specific things to check during the field visit..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})}></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Schedule Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
