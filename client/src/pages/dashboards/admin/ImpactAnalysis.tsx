import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { Link } from 'react-router-dom';
import { 
  BarChart2, Activity, Users, CheckCircle, AlertTriangle, 
  MapPin, Clock, Search, Filter, Shield, Target, ArrowUpRight,
  ArrowDownRight, HelpCircle, FileText, ChevronRight, X, Eye
} from 'lucide-react';

export default function ImpactAnalysis() {
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'projects' | 'departments' | 'trends'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail Modal State
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
      const [sumRes, projRes, deptRes] = await Promise.all([
        adminApi.getImpactSummary(),
        adminApi.getImpactProjects(),
        adminApi.getImpactDepartments()
      ]);
      setSummary(sumRes.summary || {});
      setProjects(projRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load impact analysis data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const res = await adminApi.getImpactProjectDetails(id);
      setProjectDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'POSITIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'NEEDS ATTENTION': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NEGATIVE': return 'bg-red-100 text-red-800 border-red-200';
      case 'STABLE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INSUFFICIENT DATA': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };
  
  const getConfidenceColor = (conf: string) => {
    switch(conf?.toUpperCase()) {
      case 'HIGH': return 'text-emerald-600 bg-emerald-50';
      case 'MEDIUM': return 'text-blue-600 bg-blue-50';
      case 'LOW': return 'text-orange-600 bg-orange-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const filteredProjects = projects.filter(p => 
    p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dept_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, desc, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-800">
            {value === null || value === undefined ? '-' : (typeof value === 'number' && title.includes('Rate') ? value.toFixed(1) + '%' : value)}
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-xs text-slate-500">{desc}</p>
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
            <span className="text-slate-800 font-medium">Impact Analysis</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-blue-600" />
            Impact Analysis
          </h1>
          <p className="text-slate-500 mt-1">Measure the real-world performance and outcomes of municipal projects and services using verified operational data.</p>
        </div>
      </div>

      {/* Causality Warning */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-800">
        <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-bold">Methodology Notice: </span>
          Observed changes do not necessarily prove that a project directly caused the outcome. Results should be interpreted alongside external factors and underlying data quality. The system separates Outputs (completion), Outcomes (citizen feedback), and Impact (long-term verified metrics).
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-white h-32 rounded-xl border border-slate-200"></div>)}
        </div>
      ) : summary && Object.keys(summary).length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Projects Analyzed" value={summary.total_analyzed} desc="Total projects actively tracked" icon={Activity} colorClass="bg-blue-50 text-blue-600" />
            <StatCard title="Positive Impact" value={summary.completed} desc="Projects showing positive outcomes" icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600" />
            <StatCard title="Needs Attention" value={summary.at_risk} desc="Projects with negative/at-risk impact" icon={AlertTriangle} colorClass="bg-red-50 text-red-600" />
            <StatCard title="Avg Impact Score" value={summary.avg_impact} desc="Average calculated impact index" icon={Target} colorClass="bg-purple-50 text-purple-600" />
            
            <StatCard title="Citizen Resolution Rate" value={summary.cit_resolution_rate} desc="Avg feedback resolution" icon={Users} colorClass="bg-indigo-50 text-indigo-600" />
            <StatCard title="Inspection Verification" value={summary.ins_verification_rate} desc="Avg inspection verified rate" icon={Shield} colorClass="bg-cyan-50 text-cyan-600" />
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6">
            <button 
              className={`pb-4 font-medium transition-colors relative ${activeTab === 'projects' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('projects')}
            >
              Project Impact Analysis
              {activeTab === 'projects' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
              className={`pb-4 font-medium transition-colors relative ${activeTab === 'departments' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('departments')}
            >
              Department Performance & Impact
              {activeTab === 'departments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
          </div>

          <div className="py-4">
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Search projects..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                          <th className="p-4">Project</th>
                          <th className="p-4 text-center">Output<br/><span className="text-[10px] font-normal">(Progress/Budget)</span></th>
                          <th className="p-4 text-center">Outcome<br/><span className="text-[10px] font-normal">(Citizen/KPI)</span></th>
                          <th className="p-4 text-center">Impact Score</th>
                          <th className="p-4 text-center">Impact Status</th>
                          <th className="p-4 text-center">Confidence</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredProjects.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{p.project_name}</div>
                              <div className="text-xs text-slate-500">{p.dept_name}</div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-medium">{p.progress_percentage}%</div>
                              <div className="text-xs text-slate-500">{p.budget_util?.toFixed(0)}% util</div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-medium">{p.citizen_requests} Req</div>
                              <div className="text-xs text-slate-500">{p.kpi_achievement?.toFixed(0)}% KPI</div>
                            </td>
                            <td className="p-4 text-center font-bold text-slate-800 text-lg">
                              {p.impact_score?.toFixed(1)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(p.impact_status)}`}>
                                {p.impact_status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getConfidenceColor(p.confidence)}`}>
                                {p.confidence}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => setSelectedProjectId(p.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-xs"
                              >
                                View Analysis <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'departments' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                        <th className="p-4">Department</th>
                        <th className="p-4 text-center">Projects</th>
                        <th className="p-4 text-center">Positive Impact</th>
                        <th className="p-4 text-center">At Risk</th>
                        <th className="p-4 text-center">Avg KPI</th>
                        <th className="p-4 text-center">Citizen Res Rate</th>
                        <th className="p-4 text-center">Overall Perf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {departments.map((d: any, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{d.department}</td>
                          <td className="p-4 text-center font-medium">{d.projects}</td>
                          <td className="p-4 text-center text-emerald-600 font-medium">{d.completed}</td>
                          <td className="p-4 text-center text-red-600 font-medium">{d.at_risk}</td>
                          <td className="p-4 text-center font-medium">{d.avg_kpi}%</td>
                          <td className="p-4 text-center font-medium">{d.cit_res}%</td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">
                              {d.overall}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Insufficient data for impact analysis</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            The system requires verified project outcomes, citizen requests, field inspections, and KPI measurements to accurately calculate real-world impact.
          </p>
        </div>
      )}

      {/* PROJECT DETAILS MODAL */}
      {selectedProjectId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex justify-end">
          <div className="bg-slate-50 w-full max-w-3xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {detailsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Activity className="w-10 h-10 animate-spin text-blue-500" />
              </div>
            ) : projectDetails ? (
              <>
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-10">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Target className="w-6 h-6 text-blue-600" /> 
                      Impact Analysis Details
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">{projectDetails.project.name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedProjectId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Executive Impact Status */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor(projectDetails.analysis.impact.status)}`}>
                    <div>
                      <h3 className="font-bold text-lg">Impact Status: {projectDetails.analysis.impact.status}</h3>
                      <p className="text-sm opacity-90 mt-1 flex items-center gap-1">
                        Confidence Level: <span className="font-bold">{projectDetails.analysis.impact.confidence.level}</span>
                        ({projectDetails.analysis.impact.confidence.score.toFixed(0)}/100)
                      </p>
                    </div>
                    <div className="text-4xl font-black opacity-80">
                      {projectDetails.analysis.impact.score.toFixed(1)}
                    </div>
                  </div>

                  {projectDetails.analysis.impact.confidence.level === 'Low' && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm flex gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-bold">Impact confidence is limited by data quality. </span> 
                        The system lacks sufficient verifiable baseline or outcome data to establish strong causality.
                        <div className="mt-2">
                          <Link to="/admin/data-quality" className="underline font-medium hover:text-orange-900">Review Data Quality</Link>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OUTPUTS */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                      <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 text-sm">OUTPUT METRICS (Activity)</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Reported Progress</span>
                          <span className="font-bold">{projectDetails.analysis.output.reported_progress}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            Verified Progress 
                            {projectDetails.analysis.verification.available && (
                              projectDetails.analysis.output.verified_progress < projectDetails.analysis.output.reported_progress ? (
                                <span title="Discrepancy detected"><AlertTriangle className="w-3 h-3 text-orange-500" /></span>
                              ) : (
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                              )
                            )}
                          </span>
                          <span className="font-bold">{projectDetails.analysis.output.verified_progress}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Budget Utilization</span>
                          <span className="font-bold">{projectDetails.analysis.output.budget_utilization.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* OUTCOMES */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                      <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 text-sm">OUTCOME METRICS (Citizen Experience)</h4>
                      {projectDetails.analysis.outcome.available ? (
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Resolution Rate</span>
                            <span className="font-bold">{projectDetails.analysis.outcome.resolution_rate.toFixed(1)}%</span>
                          </div>
                          
                          {projectDetails.analysis.outcome.before_count > 0 ? (
                            <div className="pt-2 mt-2 border-t border-slate-100">
                              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Before vs After Activity</p>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-500">Baseline Requests</span>
                                <span className="font-bold">{projectDetails.analysis.outcome.before_count}</span>
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-500">Recent Requests</span>
                                <span className="font-bold">{projectDetails.analysis.outcome.after_count}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-800 font-medium">Observed Change</span>
                                <span className={`font-bold flex items-center gap-1 ${
                                  projectDetails.analysis.outcome.direction === 'Improved' ? 'text-emerald-600' :
                                  projectDetails.analysis.outcome.direction === 'Negative' ? 'text-red-600' : 'text-slate-600'
                                }`}>
                                  {projectDetails.analysis.outcome.volume_change > 0 ? '+' : ''}{projectDetails.analysis.outcome.volume_change.toFixed(1)}%
                                  {projectDetails.analysis.outcome.direction === 'Improved' ? <ArrowDownRight className="w-4 h-4" /> :
                                   projectDetails.analysis.outcome.direction === 'Negative' ? <ArrowUpRight className="w-4 h-4" /> : null}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 py-2 italic text-xs">Insufficient baseline data for comparison</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-6 italic text-sm">Outcome data unavailable.</div>
                      )}
                    </div>
                  </div>

                  {/* Impact Indicators */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 text-sm">IMPACT INDICATORS (Verifiable Results)</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="bg-white p-2 rounded shadow-sm border border-slate-200">
                          <BarChart2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-800 text-sm">KPI Achievement</span>
                            <span className="font-bold text-blue-600 text-sm">{projectDetails.analysis.kpis.overall_achievement.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Based on {projectDetails.analysis.kpis.count} active KPIs</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="bg-white p-2 rounded shadow-sm border border-slate-200">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-800 text-sm">Inspection Verification Rate</span>
                            <span className="font-bold text-emerald-600 text-sm">
                              {projectDetails.analysis.verification.available 
                                ? `${projectDetails.analysis.verification.verification_rate.toFixed(1)}%`
                                : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {projectDetails.analysis.verification.available 
                              ? `${projectDetails.analysis.verification.verified_inspections} of ${projectDetails.analysis.verification.total_inspections} inspections verified`
                              : 'No field inspections conducted'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="bg-white p-2 rounded shadow-sm border border-slate-200">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-800 text-sm">Evidence Logged</span>
                            <span className="font-bold text-purple-600 text-sm">
                              {projectDetails.analysis.verification.available ? projectDetails.analysis.verification.evidence_count : 0} items
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Uploaded documentation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                
                <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
                  <a 
                    href={`/admin/projects/${projectDetails.project.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Original Project <Eye className="w-4 h-4" />
                  </a>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
