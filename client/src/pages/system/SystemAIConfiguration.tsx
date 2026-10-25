import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Sliders, CheckCircle2, AlertTriangle, Send, RefreshCw, X, Zap } from 'lucide-react';
import axios from 'axios';

export default function SystemAIConfiguration() {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(0.75);
  const [autoRouting, setAutoRouting] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test Classifier State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchAI = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/ai-configuration', { withCredentials: true });
      if (res.data.success) {
        setAiData(res.data.data);
        setThreshold(res.data.data.confidence_threshold || 0.75);
        setAutoRouting(res.data.data.auto_routing_enabled ?? true);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load AI parameters' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAI();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post('/api/system/ai-configuration', {
        confidence_threshold: threshold,
        auto_routing_enabled: autoRouting
      }, { withCredentials: true });
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'AI parameters updated and synchronized.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update AI settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestClassifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      // Send to chatbot test inference endpoint
      const res = await axios.post('/api/chatbot/message', { message: testInput.trim() }, { withCredentials: true });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({ error: 'Inference test failed: ' + (err.response?.data?.message || err.message) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              MACHINE LEARNING ENGINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI Configuration & NLP Model Calibration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Natural Language Processing thresholds, anomaly classifiers, and automated service triage.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>{saving ? 'Updating...' : 'Save AI Parameters'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border border-rose-800 text-rose-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* MODEL TELEMETRY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">MODEL ENGINE</div>
          <div className="text-sm font-bold text-white mt-1">{aiData?.model_name || 'DistilBERT Multi-label'}</div>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{aiData?.version || 'v2.4.1'}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">INFERENCE ACCURACY</div>
          <div className="text-sm font-bold text-emerald-400 mt-1">{aiData?.metrics?.average_accuracy || '94.2%'}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">F1-Score: 0.91</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">INFERENCE LATENCY</div>
          <div className="text-sm font-bold text-cyan-400 mt-1">{aiData?.metrics?.average_latency_ms || 48} ms</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">P99: 110ms</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">PREDICTIONS LOGGED</div>
          <div className="text-sm font-bold text-white mt-1">{aiData?.metrics?.total_predictions ?? 0}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Real DB records</div>
        </div>
      </div>

      {/* PARAMETERS SLIDERS & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Model Calibration Parameters
            </h2>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">Confidence Threshold</label>
              <span className="text-xs font-mono font-bold text-cyan-400">{Math.round(threshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-950 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Issues with category confidence below this value will flag human verification.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer select-none">
              <div>
                <div className="text-xs font-bold text-slate-200">Automated Department Routing</div>
                <div className="text-[11px] text-slate-500">Automatically assign complaints to matching departments upon high confidence.</div>
              </div>
              <input
                type="checkbox"
                checked={autoRouting}
                onChange={(e) => setAutoRouting(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* REAL-TIME TEST INFERENCE CONSOLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live NLP Test Inference
              </h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter sample complaint text to test NLP intent detection, sentiment, and category routing.
            </p>

            <form onSubmit={handleTestClassifier} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="e.g. Major sewage blockage on 4th cross street, water leaking into houses for 2 days..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={testing || !testInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Run NLP Classification Test</span>
              </button>
            </form>

            {testResult && (
              <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">Inference Response:</div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
