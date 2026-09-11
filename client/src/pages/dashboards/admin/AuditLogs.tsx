import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Shield, ShieldCheck, Activity, Users, Clock, 
  Search, Filter, ChevronRight, AlertTriangle, CheckCircle, 
  X, Calendar, XCircle, Database, FileText, ArrowRight, Download, Server
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

const MODULES = [
  'Projects', 'Departments', 'Performance & KPIs', 'Citizen Requests', 
  'Field Inspections', 'Evidence', 'Data Quality', 'Impact Analysis', 
  'Risk & AI', 'GIS', 'Reports', 'Officer Management', 'Notifications', 
  'Settings', 'Authentication', 'System'
];

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'VERIFY', 'REJECT', 
  'APPROVE', 'ASSIGN', 'UPLOAD', 'DOWNLOAD', 'EXPORT', 
  'GENERATE_REPORT', 'RUN_SCAN', 'CHANGE_STATUS', 'LOCATION_UPDATE', 
  'SETTINGS_UPDATE', 'LOGIN', 'LOGOUT', 'Failed Login'
];

const RESULTS = ['SUCCESS', 'FAILED', 'DENIED'];
const ROLES = ['Admin', 'Officer', 'Citizen', 'System'];
const DATE_RANGES = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'This Year'];

export default function AuditLogs() {
  const [stats, setStats] = useState({ total: 0, today: 0, admin: 0, officer: 0, failed: 0, system: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    date_range: 'Last 30 Days',
    module: '',
    action: '',
    result: '',
    role: '',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    loadStats();
    loadLogs();
  }, [filters]);

  const loadStats = async () => {
    try {
      const res = await adminApi.getAuditLogStats();
      if (res.success) setStats(res.data);
    } catch (e) {
      console.error("Failed to load audit stats:", e);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Build query
      const queryParams: any = { ...filters };
      if (!queryParams.module) delete queryParams.module;
      if (!queryParams.action) delete queryParams.action;
      if (!queryParams.result) delete queryParams.result;
      if (!queryParams.role) delete queryParams.role;
      
      const res = await adminApi.getAuditLogs(queryParams);
      if (res.success) {
        // Apply frontend search on the results
        let filteredLogs = res.data;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filteredLogs = filteredLogs.filter((log: any) => 
            (log.user_name && log.user_name.toLowerCase().includes(q)) ||
            (log.entity_id && String(log.entity_id).toLowerCase().includes(q)) ||
            (log.action && log.action.toLowerCase().includes(q)) ||
            (log.module && log.module.toLowerCase().includes(q))
          );
        }
        setLogs(filteredLogs);
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">SUCCESS</span>;
      case 'FAILED': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-200">FAILED</span>;
      case 'DENIED': return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">DENIED</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">{result}</span>;
    }
  };

  const exportCSV = () => {
    // Generate CSV
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Entity', 'Entity ID', 'Result'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.user_name || 'System',
      l.user_role || 'System',
      l.module || 'System',
      l.action,
      l.entity || '-',
      l.entity_id || '-',
      l.result
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Logs_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Attempt to log export action to backend conceptually
    // (A real app would hit an endpoint that both generates & logs the export securely)
  };

  const renderJson = (data: any) => {
    if (!data) return <span className="text-gray-400 italic">None</span>;
    if (typeof data !== 'object') return <span>{String(data)}</span>;
    
    return (
      <div className="bg-gray-900 rounded p-4 overflow-x-auto">
        <pre className="text-sm text-green-400 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-12 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-8 flex flex-col justify-between shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 text-slate-800 opacity-50 pointer-events-none">
          <ShieldAlert size={250} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center text-sm text-slate-400 mb-2">
            <span>Home</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Admin</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-slate-200 font-medium">Audit Logs</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center mb-2 tracking-tight">
                <ShieldCheck className="h-8 w-8 mr-3 text-emerald-400" />
                System Audit Logs
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm">
                Track important system activities, administrative actions and record changes for accountability and operational transparency.
              </p>
            </div>
            <button onClick={exportCSV} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors flex items-center shadow-sm">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="px-8 mt-[-30px] relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Activities</h3>
              <Database className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Today's Activities</h3>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.today.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Admin Actions</h3>
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.admin.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Officer Actions</h3>
              <Users className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.officer.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">System Events</h3>
              <Server className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.system.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><AlertTriangle className="h-10 w-10 text-red-500" /></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <h3 className="text-xs font-semibold text-red-600 uppercase">Failed / Denied</h3>
            </div>
            <div className="text-2xl font-bold text-red-700 relative z-10">{stats.failed.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 mt-6 flex flex-col lg:flex-row gap-6">
        
        {/* Logs Table Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-t-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by user, entity ID, action..." 
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.module || filters.action || filters.result || filters.role || filters.date_range !== 'Last 30 Days') && (
                <span className="ml-2 flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 border-x border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date Range</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.date_range}
                  onChange={e => setFilters({...filters, date_range: e.target.value})}
                >
                  {DATE_RANGES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Module</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.module}
                  onChange={e => setFilters({...filters, module: e.target.value})}
                >
                  <option value="">All Modules</option>
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Action</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.action}
                  onChange={e => setFilters({...filters, action: e.target.value})}
                >
                  <option value="">All Actions</option>
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Result</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.result}
                  onChange={e => setFilters({...filters, result: e.target.value})}
                >
                  <option value="">All Results</option>
                  {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Role</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-slate-500"
                  value={filters.role}
                  onChange={e => setFilters({...filters, role: e.target.value})}
                >
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="lg:col-span-5 flex justify-end">
                <button 
                  onClick={() => setFilters({date_range: 'All Time', module: '', action: '', result: '', role: '', search: ''})}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Module</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Entity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Result</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <Activity className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-3" />
                        <p className="text-slate-500">Loading audit records...</p>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium text-lg">No audit activity found.</p>
                        <p className="text-slate-400 text-sm">Try adjusting your filters or search query.</p>
                      </td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(log.timestamp).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{log.user_name || 'System'}</span>
                          <span className="text-xs text-slate-500">{log.user_role || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-700">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-800">{log.entity || '-'}</span>
                          {log.entity_id ? <span className="text-xs text-slate-500 font-mono">ID: {log.entity_id}</span> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getResultBadge(log.result)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full"
                        >
                          View <ArrowRight className="h-3 w-3 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination placeholder (Client side for now based on max results) */}
            <div className="bg-slate-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-sm text-slate-500">
              <span>Showing {logs.length} records matching criteria.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Log Detail Drawer (Slide from right) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-slate-300" />
                  Audit Record Details
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Record ID: {selectedLog.id} • {new Date(selectedLog.timestamp).toISOString()}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition-colors p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Execution Context</h3>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Actor</span>
                    <div className="font-medium text-slate-900 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-slate-400" />
                      {selectedLog.user_name || 'System'} ({selectedLog.user_role || 'System'})
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Result</span>
                    <div>{getResultBadge(selectedLog.result)}</div>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Module</span>
                    <div className="font-medium text-slate-900">{selectedLog.module}</div>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Action Performed</span>
                    <div className="font-bold text-slate-800 bg-slate-100 inline-block px-2 py-0.5 rounded">{selectedLog.action}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-500 mb-1">Target Entity</span>
                    <div className="font-medium text-slate-900 flex items-center">
                      {selectedLog.entity || 'N/A'} {selectedLog.entity_id ? <span className="font-mono text-xs ml-2 bg-slate-100 px-1 rounded text-slate-600">ID: {selectedLog.entity_id}</span> : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Immutable Append-only warning */}
              <div className="flex items-start p-3 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                <ShieldCheck className="h-5 w-5 text-blue-500 mr-3 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  This record is structurally immutable. As per compliance requirements, audit records cannot be modified or deleted directly through the administrative interface.
                </p>
              </div>

              {/* State Changes */}
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">State Changes</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-700 flex items-center">
                      <Database className="h-4 w-4 mr-2 text-slate-400" /> Previous Value
                    </span>
                  </div>
                  {renderJson(selectedLog.old_value)}
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-700 flex items-center">
                      <Database className="h-4 w-4 mr-2 text-indigo-400" /> New Value / Payload
                    </span>
                  </div>
                  {renderJson(selectedLog.new_value)}
                </div>
              </div>

            </div>
            
            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
