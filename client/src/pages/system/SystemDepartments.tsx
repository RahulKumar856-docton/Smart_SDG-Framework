import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Users, FolderKanban, Activity, X, Check } from 'lucide-react';
import axios from 'axios';

export default function SystemDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/departments', { withCredentials: true });
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load departments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(`/api/system/departments/${editingDept.id}`, form, { withCredentials: true });
        setFeedback({ type: 'success', text: `Department "${form.name}" updated successfully.` });
      } else {
        await axios.post('/api/system/departments', form, { withCredentials: true });
        setFeedback({ type: 'success', text: `Department "${form.name}" created successfully.` });
      }
      setShowModal(false);
      setEditingDept(null);
      setForm({ name: '', description: '' });
      fetchDepts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              MUNICIPAL TOPOLOGY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Departments & Service Scope
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure municipal departments, assignment boundaries, and service delivery scope.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDept(null);
            setForm({ name: '', description: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border border-rose-800 text-rose-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* GRID OF DEPARTMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{d.name}</h3>
                    <div className="text-[10px] font-mono text-slate-500">ID #{d.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingDept(d);
                    setForm({ name: d.name, description: d.description || '' });
                    setShowModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                {d.description || 'No description configured.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center font-mono">
              <div className="bg-slate-950/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase">Officers</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{d.officer_count ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase">Projects</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{d.project_count ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase">Reports</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{d.request_count ?? 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>{editingDept ? 'Edit Department' : 'Create Department'}</span>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Public Works Department"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description / Operational Scope</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe municipal responsibilities, service targets..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
