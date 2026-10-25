import React, { useEffect, useState } from 'react';
import { Brain, AlertCircle, TrendingUp, Copy, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function AuthorityAIInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/authority/ai-insights')
      .then(res => {
        if (res.data.success) setInsights(res.data.data);
      })
      .catch(() => setInsights(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center">
          <Brain className="w-8 h-8 mr-3 text-purple-600" />
          AI Municipal Intelligence
        </h1>
        <p className="text-slate-500">AI-assisted insights for municipal accountability and operational decision-making.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Reports Analyzed</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{insights?.analyzed || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm">
          <p className="text-xs font-bold text-purple-500 uppercase">Delay Predictions</p>
          <p className="text-3xl font-black text-purple-700 mt-1">{insights?.predicted_delays || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase">High Risk Reports</p>
          <p className="text-3xl font-black text-rose-700 mt-1">{insights?.high_risk || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase">Duplicates Detected</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{insights?.duplicates || 0}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Processing AI insights...</div>
      ) : !insights ? (
        <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-slate-300 text-center max-w-2xl mx-auto">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">AI analysis is temporarily unavailable.</h3>
          <p className="text-slate-500">The intelligence service could not be reached. Manual review is recommended. The rest of the workflow must continue.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
            <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-500" /> DELAY RISK PREDICTION
            </h2>
            <div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-800">
              Not enough historical data for robust root-cause analysis on delays.
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
              <Copy className="w-5 h-5 mr-2 text-blue-500" /> DUPLICATE DETECTION
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              No new duplicate report candidates found in the current dataset.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
