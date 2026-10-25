import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Megaphone, Check, X, RefreshCw, Send, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminCommunications() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    target_role: 'ALL'
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/communications', { withCredentials: true });
      if (res.data.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load communications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/communications', form, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Announcement broadcast successfully.' });
        setShowCreateModal(false);
        setForm({ title: '', content: '', priority: 'NORMAL', target_role: 'ALL' });
        fetchAnnouncements();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to broadcast announcement' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this broadcast message?')) return;
    try {
      const res = await axios.delete(`/api/admin/communications/${id}`, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Announcement removed.' });
        fetchAnnouncements();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Municipal Communications & Broadcasts</h1>
          <p className="text-slate-500 font-medium text-sm">
            Publish public civic alerts, departmental advisories, and service notifications to citizens and officers.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Broadcast Announcement</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ANNOUNCEMENTS FEED */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No active broadcast announcements.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  a.priority === 'HIGH' || a.priority === 'URGENT' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.priority === 'HIGH' || a.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {a.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                      Target: {a.target_role || 'ALL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{a.content}</p>
                  <div className="text-[11px] text-slate-400 mt-3 font-mono">
                    Published: {a.created_at?.slice(0, 16) || 'Recent'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(a.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remove broadcast"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <span>Broadcast Municipal Announcement</span>
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Ward 4 Water Pipeline Maintenance Schedule"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="NORMAL">Normal Advisory</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                  <select
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ALL">All Users (Citizens & Staff)</option>
                    <option value="CITIZEN">Citizens Only</option>
                    <option value="OFFICER">Field Officers Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Message / Instructions *</label>
                <textarea
                  rows={4}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Provide complete public information, expected timeline, affected zones..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
