import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Database, Activity, CheckCircle, AlertTriangle, XCircle, 
  Search, Filter, Clock, BarChart2, CheckSquare, Folder, 
  Users, MapPin, Eye, FileText, LayoutDashboard, ChevronRight,
  Shield, Check, PlayCircle, Archive, RotateCw
} from 'lucide-react';

export default function DataQuality() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'history'>('overview');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [ignoreModalOpen, setIgnoreModalOpen] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, moduleFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, issRes, histRes] = await Promise.all([
        adminApi.getDataQualitySummary(),
        adminApi.getDataQualityIssues({ status: statusFilter, module: moduleFilter }),
        adminApi.getDataQualityHistory()
      ]);
      setSummary(sumRes.summary || sumRes);
      setIssues(issRes.data || []);
      setHistory(histRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load data quality information.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      await adminApi.runDataQualityScan();
      await fetchData();
      setActiveTab('overview');
    } catch (err) {
      alert('Data quality scan could not be completed.');
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await adminApi.resolveDataQualityIssue(id);
      setSelectedIssue(null);
      fetchData();
    } catch (err) {
      alert('Failed to resolve issue.');
    }
  };

  const handleIgnore = async () => {
    if (!ignoreReason.trim()) {
      alert('Reason is required.');
      return;
    }
    try {
      await adminApi.ignoreDataQualityIssue(selectedIssue.id, { reason: ignoreReason });
      setIgnoreModalOpen(false);
      setIgnoreReason('');
      setSelectedIssue(null);
      fetchData();
    } catch (err) {
      alert('Failed to ignore issue.');
    }
  };

  const getSeverityColor = (sev: string) => {
    switch(sev?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecordLink = (moduleName: string, id: number) => {
    switch(moduleName?.toUpperCase()) {
      case 'PROJECT': return `/admin/projects/${id}`;
      case 'CITIZEN REQUEST': return `/admin/citizen-requests/${id}`;
      case 'INSPECTION': return `/admin/inspections/${id}`;
      case 'EVIDENCE': return `/admin/evidence`;
      case 'OFFICER': return `/admin/officers`;
      case 'KPI': return `/admin/sdg`;
      default: return '#';
    }
  };

  const filteredIssues = issues.filter(i => 
    i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.record_id?.toString().includes(searchTerm)
  );

  const StatCard = ({ title, value, desc, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-800">{typeof value === 'number' ? value.toFixed(1) : value}{typeof value === 'number' ? '%' : ''}</p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2" title={desc}>{desc}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
        <button onClick={fetchData} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/admin" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Data Quality</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            Data Quality
          </h1>
          <p className="text-slate-500 mt-1">Monitor data completeness, validity, consistency and reliability across the municipal monitoring system.</p>
        </div>
        <button 
          onClick={handleRunScan}
          disabled={scanning}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all ${scanning ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}
        >
          {scanning ? <RotateCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
          {scanning ? 'Running Scan...' : 'Run Data Quality Scan'}
        </button>
      </div>

      {scanning && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-xl flex items-center justify-center flex-col gap-4 animate-pulse">
          <RotateCw className="w-10 h-10 animate-spin" />
          <div className="text-center">
            <h3 className="font-bold text-lg">Analyzing System Data...</h3>
            <p className="text-sm opacity-80">Scanning projects, requests, inspections, and evidence for quality issues.</p>
          </div>
        </div>
      )}

      {loading && !scanning ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white h-32 rounded-xl border border-slate-200"></div>)}
        </div>
      ) : !scanning && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard 
              title="Overall Quality" 
              value={summary.overall_score || 0} 
              desc={`Status: ${summary.status || 'Unknown'}`}
              icon={Activity} 
              colorClass={`bg-blue-50 ${getScoreColor(summary.overall_score || 0)}`} 
            />
            <StatCard 
              title="Completeness" 
              value={summary.completeness_score || 0} 
              desc="Percentage of required fields that contain valid values."
              icon={CheckSquare} 
              colorClass="bg-emerald-50 text-emerald-600" 
            />
            <StatCard 
              title="Validity" 
              value={summary.validity_score || 0} 
              desc="Percentage of records passing configured validation rules."
              icon={CheckCircle} 
              colorClass="bg-indigo-50 text-indigo-600" 
            />
            <StatCard 
              title="Consistency" 
              value={summary.consistency_score || 0} 
              desc="Percentage of records without detected relationship conflicts."
              icon={Database} 
              colorClass="bg-purple-50 text-purple-600" 
            />
            <StatCard 
              title="Recency" 
              value={summary.recency_score || 0} 
              desc="Percentage of records updated within freshness period."
              icon={Clock} 
              colorClass="bg-orange-50 text-orange-600" 
            />
            <StatCard 
              title="Verification" 
              value={summary.verification_score || 0} 
              desc="Percentage of records requiring verification that are verified."
              icon={Shield} 
              colorClass="bg-cyan-50 text-cyan-600" 
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6">
            <button 
              className={`pb-4 font-medium transition-colors relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('overview')}
            >
              Quality by Module
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
              className={`pb-4 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'issues' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('issues')}
            >
              Data Quality Issues
              <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full font-bold">{issues.length}</span>
              {activeTab === 'issues' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
              className={`pb-4 font-medium transition-colors relative ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('history')}
            >
              Scan History
              {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-4">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Quality by Module</h3>
                    <p className="text-sm text-slate-500">Breakdown of data quality performance across different system components.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                          <th className="p-4">Module</th>
                          <th className="p-4">Records Checked</th>
                          <th className="p-4">Active Issues</th>
                          <th className="p-4">Critical Issues</th>
                          <th className="p-4">Overall Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {summary.modules?.map((m: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                              {m.module === 'Project' && <Folder className="w-4 h-4 text-blue-500" />}
                              {m.module === 'Citizen Request' && <Users className="w-4 h-4 text-orange-500" />}
                              {m.module === 'Inspection' && <MapPin className="w-4 h-4 text-emerald-500" />}
                              {m.module === 'Evidence' && <FileText className="w-4 h-4 text-purple-500" />}
                              {m.module === 'Officer' && <Shield className="w-4 h-4 text-slate-500" />}
                              {m.module}
                            </td>
                            <td className="p-4 text-slate-600">{m.records}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.issues > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-500'}`}>
                                {m.issues}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.critical > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-500'}`}>
                                {m.critical}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                                  <div className={`h-2 rounded-full ${m.score >= 80 ? 'bg-emerald-500' : m.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${m.score}%` }}></div>
                                </div>
                                <span className={`font-bold ${getScoreColor(m.score)}`}>{m.score.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!summary.modules || summary.modules.length === 0) && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">Run a data quality scan to populate module metrics.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ISSUES TAB */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Search issues, fields, IDs..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <select 
                      className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="OPEN">Open Issues</option>
                      <option value="RESOLVED">Resolved Issues</option>
                      <option value="IGNORED">Ignored Issues</option>
                      <option value="">All Statuses</option>
                    </select>
                    <select 
                      className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      value={moduleFilter}
                      onChange={e => setModuleFilter(e.target.value)}
                    >
                      <option value="">All Modules</option>
                      <option value="Project">Projects</option>
                      <option value="Citizen Request">Citizen Requests</option>
                      <option value="Inspection">Inspections</option>
                      <option value="Evidence">Evidence</option>
                      <option value="Officer">Officers</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {filteredIssues.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                      <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                      <h3 className="text-xl font-bold text-slate-800 mb-2">No data quality issues detected!</h3>
                      <p className="text-slate-500 max-w-md">Adjust your filters or run a new scan to detect potential problems.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <th className="p-4">Issue Details</th>
                            <th className="p-4">Module / Record</th>
                            <th className="p-4">Severity</th>
                            <th className="p-4">Detected</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredIssues.map((issue) => (
                            <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="font-semibold text-slate-800">{issue.description}</div>
                                <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                  <span className="font-medium bg-slate-100 px-1.5 rounded text-slate-600">{issue.issue_type}</span>
                                  <span>Field: <code className="bg-slate-100 px-1 rounded">{issue.field}</code></span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-slate-800">{issue.module}</div>
                                <div className="text-xs text-slate-500">ID: {issue.record_id}</div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getSeverityColor(issue.severity)}`}>
                                  {issue.severity}
                                </span>
                              </td>
                              <td className="p-4 text-slate-600">
                                {new Date(issue.detected_at).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => setSelectedIssue(issue)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1 font-medium"
                                >
                                  Review <ChevronRight className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Scan History</h3>
                  <p className="text-sm text-slate-500">History of all data quality scans executed on the system.</p>
                </div>
                {history.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">No quality scan has been completed yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                          <th className="p-4">Scan ID</th>
                          <th className="p-4">Date / Time</th>
                          <th className="p-4">Records</th>
                          <th className="p-4">Issues Found</th>
                          <th className="p-4">Overall Score</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {history.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="p-4 font-medium text-slate-600">#{h.id}</td>
                            <td className="p-4">
                              <div className="font-medium text-slate-800">{new Date(h.started_at).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-500">{new Date(h.started_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="p-4 text-slate-600">{h.records_checked}</td>
                            <td className="p-4">
                              <div className="font-medium">{h.issues_found} Total</div>
                              {h.critical_issues > 0 && <div className="text-xs text-red-600 font-bold">{h.critical_issues} Critical</div>}
                            </td>
                            <td className="p-4 font-bold text-slate-800">{h.overall_score?.toFixed(1)}%</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${h.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ISSUE DETAILS DRAWER/MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Issue Details
              </h2>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-3 ${getSeverityColor(selectedIssue.severity)}`}>
                  {selectedIssue.severity} SEVERITY
                </span>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{selectedIssue.description}</h3>
                <p className="text-sm text-slate-500">Detected on {new Date(selectedIssue.detected_at).toLocaleString()}</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm font-medium">Module</span>
                  <span className="text-slate-800 text-sm font-bold">{selectedIssue.module}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm font-medium">Record ID</span>
                  <span className="text-slate-800 text-sm font-bold">{selectedIssue.record_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm font-medium">Issue Type</span>
                  <span className="text-slate-800 text-sm font-bold">{selectedIssue.issue_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-sm font-medium">Affected Field</span>
                  <code className="text-slate-800 text-xs bg-slate-200 px-2 py-0.5 rounded">{selectedIssue.field}</code>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 text-sm font-medium">Current Value</span>
                  <span className="text-red-600 text-sm font-bold truncate max-w-[200px]" title={selectedIssue.current_value || 'NULL'}>
                    {selectedIssue.current_value || 'NULL'}
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" /> Recommended Action
                </h4>
                <p className="text-sm text-blue-700">
                  Review the {selectedIssue.module.toLowerCase()} record and provide a valid value for the <code className="bg-blue-100 px-1 rounded">{selectedIssue.field}</code> field. 
                  Once corrected, the next Data Quality Scan will automatically mark this issue as resolved.
                </p>
                <div className="mt-4">
                  <a 
                    href={getRecordLink(selectedIssue.module, selectedIssue.record_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Review Original Record <Eye className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            
            {selectedIssue.status === 'OPEN' && (
              <div className="p-6 border-t border-slate-200 bg-white flex gap-3">
                <button 
                  onClick={() => setIgnoreModalOpen(true)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Ignore Issue
                </button>
                <button 
                  onClick={() => handleResolve(selectedIssue.id)}
                  className="flex-1 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-medium transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IGNORE CONFIRMATION MODAL */}
      {ignoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ignore Issue</h3>
            <p className="text-slate-600 text-sm mb-4">Ignoring an issue removes it from the active list. Please provide a reason for the audit log.</p>
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Reason <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                rows={3}
                value={ignoreReason}
                onChange={(e) => setIgnoreReason(e.target.value)}
                placeholder="e.g. This legacy record intentionally lacks this field."
                required
              ></textarea>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIgnoreModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
              <button onClick={handleIgnore} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm">Confirm Ignore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
