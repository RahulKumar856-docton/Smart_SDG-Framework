import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart2, 
  Activity,
  Cpu,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthorityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [attentionReports, setAttentionReports] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/authority/dashboard', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.metrics);
          setAttentionReports(data.requires_attention);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-medium text-sm tracking-wide">TOTAL REPORTS</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics?.["Total Citizen Reports"] || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <BarChart2 className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-medium text-sm tracking-wide">PENDING REVIEW</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics?.["Pending Review"] || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <Clock className="text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-medium text-sm tracking-wide">ACTIVE WORK</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics?.["Active Work"] || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Activity className="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-medium text-sm tracking-wide">DELAYED</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics?.["Delayed Reports"] || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <AlertTriangle className="mr-3 text-red-500" size={24} />
                Requires Immediate Attention
              </h3>
              <Link to="/authority/reports" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center transition-colors">
                View All <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {attentionReports.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-slate-600" />
                  <p>No critical issues require your attention right now.</p>
                </div>
              ) : (
                attentionReports.map((report: any) => (
                  <div key={report.id} className="group bg-slate-900/50 border border-slate-700/50 hover:border-red-500/50 rounded-xl p-5 flex items-center justify-between transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-12 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-sm font-mono text-slate-400">{report.report_id_code}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-500/20 text-red-400 border border-red-500/20">
                            {report.severity}
                          </span>
                        </div>
                        <h4 className="text-white font-semibold text-lg">{report.category}</h4>
                        <div className="flex items-center text-sm text-slate-400 mt-1">
                          <MapPin size={14} className="mr-1" /> Ward/Location Info
                        </div>
                      </div>
                    </div>
                    <div>
                      <Link to={`/authority/reports/${report.id}`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-medium transition-colors shadow-lg shadow-black/20">
                        Review Case
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-indigo-900/20 to-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="flex items-center mb-6">
              <Cpu className="text-indigo-400 mr-3" size={24} />
              <h3 className="text-lg font-bold text-white">AI Insights</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Risk Prediction</span>
                  <span className="text-xs text-slate-400">81% Confidence</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Roads Department is showing an increasing delay trend over the last 14 days, primarily due to "Material Procurement".
                </p>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <button className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center transition-colors">
                    View Analysis <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-orange-400 tracking-wider uppercase">Hotspot Detected</span>
                  <span className="text-xs text-slate-400">Ward 4</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Multiple recurring water supply complaints detected clustering in Sector B.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
