import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, ShieldCheck, ShieldAlert, Activity, Database, 
  Cpu, AlertTriangle, Clock, RefreshCw, Key, Settings,
  CheckCircle2, ArrowRight, UserPlus, Server, Lock, Sliders,
  FileText, ExternalLink, Terminal, ChevronRight
} from 'lucide-react';
import axios from 'axios';

export default function SystemDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/system/overview', { withCredentials: true });
      if (res.data.success) {
        setData(res.data);
        setLastRefreshed(new Date().toLocaleTimeString());
      } else {
        setError(res.data.message || 'Failed to load telemetry data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to system telemetry endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-slate-400 tracking-wider">INITIALIZING SYSTEM METRICS STREAM...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800 text-rose-300 max-w-xl mx-auto my-12">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-base text-white mb-1">System Telemetry Unreachable</h3>
            <p className="text-xs text-rose-300/90 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-white text-xs font-bold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    counts = {},
    system_health = {},
    recent_config_changes = [],
    recent_audit_events = [],
    role_distribution = []
  } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              SYSTEM ROOT CONSOLE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Municipal Monitor — System Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Platform governance, credential access, AI model parameters, and high-privilege audit controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Synced: {lastRefreshed}
          </span>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Telemetry Sync</span>
          </button>
          <Link
            to="/system/users"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Manage Admins</span>
          </Link>
        </div>
      </div>

      {/* SYSTEM HEALTH STATUS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">DATABASE ENGINE</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{system_health.database_connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Size: {system_health.db_size || 'N/A'}</div>
          </div>
          <Database className="w-6 h-6 text-slate-700" />
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">API GATEWAY</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{system_health.api_status || 'ONLINE'}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Host: Local Flask V2.4</div>
          </div>
          <Server className="w-6 h-6 text-slate-700" />
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AI INFERENCE</div>
            <div className="text-sm font-bold text-cyan-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>{system_health.ai_service_status || 'OPERATIONAL'}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">NLP & Delay Classifier</div>
          </div>
          <Cpu className="w-6 h-6 text-slate-700" />
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">INTRUSION DEFENSE</div>
            <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>ACTIVE POLICIES</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Rate Limit: Enabled</div>
          </div>
          <Lock className="w-6 h-6 text-slate-700" />
        </div>
      </div>

      {/* CORE STAT METRICS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Users */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{counts.total_users ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Platform-wide directory</div>
        </div>

        {/* Active Admins */}
        <div className="bg-slate-900/80 border border-amber-900/40 p-4 rounded-xl bg-gradient-to-b from-amber-950/20 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-amber-400 uppercase">Active Admins</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{counts.active_admins ?? 0}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Operational Admins</div>
        </div>

        {/* Municipal Users */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Municipal Staff</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{counts.active_municipal_users ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Officers & Citizens</div>
        </div>

        {/* Failed Auth (24h) */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Auth Failures</span>
            <Lock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-300">{counts.failed_auth_24h ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Past 24 hours</div>
        </div>

        {/* Security Alerts */}
        <div className="bg-slate-900/80 border border-rose-900/40 p-4 rounded-xl bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-rose-400 uppercase">Security Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">{counts.security_alerts ?? 0}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Critical & Warning</div>
        </div>

        {/* Pending Administrative Actions */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Pending Actions</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">{counts.pending_admin_actions ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Requires review</div>
        </div>
      </div>

      {/* DUAL PANELS: CONFIGURATION CHANGES & RECENT AUDIT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Configuration Changes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Configuration Changes
                </h3>
              </div>
              <Link to="/system/configuration" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                <span>Configure</span> <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recent_config_changes.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No recent system configuration modifications recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recent_config_changes.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate">{item.action}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.entity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.new_value || 'Configuration updated'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono text-slate-500">{item.timestamp?.slice(0, 16) || 'Recent'}</div>
                      <div className="text-[10px] font-mono text-amber-400/90 font-semibold">{item.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>SLA Policies, Escalation, AI thresholds</span>
            <Link to="/system/sla-policies" className="text-slate-400 hover:text-slate-200">
              Manage SLA Policies &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Audit Events Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Audit Trail Events
                </h3>
              </div>
              <Link to="/system/audit-logs" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                <span>Full Audit Stream</span> <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recent_audit_events.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No recent audit events in system log.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recent_audit_events.map((audit: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate">{audit.action}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          audit.result === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {audit.result || 'RECORDED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        Module: {audit.module} &bull; Entity #{audit.entity_id || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono text-slate-500">{audit.timestamp?.slice(11, 19) || 'Just now'}</div>
                      <div className="text-[10px] font-mono text-slate-300 font-semibold">{audit.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Immutable system audit log records</span>
            <Link to="/system/security" className="text-slate-400 hover:text-slate-200">
              Security Incidents &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ROLE DISTRIBUTION & ACCESS CONTROL TILES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Platform Role Distribution & Authorization Matrix
            </h3>
          </div>
          <Link to="/system/roles-permissions" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
            <span>Configure Permissions</span> <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {role_distribution.map((role: any, idx: number) => {
            const isSuper = (role.role_name || '').toUpperCase() === 'SUPER_ADMIN';
            const isAdmin = (role.role_name || '').toUpperCase() === 'ADMIN';
            return (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isSuper 
                    ? 'bg-amber-950/20 border-amber-800/60' 
                    : isAdmin 
                    ? 'bg-indigo-950/20 border-indigo-800/60' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className={`text-[10px] font-mono font-bold uppercase truncate ${
                    isSuper ? 'text-amber-400' : isAdmin ? 'text-indigo-400' : 'text-slate-400'
                  }`}>
                    {role.role_name}
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {role.user_count}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">
                  {isSuper ? 'Root Full Control' : isAdmin ? 'Operational Scope' : 'Standard Access'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK LAUNCH ACTIONS FOOTER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link 
          to="/system/users" 
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Admin Account Governance</div>
              <div className="text-[11px] text-slate-400">Create & revoke operational admins</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
        </Link>

        <Link 
          to="/system/ai-configuration" 
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">AI & Model Calibration</div>
              <div className="text-[11px] text-slate-400">Tune confidence threshold & ML weights</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
        </Link>

        <Link 
          to="/system/health" 
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Infrastructure Health</div>
              <div className="text-[11px] text-slate-400">SQLite integrity check & row footprints</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
