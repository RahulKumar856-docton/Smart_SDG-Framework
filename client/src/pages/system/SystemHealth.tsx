import React, { useEffect, useState } from 'react';
import { Database, HardDrive, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Activity } from 'lucide-react';
import axios from 'axios';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagResult, setDiagResult] = useState<any | null>(null);
  const [runningDiag, setRunningDiag] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/health', { withCredentials: true });
      if (res.data.success) {
        setHealthData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const runDiagnostics = async () => {
    setRunningDiag(true);
    setDiagResult(null);
    try {
      const res = await axios.post('/api/system/health/db-check', {}, { withCredentials: true });
      if (res.data.success) {
        setDiagResult(res.data.data);
      }
    } catch (err: any) {
      setDiagResult({ status: 'ERROR', error: err.response?.data?.message || 'Check failed' });
    } finally {
      setRunningDiag(false);
    }
  };

  const { database = {} } = healthData || {};
  const tables: any[] = database.tables || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              INFRASTRUCTURE TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Infrastructure & Database Health
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Low-level SQLite storage footprints, row distribution, PRAGMA checks, and service connectivity.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={runningDiag}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${runningDiag ? 'animate-spin' : ''}`} />
          <span>{runningDiag ? 'Running Integrity PRAGMA...' : 'Run Database Integrity PRAGMA'}</span>
        </button>
      </div>

      {/* METRICS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">STORAGE ENGINE</div>
          <div className="text-sm font-bold text-white mt-1">{database.engine || 'SQLite 3'}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">ACID Compliant</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">DATABASE FOOTPRINT</div>
          <div className="text-sm font-bold text-emerald-400 mt-1">{database.file_size || '0 KB'}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Physical File Size</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">ACTIVE TABLES</div>
          <div className="text-sm font-bold text-white mt-1">{database.tables_count ?? tables.length}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Relational schemas</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase">SERVICE HEALTH</div>
          <div className="text-sm font-bold text-emerald-400 mt-1">{database.status || 'OPERATIONAL'}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">All nodes synced</div>
        </div>
      </div>

      {/* DIAGNOSTIC RESULTS CALLOUT */}
      {diagResult && (
        <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${
          diagResult.status === 'HEALTHY'
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {diagResult.status === 'HEALTHY' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <span>PRAGMA Integrity Diagnostics Result: {diagResult.status}</span>
          </div>
          <div>Checked at: {diagResult.checked_at}</div>
          <div>PRAGMA integrity_check: {JSON.stringify(diagResult.integrity_check)}</div>
          <div>PRAGMA quick_check: {JSON.stringify(diagResult.quick_check)}</div>
          <div>Foreign Key Violations: {diagResult.foreign_key_violations}</div>
        </div>
      )}

      {/* DATABASE TABLES LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Physical Database Tables & Row Counts
            </h2>
          </div>
          <button onClick={fetchHealth} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tables.map((t, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-300 font-bold truncate">{t.name}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                {t.row_count} rows
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
