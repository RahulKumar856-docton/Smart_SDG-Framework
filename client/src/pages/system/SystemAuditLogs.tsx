import React, { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, Trash2, Filter, X, Shield } from 'lucide-react';
import axios from 'axios';

export default function SystemAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Prune Modal
  const [showPruneModal, setShowPruneModal] = useState(false);
  const [keepDays, setKeepDays] = useState(90);
  const [pruning, setPruning] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/audit-logs', {
        params: { search: search.trim(), module: moduleFilter },
        withCredentials: true
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load audit logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const handlePrune = async () => {
    setPruning(true);
    try {
      const res = await axios.post('/api/system/audit-logs/prune', { keep_days: keepDays }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
        setShowPruneModal(false);
        fetchLogs();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Prune failed' });
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              IMMUTABLE AUDIT TRAIL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System-Wide Audit Logs & Provenance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable timeline of administrative mutations, configuration adjustments, and authorization events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPruneModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Prune Retention</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border border-rose-800 text-rose-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Search action, entity, user..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Modules</option>
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="Security">Security</option>
            <option value="Settings">Settings</option>
            <option value="Admin">Admin</option>
            <option value="Municipal">Municipal</option>
            <option value="AI">AI</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-[11px] text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No matching audit events found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-500">{log.timestamp?.slice(0, 19)}</td>
                    <td className="py-3 px-4 font-bold text-white">{log.username}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{log.module || 'System'}</td>
                    <td className="py-3 px-4 text-slate-400">{log.entity} #{log.entity_id || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{log.new_value || log.old_value || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRUNE RETENTION MODAL */}
      {showPruneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Prune Audit Trail Records</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Specify retention threshold. Records older than the specified duration will be permanently purged.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Retention Window (Days)</label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={keepDays}
                  onChange={(e) => setKeepDays(parseInt(e.target.value) || 90)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPruneModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrune}
                  disabled={pruning}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  {pruning ? 'Purging...' : 'Execute Prune'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
