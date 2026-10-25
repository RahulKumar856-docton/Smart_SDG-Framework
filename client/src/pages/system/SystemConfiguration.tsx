import React, { useEffect, useState } from 'react';
import { Settings, Clock, Zap, Save, RefreshCw, X, Shield, Sliders } from 'lucide-react';
import axios from 'axios';

export default function SystemConfiguration() {
  const [settingsGrouped, setSettingsGrouped] = useState<Record<string, any[]>>({});
  const [slaRules, setSlaRules] = useState<any[]>([]);
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/configuration', { withCredentials: true });
      if (res.data.success) {
        const groups = res.data.data.settings || {};
        setSettingsGrouped(groups);
        setSlaRules(res.data.data.sla_rules || []);

        const initialMap: Record<string, string> = {};
        Object.values(groups).forEach((items: any) => {
          items.forEach((it: any) => {
            initialMap[it.setting_key] = it.setting_value || '';
          });
        });
        setPendingValues(initialMap);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post('/api/system/configuration', { settings: pendingValues }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'System configuration updated and applied.' });
        fetchConfig();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              PLATFORM POLICIES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Configuration & SLA Escalation Rules
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global security parameters, SLA breach thresholds, and automated municipal escalation policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Applying...' : 'Save Configuration'}</span>
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

      {/* SLA POLICIES SECTION */}
      {slaRules.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              SLA Policies & Department Resolution Windows
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {slaRules.map((rule, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{rule.category || rule.service_name || 'Standard Service'}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Priority: {rule.priority || 'Normal'}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-black text-amber-400">{rule.max_resolution_hours || 48} hrs</div>
                  <div className="text-[9px] text-slate-500 uppercase">Max SLA</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GLOBAL SETTINGS BY CATEGORY */}
      <div className="space-y-6">
        {Object.entries(settingsGrouped).map(([category, items]) => (
          <div key={category} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {category} Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.setting_key} className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-300">
                    {item.setting_key}
                  </label>
                  {item.description && (
                    <p className="text-[11px] text-slate-500">{item.description}</p>
                  )}
                  <input
                    type="text"
                    value={pendingValues[item.setting_key] ?? ''}
                    onChange={(e) => setPendingValues({ ...pendingValues, [item.setting_key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
