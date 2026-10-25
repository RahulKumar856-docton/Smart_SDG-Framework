import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, TrendingUp, Activity, 
  Search, Info, ChevronRight, X, BrainCircuit, Users 
} from 'lucide-react';
import CitizenIntelligence from './CitizenIntelligence';

export default function RiskAI() {
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PROJECT_RISK' | 'CITIZEN_INTELLIGENCE'>('PROJECT_RISK');
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, projRes] = await Promise.all([
        adminApi.getRiskSummary(),
        adminApi.getRiskProjects()
      ]);
      setSummary(sumRes.summary || {});
      setProjects(projRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load Risk AI data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const res = await adminApi.getRiskProjectDetails(id);
      setProjectDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredProjects = projects.filter(p => 
    p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dept_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
            Risk AI Engine
          </h1>
        <p className="text-slate-500">Machine learning powered risk & delay predictions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('PROJECT_RISK')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === 'PROJECT_RISK' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 mr-2" />
          Project Risk Engine
        </button>
        <button
          onClick={() => setActiveTab('CITIZEN_INTELLIGENCE')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === 'CITIZEN_INTELLIGENCE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Citizen AI Intelligence
        </button>
      </div>

      {activeTab === 'PROJECT_RISK' ? (
        <>
          {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Analyzed Projects</p>
            <p className="text-3xl font-bold text-slate-800">{summary?.total_analyzed || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">High Risk</p>
            <p className="text-3xl font-bold text-slate-800">{summary?.high_risk || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Medium Risk</p>
            <p className="text-3xl font-bold text-slate-800">{summary?.medium_risk || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Low Risk</p>
            <p className="text-3xl font-bold text-slate-800">{summary?.low_risk || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4">Project</th>
                <th className="p-4">Overall Risk</th>
                <th className="p-4">ML Delay Probability</th>
                <th className="p-4">Status & Progress</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{p.project_name}</p>
                    <p className="text-xs text-slate-500">{p.dept_name || 'No Dept'}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(p.risk_profile?.overall)}`}>
                      {p.risk_profile?.overall || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-4">
                    {p.delay_prediction ? (
                      <div className="flex items-center">
                        <TrendingUp className={`w-4 h-4 mr-1.5 ${p.delay_prediction.delay_probability > 50 ? 'text-red-500' : 'text-emerald-500'}`} />
                        <span className="font-medium text-slate-700">{p.delay_prediction.delay_probability}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700">{p.status}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${p.progress_percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{p.progress_percentage || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedProjectId(p.id)}
                      className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No projects found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-800">Risk Analysis Report</h2>
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {detailsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : projectDetails ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{projectDetails.project.project_name}</h3>
                    <p className="text-slate-500">{projectDetails.project.dept_name}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ML Prediction */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="font-semibold text-slate-800 flex items-center mb-4">
                        <BrainCircuit className="w-5 h-5 mr-2 text-indigo-500" />
                        ML Delay Prediction
                      </h4>
                      
                      {projectDetails.delay_prediction ? (
                        <>
                          <div className="flex items-end mb-4">
                            <span className="text-4xl font-bold text-slate-800">
                              {projectDetails.delay_prediction.delay_probability}%
                            </span>
                            <span className="text-slate-500 ml-2 mb-1 text-sm">probability</span>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Risk Factors (ML Model)</p>
                            <ul className="space-y-1">
                              {projectDetails.delay_prediction.contributing_factors.map((f: string, i: number) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 mr-2 flex-shrink-0"></span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm">Not enough data for ML prediction on this project.</p>
                      )}
                    </div>

                    {/* Rule Based Engine */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="font-semibold text-slate-800 flex items-center mb-4">
                        <ShieldAlert className="w-5 h-5 mr-2 text-orange-500" />
                        Intelligent Risk Engine
                      </h4>
                      
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(projectDetails.risk_profile?.overall)}`}>
                          Overall: {projectDetails.risk_profile?.overall} RISK
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation Reasons</p>
                        <ul className="space-y-2">
                          {projectDetails.risk_profile?.reasons.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 shadow-sm flex items-start">
                               <Info className="w-4 h-4 text-slate-400 mt-0.5 mr-2 flex-shrink-0" />
                               {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Categorical Breakdown */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Risk Dimension Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { key: 'progress_risk', label: 'Progress' },
                        { key: 'budget_risk', label: 'Budget' },
                        { key: 'kpi_risk', label: 'KPI/SDG' },
                        { key: 'data_risk', label: 'Data Quality' },
                        { key: 'deadline_risk', label: 'Deadline' }
                      ].map(dim => (
                        <div key={dim.key} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500 mb-1">{dim.label}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(projectDetails.risk_profile[dim.key])}`}>
                            {projectDetails.risk_profile[dim.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Failed to load details.</p>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <CitizenIntelligence />
      )}
    </div>
  );
}
