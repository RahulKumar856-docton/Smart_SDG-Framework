import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, AlertTriangle, RefreshCw, KeyRound, Globe, UserX, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function SystemSecurity() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/security', { withCredentials: true });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const { metrics = {}, login_attempts = [], security_events = [] } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold">
              ZERO-TRUST TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Security Telemetry & Access Defense
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time intrusion detection, failed authentication monitoring, and privilege escalation traps.
          </p>
        </div>

        <button
          onClick={fetchSecurity}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-xl bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="text-[10px] font-mono text-rose-400 uppercase">FAILED AUTH (24H)</div>
          <div className="text-2xl font-black text-rose-300 mt-1">{metrics.failed_attempts_24h ?? 0}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Tracked attempts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">CRITICAL ALERTS</div>
          <div className="text-2xl font-black text-white mt-1">{metrics.critical_alerts ?? 0}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">High severity events</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">LOCKOUT THRESHOLD</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{metrics.lockout_threshold ?? 5}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Attempts before lock</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">SESSION LIFETIME</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{metrics.session_timeout_minutes ?? 30}m</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Inactivity timeout</div>
        </div>
      </div>

      {/* RECENT SECURITY EVENTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Intrusion & Security Incidents Log
          </h2>
        </div>

        <div className="space-y-2">
          {security_events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-mono text-xs">
              No recent security anomalies or intrusion alerts logged.
            </div>
          ) : (
            security_events.map((ev: any) => (
              <div key={ev.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      ev.severity === 'CRITICAL' 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                        : ev.severity === 'WARNING' 
                        ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {ev.severity}
                    </span>
                    <span className="font-bold text-xs text-white font-mono">{ev.event_type}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{ev.description}</p>
                </div>
                <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                  <div>{ev.created_at?.slice(0, 19) || 'Recent'}</div>
                  <div className="text-slate-400">{ev.ip_address || '127.0.0.1'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RECENT AUTH ATTEMPTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Authentication Gate Attempts
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Failure Reason</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300 text-[11px]">
              {login_attempts.map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-white">{att.username}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      att.success ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {att.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{att.ip_address}</td>
                  <td className="py-2.5 px-3 text-rose-400/90">{att.failure_reason || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{att.attempted_at?.slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
