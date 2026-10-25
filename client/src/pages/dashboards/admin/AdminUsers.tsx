import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Search, RefreshCw, X, Check, ShieldCheck, Filter } from 'lucide-react';
import axios from 'axios';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'OFFICER'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        params: { search: search.trim(), role: roleFilter },
        withCredentials: true
      });
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load authorized users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/users', form, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
        setShowCreateModal(false);
        setForm({
          username: '',
          email: '',
          password: '',
          full_name: '',
          phone: '',
          role: 'OFFICER'
        });
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Creation failed' });
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = (user.status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await axios.put(`/api/admin/users/${user.id}/status`, { status: nextStatus }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `User ${user.username} is now ${nextStatus}` });
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update user status' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Authorized Users Management</h1>
          <p className="text-slate-500 font-medium text-sm">
            Manage municipal field officers, inspectors, and citizen accounts within authorized operational scope.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Operational User</span>
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

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search username, email, full name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Operational Roles</option>
            <option value="OFFICER">Officers</option>
            <option value="CITIZEN">Citizens</option>
            <option value="FIELD_OFFICER">Field Officers</option>
            <option value="DEPARTMENT_HEAD">Department Heads</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No authorized operational users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = (u.status || '').toUpperCase() === 'ACTIVE';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.username}</div>
                        <div className="text-[11px] text-slate-500">{u.email || u.full_name || '—'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                        {u.role_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.department_name || 'General Municipal'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.created_at?.slice(0, 10) || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Create Operational User</span>
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Operational Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="OFFICER">Field Officer / Inspector</option>
                  <option value="CITIZEN">Registered Citizen</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Admin and Super Admin accounts can only be provisioned by System Administration.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
