import React, { useEffect, useState } from 'react';
import { Key, ShieldCheck, Check, X, RefreshCw, AlertTriangle, Save, Shield } from 'lucide-react';
import axios from 'axios';

export default function SystemRolesPermissions() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [assignedCodes, setAssignedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/roles-permissions', { withCredentials: true });
      if (res.data.success) {
        const fetchedRoles = res.data.data.roles || [];
        setRoles(fetchedRoles);
        setPermissions(res.data.data.permissions || []);
        if (fetchedRoles.length > 0 && !selectedRole) {
          setSelectedRole(fetchedRoles[0]);
          setAssignedCodes(new Set(fetchedRoles[0].permissions || []));
        } else if (selectedRole) {
          const updated = fetchedRoles.find((r: any) => r.id === selectedRole.id);
          if (updated) {
            setSelectedRole(updated);
            setAssignedCodes(new Set(updated.permissions || []));
          }
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load permissions matrix' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRole = (role: any) => {
    setSelectedRole(role);
    setAssignedCodes(new Set(role.permissions || []));
    setFeedback(null);
  };

  const togglePermission = (code: string) => {
    if (selectedRole?.name === 'SUPER_ADMIN') {
      alert("Super Admin retains all permissions by platform architecture.");
      return;
    }
    const next = new Set(assignedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setAssignedCodes(next);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await axios.post('/api/system/roles-permissions', {
        role_id: selectedRole.id,
        permissions: Array.from(assignedCodes)
      }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Permissions for ${selectedRole.name} updated successfully.` });
        fetchData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update permissions' });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const groupedPermissions: Record<string, any[]> = {};
  permissions.forEach(p => {
    const mod = p.module || 'General';
    if (!groupedPermissions[mod]) groupedPermissions[mod] = [];
    groupedPermissions[mod].push(p);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              ROLE-BASED ACCESS CONTROL (RBAC)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Roles & Granular Permission Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define system capabilities and authorization boundaries for all Municipal Monitor roles.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selectedRole?.name === 'SUPER_ADMIN'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Role Matrix'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' 
            : 'bg-rose-950/40 border border-rose-800 text-rose-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE: ROLES SELECTOR & PERMISSIONS CHECKBOXES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ROLES SELECTOR (Left 1 Col) */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold px-2">
            Select Role to Configure
          </div>
          <div className="space-y-2">
            {roles.map(r => {
              const isSelected = selectedRole?.id === r.id;
              const isSuper = r.name === 'SUPER_ADMIN';
              const isAdmin = r.name === 'ADMIN';

              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                    isSelected 
                      ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-lg shadow-amber-500/5' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-mono">{r.name}</span>
                    {isSuper ? (
                      <span className="text-[10px] text-amber-400 font-bold">ALL</span>
                    ) : isAdmin ? (
                      <span className="text-[10px] text-indigo-400 font-bold">OPERATIONAL</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">{(r.permissions || []).length} perms</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{r.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PERMISSIONS MATRIX (Right 3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                Configuring Permissions For:
              </div>
              <h2 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                <span>{selectedRole?.name}</span>
                {selectedRole?.name === 'SUPER_ADMIN' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                    Permanent Root Privilege
                  </span>
                )}
              </h2>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Assigned: <span className="text-white font-bold">{assignedCodes.size}</span> / {permissions.length}
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([modName, perms]) => (
              <div key={modName} className="space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Module: {modName}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map(p => {
                    const checked = selectedRole?.name === 'SUPER_ADMIN' || assignedCodes.has(p.code);
                    return (
                      <label
                        key={p.id}
                        onClick={() => togglePermission(p.code)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all select-none ${
                          checked 
                            ? 'bg-slate-950 border-amber-500/30 text-white' 
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={selectedRole?.name === 'SUPER_ADMIN'}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold font-mono text-slate-200 truncate">
                            {p.code}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{p.name}</div>
                          {p.description && (
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.description}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
