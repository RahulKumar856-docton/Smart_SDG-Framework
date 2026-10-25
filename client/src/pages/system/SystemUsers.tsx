import React, { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Key, ShieldCheck, ShieldAlert, 
  Search, Trash2, Check, X, RefreshCw, AlertTriangle, 
  Lock, Edit3, Filter
} from 'lucide-react';
import axios from 'axios';

export default function SystemUsers({ onlyAdmins = false }: { onlyAdmins?: boolean }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(onlyAdmins ? 'ADMIN' : 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPwUser, setResetPwUser] = useState<any | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [changeRoleUser, setChangeRoleUser] = useState<any | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<number | ''>('');

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role_id: 1, // Default Admin or Officer
    department_id: '',
    employee_id: '',
    designation: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/users', {
        params: {
          search: search.trim(),
          role: onlyAdmins ? 'ADMIN' : roleFilter,
          status: statusFilter
        },
        withCredentials: true
      });
      if (res.data.success) {
        setUsers(res.data.data.users || []);
        setRoles(res.data.data.roles || []);
        setDepartments(res.data.data.departments || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load user records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/system/users', newUserForm, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
        setShowCreateModal(false);
        setNewUserForm({
          username: '',
          password: '',
          full_name: '',
          email: '',
          phone: '',
          role_id: 1,
          department_id: '',
          employee_id: '',
          designation: ''
        });
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'User creation failed' });
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = (user.status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await axios.put(`/api/system/users/${user.id}/status`, { status: nextStatus }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `User ${user.username} is now ${nextStatus}` });
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update user status' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwUser || !newPasswordVal) return;
    try {
      const res = await axios.put(`/api/system/users/${resetPwUser.id}/password`, { password: newPasswordVal }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Password reset successfully for ${resetPwUser.username}` });
        setResetPwUser(null);
        setNewPasswordVal('');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRoleUser || !selectedNewRole) return;
    try {
      const res = await axios.put(`/api/system/users/${changeRoleUser.id}/role`, { role_id: selectedNewRole }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Role updated for ${changeRoleUser.username}` });
        setChangeRoleUser(null);
        setSelectedNewRole('');
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to change role' });
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.username}"?`)) return;
    try {
      const res = await axios.delete(`/api/system/users/${user.id}`, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              ROOT ACCESS GOVERNANCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {onlyAdmins ? 'Administrative Accounts' : 'Platform User Directory & Access Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative user directory with role assignment, status revocation, and credential override.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' 
            : 'bg-rose-950/40 border border-rose-800 text-rose-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search username, email, full name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {!onlyAdmins && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User / Identity</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-mono">
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuper = (u.role_name || '').toUpperCase() === 'SUPER_ADMIN';
                  const isAdmin = (u.role_name || '').toUpperCase() === 'ADMIN';
                  const isActive = (u.status || '').toUpperCase() === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSuper 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : isAdmin 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isSuper && <span className="text-[10px] text-amber-400">👑</span>}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{u.email || u.full_name || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuper 
                            ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                            : isAdmin 
                            ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {u.department_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isActive 
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' 
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {u.created_at ? u.created_at.slice(0, 10) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title={isActive ? "Deactivate Account" : "Activate Account"}
                          >
                            {isActive ? <X className="w-3.5 h-3.5 text-rose-400" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>

                          <button
                            onClick={() => {
                              setChangeRoleUser(u);
                              setSelectedNewRole(u.role_id || '');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Change Role"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            onClick={() => setResetPwUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Reset Master Password"
                          >
                            <Key className="w-3.5 h-3.5 text-cyan-400" />
                          </button>

                          {!isSuper && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>Create Platform Account</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Role *</label>
                  <select
                    value={newUserForm.role_id}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Department</label>
                  <select
                    value={newUserForm.department_id}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Unassigned</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Reset Password for {resetPwUser.username}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter a new secure password. This action will be audited.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Enter new password"
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPwUser(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {changeRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Change Role: {changeRoleUser.username}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current role: <span className="font-mono text-amber-400 font-bold">{changeRoleUser.role_name}</span>
            </p>
            <form onSubmit={handleChangeRole} className="space-y-4">
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select Target Role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangeRoleUser(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Apply Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
