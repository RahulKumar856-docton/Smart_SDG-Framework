import React, { useState, useEffect } from 'react';
import { 
  FileText, BarChart2, Users, ClipboardCheck, Camera, Activity, 
  CheckCircle, AlertTriangle, Map, Briefcase, Building, Layers, 
  Search, Filter, RefreshCw, Download, FileSpreadsheet, X, 
  ChevronRight, Calendar, Info, ShieldAlert, FileDigit
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

const REPORT_CATEGORIES = [
  { id: 'comprehensive', title: 'Comprehensive Municipal Report', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-100', desc: 'Executive summary combining all operational modules.', source: 'All Modules' },
  { id: 'project_performance', title: 'Project Performance Report', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Detailed analysis of ongoing and completed projects.', source: 'Projects, Risks, Impact' },
  { id: 'citizen_requests', title: 'Citizen Request Report', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Analytics on incoming civic issues and resolution times.', source: 'Citizen Requests' },
  { id: 'field_inspections', title: 'Field Inspection Report', icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-100', desc: 'Overview of scheduled, completed and verified inspections.', source: 'Inspections, Projects' },
  { id: 'evidence', title: 'Evidence Verification Report', icon: Camera, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Analysis of project evidence media and document verification.', source: 'Project Evidence' },
  { id: 'sdg_performance', title: 'Performance & KPI Report', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-100', desc: 'Metric tracking for SDG achievement targets.', source: 'KPIs, Measurements' },
  { id: 'data_quality', title: 'Data Quality Report', icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100', desc: 'Assessment of system record completeness and validity.', source: 'Data Quality Engine' },
  { id: 'impact_analysis', title: 'Impact Analysis Report', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-100', desc: 'Evaluation of project outcomes on community metrics.', source: 'Impact Engine' },
  { id: 'risk_analysis', title: 'Risk & AI Report', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', desc: 'Advisory risk factors and AI-detected anomalies.', source: 'Risk Engine' },
  { id: 'gis', title: 'GIS / Geographic Report', icon: Map, color: 'text-amber-600', bg: 'bg-amber-100', desc: 'Geospatial coverage of municipal operations.', source: 'Geographic Data' },
  { id: 'officers', title: 'Officer Performance Report', icon: FileDigit, color: 'text-slate-600', bg: 'bg-slate-100', desc: 'Workload and resolution tracking for field officers.', source: 'Officers, Tasks' },
  { id: 'departments', title: 'Department Performance Report', icon: Building, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100', desc: 'Aggregated progress across all municipal departments.', source: 'Departments' },
];

const DATE_RANGES = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'This Year'];

export default function ReportsCenter() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Data State
  const [departments, setDepartments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Configuration Modal
  const [configModal, setConfigModal] = useState<{isOpen: boolean, category: any | null}>({isOpen: false, category: null});
  const [filters, setFilters] = useState({ date_range: 'Last 30 Days', department_id: '', status: '' });
  
  // Preview Modal
  const [previewModal, setPreviewModal] = useState<{isOpen: boolean, data: any | null, loading: boolean}>({isOpen: false, data: null, loading: false});

  useEffect(() => {
    loadBaseData();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadBaseData = async () => {
    try {
      const depts = await adminApi.getDepartments();
      if (depts.success) setDepartments(depts.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReportHistory();
      if (res.success) setHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openConfig = (category: any) => {
    setConfigModal({ isOpen: true, category });
    setFilters({ date_range: 'Last 30 Days', department_id: '', status: '' });
  };

  const handleGeneratePreview = async () => {
    setPreviewModal({ isOpen: true, data: null, loading: true });
    setConfigModal({ ...configModal, isOpen: false });
    
    try {
      const res = await adminApi.previewReport(configModal.category.id, filters);
      if (res.success) {
        setPreviewModal({ isOpen: true, data: res.data, loading: false });
      } else {
        alert(res.message || "Failed to generate preview.");
        setPreviewModal({ isOpen: false, data: null, loading: false });
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while generating the preview.");
      setPreviewModal({ isOpen: false, data: null, loading: false });
    }
  };

  const exportReport = async (format: 'pdf' | 'xlsx' | 'csv') => {
    try {
      // Create a temporary loading toast or indicator here if needed
      const payload = {
        report_type: configModal.category.id,
        title: configModal.category.title,
        format: format,
        filters: filters
      };
      
      const res = await adminApi.generateReport(payload);
      if (res.success) {
        // Automatically download
        window.location.href = adminApi.getReportDownloadUrl(res.data.report_id);
        
        // Close preview
        setPreviewModal({ isOpen: false, data: null, loading: false });
        
        // Switch to history to show it generating/completed
        setActiveTab('history');
      } else {
        alert(res.message || "Failed to generate report.");
      }
    } catch (e) {
      console.error(e);
      alert("Error exporting report.");
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report from history?')) return;
    try {
      const res = await adminApi.deleteReport(id);
      if (res.success) {
        loadHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col justify-between shrink-0 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 text-gray-50 opacity-50">
          <FileText size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="hover:text-gray-900 cursor-pointer">Home</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="hover:text-gray-900 cursor-pointer">Admin</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-gray-900 font-medium">Reports Center</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
            <FileText className="h-7 w-7 mr-3 text-indigo-600" />
            Reports Center
          </h1>
          <p className="text-gray-600 max-w-2xl text-sm">
            Generate, analyze and export official municipal monitoring reports using verified system data.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === 'create'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Report
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Report History
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 mt-6">
        
        {/* CREATE REPORTS TAB */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {REPORT_CATEGORIES.map((cat, idx) => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{cat.title}</h3>
                <p className="text-sm text-gray-500 mb-4 flex-grow">{cat.desc}</p>
                <div className="text-xs text-gray-400 mb-5 flex items-center font-medium bg-gray-50 p-2 rounded border border-gray-100">
                  <Info className="h-3 w-3 mr-1" />
                  Data: {cat.source}
                </div>
                <button 
                  onClick={() => openConfig(cat)}
                  className="w-full py-2.5 px-4 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors flex justify-center items-center"
                >
                  Configure & Generate
                </button>
              </div>
            ))}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Generated Reports Archive</h3>
              <button onClick={loadHistory} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No reports generated yet.</td></tr>
                  ) : history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500">Type: {item.report_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.period || 'All Time'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(item.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">By {item.generated_by_name || 'Admin'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={adminApi.getReportDownloadUrl(item.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">Download</a>
                        <button onClick={() => deleteReport(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Configuration Modal */}
      {configModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <configModal.category.icon className={`h-5 w-5 mr-2 ${configModal.category.color.replace('text-', 'text-')}`} />
                Configure Report
              </h3>
              <button onClick={() => setConfigModal({isOpen: false, category: null})} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded-md shadow-sm pl-10 pr-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    value={filters.date_range}
                    onChange={(e) => setFilters({...filters, date_range: e.target.value})}
                  >
                    {DATE_RANGES.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                  </select>
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Filter (Optional)</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.department_id}
                  onChange={(e) => setFilters({...filters, department_id: e.target.value})}
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter (Optional)</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active / In Progress</option>
                  <option value="Completed">Completed / Resolved</option>
                  <option value="Pending">Pending / Under Review</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded border border-blue-100 flex items-start">
                <Info className="w-5 h-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Generating a preview will query the live database applying the exact filters specified above. Ensure records exist for accurate representations.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setConfigModal({isOpen: false, category: null})}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleGeneratePreview}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Preview Report Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Preview Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-900 text-white shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Report Preview: {configModal.category?.title}
                </h2>
                <p className="text-indigo-200 text-sm mt-1">Verify the data before officially exporting to PDF or Excel.</p>
              </div>
              <button onClick={() => setPreviewModal({isOpen: false, data: null, loading: false})} className="text-indigo-200 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Preview Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
              {previewModal.loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">Crunching database records & compiling report...</p>
                </div>
              ) : previewModal.data ? (
                <div className="bg-white border border-gray-200 shadow-sm p-8 max-w-5xl mx-auto rounded-lg">
                  
                  {/* Report Document Header */}
                  <div className="border-b-2 border-gray-800 pb-6 mb-8 text-center">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{configModal.category?.title}</h1>
                    <h2 className="text-lg text-gray-600 mt-2 font-medium">Municipal Monitor - Official Output</h2>
                    <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500">
                      <span><strong>Date Range:</strong> {filters.date_range}</span>
                      <span><strong>Generated:</strong> {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Data Quality Notice if needed */}
                  {(!previewModal.data.records || previewModal.data.records.length === 0) && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                      <div className="flex items-center">
                        <ShieldAlert className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                          <h4 className="text-yellow-800 font-medium text-lg">Data Quality Warning</h4>
                          <p className="text-yellow-700 text-sm mt-1">No records match the selected filters. Generating an export will produce an empty document.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Section */}
                  {previewModal.data.summary && Object.keys(previewModal.data.summary).length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Executive Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(previewModal.data.summary).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{key}</div>
                            <div className="text-2xl font-bold text-gray-900">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Records Table Preview */}
                  {previewModal.data.records && previewModal.data.records.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Detailed Data Output</h3>
                      <div className="overflow-x-auto rounded border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              {Object.keys(previewModal.data.records[0]).map((header) => (
                                <th key={header} scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider text-xs">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewModal.data.records.slice(0, 10).map((row: any, i: number) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {Object.values(row).map((val: any, j: number) => (
                                  <td key={j} className="px-4 py-3 whitespace-nowrap text-gray-700 truncate max-w-xs">
                                    {val === null || val === undefined ? '-' : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewModal.data.records.length > 10 && (
                        <p className="text-center text-xs text-gray-500 mt-3 italic">
                          Showing first 10 rows. Total rows: {previewModal.data.records.length}. Export to see all records.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Methodology Section */}
                  {previewModal.data.methodology && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">Methodology</h4>
                      <p className="text-sm text-gray-600 leading-relaxed italic border-l-4 border-gray-300 pl-3">
                        {previewModal.data.methodology}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-red-500 mt-10">Error loading data.</div>
              )}
            </div>
            
            {/* Preview Footer / Export Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
              <button 
                onClick={() => setPreviewModal({isOpen: false, data: null, loading: false})}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
              
              {!previewModal.loading && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => exportReport('csv')}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded shadow-sm font-medium flex items-center transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 text-gray-500" /> Export CSV
                  </button>
                  <button 
                    onClick={() => exportReport('xlsx')}
                    className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded shadow-sm font-medium flex items-center transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
                  </button>
                  <button 
                    onClick={() => exportReport('pdf')}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded shadow-sm font-medium flex items-center transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" /> Generate Official PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
