import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Search, Plus, Target, Activity, CheckCircle, AlertTriangle, Info, TrendingUp, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceKPIs() {
  const [kpis, setKpis] = useState([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<any>(null);

  const [newKpi, setNewKpi] = useState({
    name: '', code: '', description: '', category: 'Project Delivery',
    department_id: '', project_id: '', unit: 'Percentage',
    baseline_value: 0, target_value: 100, direction: 'Higher is Better',
    frequency: 'Monthly', start_date: '', target_date: ''
  });

  const [newMeasurement, setNewMeasurement] = useState({
    value: 0, measurement_date: new Date().toISOString().split('T')[0], notes: ''
  });

  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, overviewRes, projRes, deptRes] = await Promise.all([
        adminApi.getKpis(),
        adminApi.getKpiOverview(),
        adminApi.getProjects(),
        adminApi.getDepartments()
      ]);
      setKpis(kpiRes.data || []);
      setOverview(overviewRes.data);
      setProjects(projRes.data || []);
      setDepartments(deptRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load performance data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createKpi(newKpi);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Unable to save KPI.');
    }
  };

  const handleUpdateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpi) return;
    try {
      await adminApi.addKpiMeasurement(selectedKpi.id, newMeasurement);
      setIsUpdateModalOpen(false);
      setSelectedKpi(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Unable to save measurement.');
    }
  };

  const handleArchive = async (id: number) => {
    if (confirm('Are you sure you want to archive this KPI?')) {
      try {
        await adminApi.archiveKpi(id);
        fetchData();
      } catch (err) {
        alert('Failed to archive KPI');
      }
    }
  };

  const filteredKpis = kpis.filter((k: any) => 
    (k.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     k.code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter ? k.status === statusFilter : true) &&
    k.status !== 'ARCHIVED'
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Performance & KPIs</h1>
          <p className="text-slate-500">Monitor project performance, targets, progress and measurable municipal outcomes.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center font-medium shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Create KPI
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={fetchData} className="text-red-700 font-semibold hover:underline bg-red-100 px-3 py-1 rounded">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>)}
          </div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      ) : kpis.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No performance indicators have been created yet.</h3>
          <p className="text-slate-500 mb-6">Create your first KPI to begin monitoring municipal performance.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="text-teal-600 font-semibold hover:underline">
            + Create KPI
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total KPIs</div>
                <div className="text-2xl font-black text-slate-800">{overview.total_kpis}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active KPIs</div>
                <div className="text-2xl font-black text-blue-600">{overview.active_kpis}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">On Target</div>
                <div className="text-2xl font-black text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {overview.on_target}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Needs Attention</div>
                <div className="text-2xl font-black text-amber-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {overview.needs_attention}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg Achievement</div>
                <div className="text-2xl font-black text-teal-600 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> {overview.avg_achievement}%
                </div>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search KPIs by name or code..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="On Target">On Target</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-semibold text-slate-600 text-sm">KPI Details</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Project / Dept</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Current vs Target</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKpis.map((k: any) => {
                    const achievement = k.achievement_percentage || 0;
                    return (
                      <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{k.code} - {k.name}</div>
                          <div className="text-xs text-slate-500 mt-1">{k.category} • {k.frequency}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-slate-700">{k.project_name || '-'}</div>
                          <div className="text-xs text-slate-500">{k.department_name || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-[120px]">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-slate-700">{k.current_value} {k.unit}</span>
                                <span className="text-slate-500">/ {k.target_value}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  k.status === 'On Target' ? 'bg-green-500' :
                                  k.status === 'Needs Attention' ? 'bg-amber-500' : 'bg-red-500'
                                }`} style={{ width: `${Math.min(achievement, 100)}%` }}></div>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-slate-700">{achievement}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            k.status === 'On Target' ? 'bg-green-100 text-green-700' :
                            k.status === 'Needs Attention' ? 'bg-amber-100 text-amber-700' :
                            k.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {k.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedKpi(k);
                              setNewMeasurement({ value: k.current_value || 0, measurement_date: new Date().toISOString().split('T')[0], notes: '' });
                              setIsUpdateModalOpen(true);
                            }} 
                            className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          >
                            Update
                          </button>
                          <button onClick={() => handleArchive(k.id)} className="px-2 py-1.5 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors">
                            Archive
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredKpis.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No KPIs found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">Create New KPI</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">KPI Name <span className="text-red-500">*</span></label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={newKpi.name} onChange={e => setNewKpi({...newKpi, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">KPI Code <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="e.g. KPI-001" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={newKpi.code} onChange={e => setNewKpi({...newKpi, code: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    value={newKpi.department_id} onChange={e => setNewKpi({...newKpi, department_id: e.target.value})}>
                    <option value="">None / General</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    value={newKpi.project_id} onChange={e => setNewKpi({...newKpi, project_id: e.target.value})}>
                    <option value="">None / General</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    value={newKpi.unit} onChange={e => setNewKpi({...newKpi, unit: e.target.value})}>
                    <option value="Percentage">Percentage</option>
                    <option value="Count">Count</option>
                    <option value="Amount">Amount</option>
                    <option value="Days">Days</option>
                    <option value="Kilometers">Kilometers</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance Direction</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    value={newKpi.direction} onChange={e => setNewKpi({...newKpi, direction: e.target.value})}>
                    <option value="Higher is Better">Higher is Better</option>
                    <option value="Lower is Better">Lower is Better</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Baseline Value</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={newKpi.baseline_value} onChange={e => setNewKpi({...newKpi, baseline_value: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Value <span className="text-red-500">*</span></label>
                  <input required type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={newKpi.target_value} onChange={e => setNewKpi({...newKpi, target_value: Number(e.target.value)})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={newKpi.start_date} onChange={e => setNewKpi({...newKpi, start_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={newKpi.target_date} onChange={e => setNewKpi({...newKpi, target_date: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg">Create KPI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Measurement Modal */}
      {isUpdateModalOpen && selectedKpi && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Update Measurement</h2>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <p className="font-bold text-slate-800">{selectedKpi.code}: {selectedKpi.name}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <div><span className="text-slate-500">Target:</span> {selectedKpi.target_value} {selectedKpi.unit}</div>
                <div><span className="text-slate-500">Current:</span> {selectedKpi.current_value} {selectedKpi.unit}</div>
              </div>
            </div>
            <form onSubmit={handleUpdateMeasurement} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Measurement Value <span className="text-red-500">*</span></label>
                <input required type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newMeasurement.value} onChange={e => setNewMeasurement({...newMeasurement, value: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newMeasurement.measurement_date} onChange={e => setNewMeasurement({...newMeasurement, measurement_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newMeasurement.notes} onChange={e => setNewMeasurement({...newMeasurement, notes: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save Measurement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
