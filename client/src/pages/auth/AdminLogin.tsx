import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, ShieldCheck, Activity, BarChart3, Globe, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLogin() {
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
      const res = await axios.post('/api/auth/login', { 
        username: username.trim(), 
        password: password.trim(), 
        expected_role: 'ADMIN' 
      }, { withCredentials: true });

      if (res.data.success) {
        localStorage.setItem('user_data', JSON.stringify(res.data.data));
        const userRole = (res.data.data?.role || '').toUpperCase();
        if (userRole === 'SUPER_ADMIN') {
          navigate('/system/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid administrator credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
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
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-wider mb-8">
            OPERATIONAL PLATFORM ADMINISTRATION
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Municipal Administration & Operations</h1>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed mb-12">
            Manage municipal service delivery, citizen requests, authorized personnel, communications, and SLA performance indicators across city departments.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center text-slate-300"><ShieldCheck className="w-5 h-5 mr-3 text-teal-400" /> Operational Control</div>
            <div className="flex items-center text-slate-300"><Activity className="w-5 h-5 mr-3 text-teal-400" /> SLA Monitoring</div>
            <div className="flex items-center text-slate-300"><BarChart3 className="w-5 h-5 mr-3 text-teal-400" /> Department KPIs</div>
            <div className="flex items-center text-slate-300"><Globe className="w-5 h-5 mr-3 text-teal-400" /> Service Coordination</div>
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-8 border-t border-slate-700">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-400">
            <span>Goal 6 Clean Water</span>
            <span>Goal 11 Sustainable Cities</span>
            <span>Goal 13 Climate Action</span>
          </div>
          <div className="flex space-x-1 mt-3">
            <div className="h-1 bg-blue-500 rounded-full w-1/3"></div>
            <div className="h-1 bg-orange-500 rounded-full w-1/3"></div>
            <div className="h-1 bg-green-600 rounded-full w-1/3"></div>
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
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-900 text-blue-200 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg border border-blue-800">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Municipal Administrator Portal</h2>
            <p className="text-slate-500 text-xs">Manage municipal operations, services, and field performance.</p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
              <Sparkles className="w-3 h-3 text-blue-500 mr-1" /> Quick Demo Login (Click to fill)
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'password123')}
              className="w-full p-2.5 text-left bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-xs text-slate-800 group-hover:text-blue-800">🛡️ Operational Administrator</div>
                <div className="text-[10px] text-slate-500 font-mono">admin / password123</div>
              </div>
              <span className="text-xs text-blue-600 font-medium">Select</span>
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username or Email</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" 
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white pr-12" 
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-slate-900 hover:underline">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-70"
            >
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
