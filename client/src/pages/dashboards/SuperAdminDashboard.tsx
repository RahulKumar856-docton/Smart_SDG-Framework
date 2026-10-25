import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Activity, Users, Database,
  Settings, RefreshCw, CheckCircle, Clock,
  ArrowRight, Building2, Cpu, FileText, Globe, Layers,
  Terminal, Sparkles, Search, UserPlus, Key, Trash2,
  AlertTriangle, Check, X, Server, HardDrive, ShieldAlert,
  Sliders, Plus
} from 'lucide-react';
import { apiClient } from '../../services/adminApi';

interface SystemHealth {
  server_status: string;
  database_status: string;
  db_size: string;
  timestamp: string;
  modules?: Record<string, any>;
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'departments' | 'database' | 'settings' | 'audit'>('overview');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Overview Data
  const [overviewData, setOverviewData] = useState<any>(null);

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableDepts, setAvailableDepts] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<any | null>(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState<any | null>(null);
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [dbCheckResult, setDbCheckResult] = useState<any | null>(null);
  const [runningDbCheck, setRunningDbCheck] = useState(false);

  // Form States
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role_id: 2, // Default Officer
    department_id: '',
    employee_id: '',
    designation: ''
  });
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [selectedNewRole, setSelectedNewRole] = useState<number | ''>('');
  const [newDeptForm, setNewDeptForm] = useState({ name: '', description: '' });

  // Database Tables State
  const [dbTables, setDbTables] = useState<any[]>([]);
  const [tableSearch, setTableSearch] = useState('');

  // System Settings State
  const [settingsCategories, setSettingsCategories] = useState<Record<string, any[]>>({});
  const [pendingSettings, setPendingSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Load Overview Data
  const fetchOverview = async () => {
    try {
      const res = await apiClient.get('/super-admin/overview');
      if (res.data.success) {
        setOverviewData(res.data.data);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load overview:", err);
    }
  };

  // Load Users Data
  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/super-admin/users');
      if (res.data.success) {
        setUsersList(res.data.data.users || []);
        setAvailableRoles(res.data.data.roles || []);
        setAvailableDepts(res.data.data.departments || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  // Load Tables Data
  const fetchTables = async () => {
    try {
      const res = await apiClient.get('/super-admin/system/tables');
      if (res.data.success) {
        setDbTables(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
    }
  };

  // Load System Settings
  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/super-admin/system/settings');
      if (res.data.success) {
        setSettingsCategories(res.data.data || {});
        // Flatten into key-value map for local editing
        const initialMap: Record<string, string> = {};
        Object.values(res.data.data || {}).forEach((group: any) => {
          group.forEach((item: any) => {
            initialMap[item.setting_key] = item.setting_value || '';
          });
        });
        setPendingSettings(initialMap);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchUsers(), fetchTables(), fetchSettings()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/super-admin/users', newUserForm);
      if (res.data.success) {
        showToast('success', res.data.message);
        setShowCreateUserModal(false);
        setNewUserForm({
          username: '',
          password: '',
          full_name: '',
          email: '',
          phone: '',
          role_id: 2,
          department_id: '',
          employee_id: '',
          designation: ''
        });
        fetchUsers();
        fetchOverview();
      } else {
        showToast('error', res.data.message || 'Creation failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleChangeRole = async (userId: number) => {
    if (!selectedNewRole) return;
    try {
      const res = await apiClient.put(`/super-admin/users/${userId}/role`, { role_id: selectedNewRole });
      if (res.data.success) {
        showToast('success', res.data.message);
        setShowChangeRoleModal(null);
        setSelectedNewRole('');
        fetchUsers();
        fetchOverview();
      } else {
        showToast('error', res.data.message || 'Failed to update role');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await apiClient.put(`/super-admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast('success', res.data.message);
        fetchUsers();
      } else {
        showToast('error', res.data.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Status update failed');
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!newPasswordVal || newPasswordVal.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }
    try {
      const res = await apiClient.post(`/super-admin/users/${userId}/reset-password`, { password: newPasswordVal });
      if (res.data.success) {
        showToast('success', res.data.message);
        setShowResetPasswordModal(null);
        setNewPasswordVal('');
      } else {
        showToast('error', res.data.message || 'Password reset failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.username}"?`)) return;
    try {
      const res = await apiClient.delete(`/super-admin/users/${user.id}`);
      if (res.data.success) {
        showToast('success', res.data.message);
        fetchUsers();
        fetchOverview();
      } else {
        showToast('error', res.data.message || 'Delete failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Department Actions
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptForm.name.trim()) return;
    try {
      const res = await apiClient.post('/super-admin/departments', newDeptForm);
      if (res.data.success) {
        showToast('success', res.data.message);
        setShowCreateDeptModal(false);
        setNewDeptForm({ name: '', description: '' });
        fetchUsers();
        fetchOverview();
      } else {
        showToast('error', res.data.message || 'Failed to create department');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create department');
    }
  };

  // Database Check Action
  const handleRunDbCheck = async () => {
    setRunningDbCheck(true);
    try {
      const res = await apiClient.post('/super-admin/system/db-check');
      if (res.data.success) {
        setDbCheckResult(res.data.data);
        showToast('success', 'SQLite database integrity check completed.');
      } else {
        showToast('error', res.data.message || 'Database check failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Database check failed');
    } finally {
      setRunningDbCheck(false);
    }
  };

  // Save System Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await apiClient.post('/super-admin/system/settings', { settings: pendingSettings });
      if (res.data.success) {
        showToast('success', res.data.message);
        fetchSettings();
      } else {
        showToast('error', res.data.message || 'Failed to save settings');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const { system_health, counts, recent_audits } = overviewData || {};

  const filteredUsers = (usersList || []).filter((u: any) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.employee_id || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || (u.role_name || '').toUpperCase() === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredTables = (dbTables || []).filter((t: any) =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  if (loading && !overviewData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Super Admin Command Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2 text-sm font-semibold transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50' 
            : 'bg-red-900/90 text-red-100 border-red-500/50'
        }`}>
          {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Super Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-indigo-500 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs rounded-full flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" /> ROOT SYSTEM GOVERNANCE
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-semibold text-xs rounded-full flex items-center border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                {system_health?.server_status || 'ONLINE'}
              </span>
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              Super Administrator Control Console
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Global administration panel for Smart SDG monitoring, multi-role user governance, department hierarchies, database engine telemetry, and system-wide security audit controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-indigo-200 font-mono bg-indigo-900/50 px-2.5 py-1 rounded-lg border border-indigo-700/40">
                Synced: {lastUpdated}
              </span>
            )}
            <button 
              onClick={loadAll} 
              className="flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold text-xs transition-all backdrop-blur-md shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Telemetry
            </button>
            <button 
              onClick={() => setShowCreateUserModal(true)} 
              className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5 mr-2" /> New User
            </button>
          </div>
        </div>

        {/* Live System Health Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>DB: <strong className="text-white">{system_health?.database_status || 'SQLite Connected'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Storage: <strong className="text-white">{system_health?.db_size || '330 KB'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>NLP Engine: <strong className="text-white">Active v2.4-BERT</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>SLA Escalator: <strong className="text-white">15m Scan Loop</strong></span>
          </div>
        </div>
      </div>

      {/* CORE PLATFORM KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Platform Users</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">{counts?.total_users ?? 0}</div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span className="text-purple-600 font-semibold">{counts?.admins ?? 0} Admins</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{counts?.officers ?? 0} Officers</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">{counts?.citizens ?? 0} Citizens</span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Departments</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">{counts?.departments ?? 0}</div>
          <div className="text-xs text-slate-500">
            Active Municipal Authorities
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">SDG Projects</span>
            <Layers className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">{counts?.projects ?? 0}</div>
          <div className="text-xs text-slate-500">
            Across 17 Sustainable Goals
          </div>
        </div>

        {/* Citizen Reports */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Service Requests</span>
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">{counts?.citizen_requests ?? 0}</div>
          <div className="text-xs text-slate-500">
            Citizen Reported Issues & Demands
          </div>
        </div>

      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'overview', label: 'System Overview', icon: Activity },
          { key: 'users', label: `Users & Roles (${usersList.length})`, icon: Users },
          { key: 'departments', label: `Departments (${availableDepts.length})`, icon: Building2 },
          { key: 'database', label: `Database & Tables (${dbTables.length})`, icon: HardDrive },
          { key: 'settings', label: 'System Settings', icon: Sliders },
          { key: 'audit', label: 'Security Audit', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 mr-2 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Subsystem Architecture Matrix */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <Server className="w-4 h-4 mr-2 text-indigo-600" />
              Municipal Intelligence Engines & Subsystems
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">NLP Intent Classifier</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">Parses citizen language into department category & priority.</p>
                <div className="text-[11px] font-mono text-slate-500">Model: DistilBERT v2.4 (Threshold: 0.75)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">SLA Auto Escalation</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">Automatically flags overdue field work to Higher Authorities.</p>
                <div className="text-[11px] font-mono text-slate-500">Threshold: 24h / 48h / 72h Escalator</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">Workload Balancer</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">Equally routes incoming issues to available department officers.</p>
                <div className="text-[11px] font-mono text-slate-500">Heuristic: Lowest Pending Work Queue</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">AI Risk Intelligence</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">Detects recurring ward bottlenecks and failure hazards.</p>
                <div className="text-[11px] font-mono text-slate-500">Engine: GradientBoosting v1.2</div>
              </div>
            </div>
          </div>

          {/* Quick Access Modules */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/dashboard" className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Command Center</h4>
              <p className="text-xs text-slate-500 mt-1">Live municipal monitoring</p>
            </Link>

            <Link to="/admin/projects" className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Projects</h4>
              <p className="text-xs text-slate-500 mt-1">Infrastructure & SDG</p>
            </Link>

            <Link to="/admin/gis" className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">GIS City Map</h4>
              <p className="text-xs text-slate-500 mt-1">Geospatial ward visualization</p>
            </Link>

            <Link to="/admin/risk-ai" className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Risk & AI Insights</h4>
              <p className="text-xs text-slate-500 mt-1">Predictive analysis</p>
            </Link>
          </div>

          {/* Recent Audit Feed */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <Terminal className="w-4 h-4 mr-2 text-slate-700" />
              Recent System Security Audit Stream
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">Entity / Target</th>
                    <th className="py-2.5">Module</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(recent_audits || []).map((audit: any) => (
                    <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900">{audit.username}</td>
                      <td className="py-2.5 font-mono text-indigo-600">{audit.action}</td>
                      <td className="py-2.5 text-slate-600">{audit.entity} {audit.entity_id ? `#${audit.entity_id}` : ''}</td>
                      <td className="py-2.5">{audit.module || 'System'}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {audit.result || 'SUCCESS'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{audit.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">User Registry & Role Matrix</h3>
              <p className="text-xs text-slate-500">Manage user credentials, privileges, department assignments, and access state.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                <UserPlus className="w-3.5 h-3.5 mr-2" /> Add User
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, username, email, employee ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="OFFICER">OFFICER</option>
              <option value="CITIZEN">CITIZEN</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u: any) => {
                  const roleName = (u.role_name || '').toUpperCase();
                  const isSuper = roleName === 'SUPER_ADMIN';
                  const isAdmin = roleName === 'ADMIN';
                  const isOfficer = roleName === 'OFFICER';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.full_name || u.username}</div>
                        <div className="text-[11px] text-slate-500">@{u.username} {u.employee_id ? `• Emp ID: ${u.employee_id}` : ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                          isSuper 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : isAdmin 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : isOfficer 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {roleName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {u.department_name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div>{u.email || 'No email'}</div>
                        <div className="text-[10px]">{u.phone || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setShowChangeRoleModal(u);
                              setSelectedNewRole(u.role_id || 2);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-semibold"
                            title="Change Role"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              u.status === 'ACTIVE'
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                          >
                            {u.status === 'ACTIVE' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setShowResetPasswordModal(u);
                              setNewPasswordVal('');
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {!isSuper && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Municipal Departments</h3>
              <p className="text-xs text-slate-500">Configure administrative departments, manager designations, and service boundaries.</p>
            </div>
            <button
              onClick={() => setShowCreateDeptModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {(availableDepts || []).map((dept: any) => (
              <div key={dept.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-all shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-900">{dept.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 rounded text-slate-700">ID #{dept.id}</span>
                </div>
                <p className="text-xs text-slate-600 mb-4 min-h-[36px]">{dept.description || 'Municipal department operations and field services.'}</p>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Officers</span>
                    <strong className="text-slate-900">{dept.officer_count ?? 1} assigned</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Projects</span>
                    <strong className="text-slate-900">{dept.project_count ?? 2} active</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE & TABLES EXPLORER */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">SQLite Database Engine Diagnostics</h3>
                <p className="text-xs text-slate-500">Live schema telemetry, physical file footprint, and table records monitor.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunDbCheck}
                  disabled={runningDbCheck}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${runningDbCheck ? 'animate-spin' : ''}`} />
                  Run Integrity Check
                </button>
              </div>
            </div>

            {/* DB Check Diagnostics Banner */}
            {dbCheckResult && (
              <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>PRAGMA integrity_check: {dbCheckResult.status}</span>
                  <span className="text-slate-400">{dbCheckResult.checked_at}</span>
                </div>
                <div className="text-slate-300">
                  Quick Check: {JSON.stringify(dbCheckResult.quick_check)}
                </div>
                <div className="text-slate-300">
                  Foreign Key Violations: {dbCheckResult.foreign_key_violations}
                </div>
              </div>
            )}

            {/* Tables Search */}
            <div className="pt-2">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search SQLite table names..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTables.map((t: any) => (
                <div key={t.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-mono text-xs text-slate-800 truncate" title={t.name}>{t.name}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-[10px] ml-2">
                    {t.row_count} rows
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Global Platform Configuration</h3>
              <p className="text-xs text-slate-500">Fine-tune municipal parameters, AI confidence boundaries, and session lifecycles.</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 mr-2" />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(settingsCategories).map(([category, items]) => (
              <div key={category} className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                  <Sliders className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                  {category.replace(/_/g, ' ')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item: any) => (
                    <div key={item.setting_key} className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {item.setting_key.replace(/_/g, ' ')}
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">{item.description || 'System property configuration.'}</p>
                      
                      {item.setting_type === 'BOOLEAN' ? (
                        <select
                          value={pendingSettings[item.setting_key] ?? item.setting_value}
                          onChange={(e) => setPendingSettings({ ...pendingSettings, [item.setting_key]: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                        >
                          <option value="true">Enabled (true)</option>
                          <option value="false">Disabled (false)</option>
                        </select>
                      ) : (
                        <input
                          type={item.setting_type === 'INTEGER' ? 'number' : 'text'}
                          value={pendingSettings[item.setting_key] ?? item.setting_value}
                          onChange={(e) => setPendingSettings({ ...pendingSettings, [item.setting_key]: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Security Audit Logs</h3>
              <p className="text-xs text-slate-500">Immutable trace of administrative events, data modifications, and authentication attempts.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(recent_audits || []).map((audit: any) => (
                  <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{audit.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{audit.username}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600">{audit.action}</td>
                    <td className="py-3 px-4">{audit.entity} {audit.entity_id ? `(${audit.entity_id})` : ''}</td>
                    <td className="py-3 px-4">{audit.module || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {audit.result || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{audit.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Provision New Platform User</h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="e.g. officer_raj"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="e.g. Raj Malhotra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="email@municipality.gov"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={newUserForm.role_id}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    {availableRoles.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={newUserForm.department_id}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None / Unassigned</option>
                    {availableDepts.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {showChangeRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Change Role Privilege</h3>
              <button onClick={() => setShowChangeRoleModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600">
              Update role assignment for <strong>{showChangeRoleModal.username}</strong>:
            </p>

            <select
              value={selectedNewRole}
              onChange={(e) => setSelectedNewRole(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {availableRoles.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowChangeRoleModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleChangeRole(showChangeRoleModal.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Force Password Reset</h3>
              <button onClick={() => setShowResetPasswordModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter a new password for user <strong>{showResetPasswordModal.username}</strong>:
            </p>

            <input
              type="password"
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowResetPasswordModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(showResetPasswordModal.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create Department</h3>
              <button onClick={() => setShowCreateDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  placeholder="e.g. Roads & Infrastructure"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDeptForm.description}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  placeholder="Scope of work and responsibilities..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
