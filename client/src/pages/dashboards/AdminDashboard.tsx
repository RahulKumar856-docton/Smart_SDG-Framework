import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle, Database, 
  FolderKanban, RefreshCw, AlertCircle, TrendingUp,
  BrainCircuit, ShieldAlert, Sparkles, Clock
} from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboards/admin', { withCredentials: true });
      setData(res.data.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center">
        <AlertCircle className="w-6 h-6 mr-3" />
        <div>
          <h3 className="font-bold">Unable to load dashboard data</h3>
          <button onClick={fetchData} className="text-sm underline mt-1 font-semibold hover:text-red-800">Retry</button>
        </div>
      </div>
    );
  }

  const { kpis, priority_actions } = data;

  // Mocking extended data that the backend currently might not provide perfectly,
  // but using actual backend metrics where available.
  const citizenService = [
    { label: 'Submitted', count: 12, color: 'bg-slate-200' },
    { label: 'Under Review', count: 5, color: 'bg-yellow-200' },
    { label: 'Assigned', count: 8, color: 'bg-blue-200' },
    { label: 'In Progress', count: 14, color: 'bg-blue-400' },
    { label: 'Resolved', count: 32, color: 'bg-green-500' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Municipal Overview</h1>
          <p className="text-slate-500 max-w-2xl">Monitor project delivery, citizen requirements, project performance and municipal risks.</p>
        </div>
        <div className="flex items-center space-x-4 text-sm mt-4 sm:mt-0">
          <span className="text-slate-500 font-medium">Last updated: {lastUpdated}</span>
          <button onClick={fetchData} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-slate-700 font-semibold transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Priority Alert Banner */}
      {priority_actions && priority_actions.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center">
          <div className="flex items-center text-red-800 mb-2 sm:mb-0">
            <AlertTriangle className="w-6 h-6 mr-3 shrink-0" />
            <span className="font-bold text-lg">Priority Attention Required: {priority_actions.length} projects require review.</span>
          </div>
          <button className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors">Review Priority Actions</button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm text-green-800 flex items-center">
          <CheckCircle className="w-6 h-6 mr-3 shrink-0" />
          <span className="font-bold text-lg">✓ No critical interventions currently identified.</span>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'TOTAL PROJECTS', value: kpis.total_projects || 0, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'ACTIVE PROJECTS', value: kpis.active_projects || 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'COMPLETED', value: kpis.completed_projects || 0, icon: CheckCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'AT RISK', value: kpis.at_risk_projects || 0, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'CITIZEN REQUESTS', value: kpis.total_requests || 0, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'DATA CONFIDENCE', value: `${kpis.data_confidence || 0}%`, icon: Database, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -top-4 w-16 h-16 ${stat.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            <stat.icon className={`w-6 h-6 ${stat.color} mb-3 relative z-10`} />
            <p className="text-3xl font-black text-slate-800 mb-1 relative z-10">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-500 tracking-wider relative z-10">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Sustainable Development Performance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Development Performance</h3>
            <div className="space-y-6">
              {[
                { num: '6', label: 'Clean Water', score: 78, conf: 91, count: 2, color: 'bg-blue-500' },
                { num: '11', label: 'Sustainable Cities', score: 62, conf: 84, count: 1, color: 'bg-orange-500' },
                { num: '13', label: 'Climate Action', score: 45, conf: 72, count: 1, color: 'bg-green-700' },
                { num: '15', label: 'Life on Land', score: 88, conf: 95, count: 1, color: 'bg-green-500' }
              ].map(sdg => (
                <div key={sdg.num} className="group">
                  <div className="flex justify-between text-sm font-bold text-slate-800 mb-1">
                    <span>Goal {sdg.num} <span className="font-medium text-slate-500 text-xs ml-1">({sdg.label})</span></span>
                    <span>{sdg.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${sdg.score}%` }} transition={{ duration: 1 }} className={`h-full ${sdg.color} rounded-full`} />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <span>{sdg.count} Projects</span>
                    <span>Conf: {sdg.conf}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Actions & Project Health */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Project Health</h3>
            <div className="flex space-x-3 text-sm font-medium">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2" /> On Track</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2" /> At Risk</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2" /> Delayed</span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priority_actions.length > 0 ? priority_actions.map((act: any, i: number) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={act.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">At Risk</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{act.project_name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{act.department}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="font-bold text-slate-700 w-8">{act.reported_progress}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full ml-2">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${act.reported_progress}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 font-bold hover:underline">Review</button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No at-risk projects identified.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Citizen Service Overview */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Citizen Service Overview</h3>
          <div className="flex flex-col space-y-4">
            {citizenService.map((cs) => (
              <div key={cs.label} className="flex items-center">
                <div className="w-32 text-sm font-semibold text-slate-600">{cs.label}</div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cs.count / 32) * 100}%` }} className={`h-full ${cs.color} rounded-full`} />
                </div>
                <div className="w-12 text-right font-bold text-slate-800">{cs.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Intelligence & Data Quality */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-sm border border-indigo-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit className="w-24 h-24" /></div>
            <h3 className="font-bold text-lg text-indigo-100 mb-6 flex items-center z-10 relative"><Sparkles className="w-5 h-5 mr-2 text-indigo-400" /> AI Intelligence</h3>
            
            <div className="grid grid-cols-2 gap-4 z-10 relative">
              <div className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm">
                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Delay Predictions</div>
                <div className="text-2xl font-black mb-1">3 <span className="text-sm font-medium opacity-70">Projects</span></div>
                <button className="text-xs text-indigo-300 hover:text-white underline">View Analysis</button>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm">
                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Citizen Concern Signals</div>
                <div className="text-2xl font-black mb-1">High <span className="text-sm font-medium opacity-70">in Ward 4</span></div>
                <button className="text-xs text-indigo-300 hover:text-white underline">View Analysis</button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800">Data Quality & Confidence</h3>
              <button className="text-xs text-blue-600 font-bold hover:underline">How is this calculated?</button>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="276" strokeDashoffset={276 - (276 * (kpis.data_confidence || 85)) / 100} className="text-teal-500" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800">{kpis.data_confidence || 85}%</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Completeness</span>
                  <span className="text-slate-900">92%</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Recency</span>
                  <span className="text-slate-900">88%</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Evidence Coverage</span>
                  <span className="text-slate-900">75%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-6">Recent Activity Timeline</h3>
        <div className="space-y-6">
          <div className="flex relative">
            <div className="w-8 flex flex-col items-center mr-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full relative z-10" />
              <div className="w-0.5 h-full bg-gray-200 absolute top-3" />
            </div>
            <div className="pb-6">
              <p className="text-sm font-bold text-slate-800">Officer updated project <span className="text-blue-600">Urban Drainage Improvement</span></p>
              <p className="text-xs font-medium text-slate-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> 2 hours ago</p>
            </div>
          </div>
          <div className="flex relative">
            <div className="w-8 flex flex-col items-center mr-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full relative z-10" />
              <div className="w-0.5 h-full bg-gray-200 absolute top-3" />
            </div>
            <div className="pb-6">
              <p className="text-sm font-bold text-slate-800">Citizen submitted a high-priority request in <span className="text-slate-600">Ward 4</span></p>
              <p className="text-xs font-medium text-slate-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> 5 hours ago</p>
            </div>
          </div>
          <div className="flex relative">
            <div className="w-8 flex flex-col items-center mr-4">
              <div className="w-3 h-3 bg-green-500 rounded-full relative z-10" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Admin verified field inspection for <span className="text-blue-600">Clean Water Extension Phase 2</span></p>
              <p className="text-xs font-medium text-slate-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> 1 day ago</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
