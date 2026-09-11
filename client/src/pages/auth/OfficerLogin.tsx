import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, AlertCircle, HardHat, FileCheck, Target, Users } from 'lucide-react';

export default function OfficerLogin() {
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
      const res = await axios.post('/api/auth/login', { username, password, expected_role: 'OFFICER' });
      if (res.data.success) {
        navigate('/officer/dashboard');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid officer credentials.');
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
        className="hidden md:flex md:w-1/2 bg-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-teal-800 border border-teal-700 text-teal-300 text-xs font-bold tracking-wider mb-8">
            FIELD OPERATIONS PLATFORM
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Turn Municipal Plans Into Verified Field Action</h1>
          <p className="text-teal-100 text-lg max-w-md leading-relaxed mb-12">
            Access assigned projects, conduct field inspections, update KPIs, upload evidence and respond to citizen requirements directly from the field.
          </p>

          <div className="space-y-6">
            <div className="flex items-center text-teal-50"><Target className="w-6 h-6 mr-4 text-green-400 p-1 bg-teal-800 rounded-lg" /> Project Allocation</div>
            <div className="w-0.5 h-6 bg-teal-700 ml-3"></div>
            <div className="flex items-center text-teal-50"><HardHat className="w-6 h-6 mr-4 text-green-400 p-1 bg-teal-800 rounded-lg" /> Field Inspection</div>
            <div className="w-0.5 h-6 bg-teal-700 ml-3"></div>
            <div className="flex items-center text-teal-50"><FileCheck className="w-6 h-6 mr-4 text-green-400 p-1 bg-teal-800 rounded-lg" /> Evidence Verification</div>
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
            <Users className="w-12 h-12 text-teal-700 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Officer Sign In</h2>
            <p className="text-slate-500">Access your municipal operations workspace.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Official Email / Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" 
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white pr-12" 
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
                <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-600" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-teal-700 hover:underline">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 transition-colors disabled:opacity-70"
            >
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-8">
            <p className="text-slate-600 text-sm mb-3">New municipal officer?</p>
            <Link to="/officer/register" className="inline-block px-6 py-2 border border-teal-200 text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition-colors">
              Create Officer Account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
