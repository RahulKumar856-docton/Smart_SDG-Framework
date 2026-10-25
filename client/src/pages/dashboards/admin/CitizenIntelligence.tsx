import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { BrainCircuit, Layers, AlertCircle, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

export default function CitizenIntelligence() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      const [clusterRes, predRes] = await Promise.all([
        adminApi.getComplaintClusters(),
        adminApi.getPriorityPredictions()
      ]);
      setClusters(clusterRes.data || []);
      setMetrics(clusterRes.metrics || {});
      setPredictions(predRes.data || []);
      setHealth(predRes.health || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-2xl shadow-lg text-white">
          <div className="flex items-center mb-2 text-indigo-100">
            <BrainCircuit className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Prediction Accuracy</h3>
          </div>
          <p className="text-3xl font-black">{health ? (health.accuracy * 100).toFixed(1) : 0}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center mb-2 text-slate-500">
            <BarChart2 className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">F1 Score</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{health ? health.f1_score : 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center mb-2 text-slate-500">
            <Layers className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Active Clusters</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{metrics?.clusters_found || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center mb-2 text-slate-500">
            <ShieldAlert className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Analyzed Complaints</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{metrics?.total_analyzed || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Clustering Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-indigo-500" />
              NLP Complaint Clusters
            </h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[500px] space-y-4">
            {clusters.length === 0 ? (
              <p className="text-slate-500 text-center py-10">No clusters detected.</p>
            ) : (
              clusters.map((cluster, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                      {cluster.cluster_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {cluster.size} complaints
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cluster.keywords.map((kw: string, ki: number) => (
                      <span key={ki} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-slate-700 font-medium">
                    Sample: {cluster.complaints[0]?.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Prediction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-slate-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-indigo-500" />
              Priority Prediction Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                  <th className="p-4">Request</th>
                  <th className="p-4">Actual</th>
                  <th className="p-4">AI Predicted</th>
                  <th className="p-4">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {predictions.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{p.request_code}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{p.title}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-600">{p.actual_priority}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        p.predicted_priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        p.predicted_priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {p.predicted_priority}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.match ? (
                        <span className="text-emerald-500 font-bold">Yes</span>
                      ) : (
                        <span className="text-red-500 font-bold">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
