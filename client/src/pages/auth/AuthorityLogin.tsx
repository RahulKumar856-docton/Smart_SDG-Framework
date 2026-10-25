import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, ShieldCheck, Activity, BarChart3, Globe, AlertCircle } from 'lucide-react';

export default function AuthorityLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { username, password, expected_role: 'ADMIN' });
      if (res.data.success) {
        navigate('/authority/dashboard');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid authority credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* BRANDING PANEL (Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.8 }}
        className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-10 right-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-wider mb-8 uppercase">
            Municipal Monitor Command Center
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Evidence-Based Municipal Decision Making</h1>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed mb-12">
            Monitor municipality-wide operations, review citizen reports, identify delayed work, manage escalations, and verify completion from one central dashboard.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center text-slate-300"><ShieldCheck className="w-5 h-5 mr-3 text-blue-400" /> Operational Oversight</div>
            <div className="flex items-center text-slate-300"><Activity className="w-5 h-5 mr-3 text-blue-400" /> AI Risk Analysis</div>
            <div className="flex items-center text-slate-300"><BarChart3 className="w-5 h-5 mr-3 text-blue-400" /> Escalation Tracking</div>
            <div className="flex items-center text-slate-300"><Globe className="w-5 h-5 mr-3 text-blue-400" /> GIS Intelligence</div>
          </div>
        </div>

      </motion.div>

      {/* LOGIN PANEL (Right) */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Higher Official Sign In</h2>
            <p className="text-slate-500">Access the municipal command center.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username or Email</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white pr-12" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors disabled:opacity-70"
            >
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
