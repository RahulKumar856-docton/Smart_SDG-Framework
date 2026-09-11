import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe2, ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function CitizenLogin() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '', // email is the username
    password: '',
    remember: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatus('loading');

    try {
      const res = await axios.post('/api/auth/login', {
        username: formData.username,
        password: formData.password,
        expected_role: 'CITIZEN'
      });

      if (res.data.success) {
        navigate('/citizen');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* LEFT: VISUAL */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-5/12 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/50 to-blue-900/50 mix-blend-multiply"></div>
        
        <div className="absolute bottom-0 left-0 p-32 opacity-10 transform -translate-x-1/4 translate-y-1/4">
          <Globe2 className="w-96 h-96" />
        </div>

        <div className="relative z-10 h-full flex flex-col">
          <Link to="/" className="flex items-center space-x-2 text-teal-100 hover:text-white transition-colors mb-12 text-sm font-medium w-max">
            <ArrowLeft className="w-4 h-4" /> <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-2 mb-16">
            <Globe2 className="h-8 w-8 text-accent" />
            <span className="font-bold text-xl tracking-tight">MUNICIPAL MONITOR</span>
          </div>

          <div className="mt-auto">
            <h1 className="text-4xl font-bold mb-6 leading-tight">Welcome to Your<br/>Municipal Portal</h1>
            <p className="text-lg text-slate-300 max-w-md">Report issues, track services and stay connected with your community's sustainable development.</p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT: FORM */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32 relative overflow-y-auto bg-slate-50 lg:bg-white"
      >
        <Link to="/" className="lg:hidden flex items-center space-x-2 text-slate-500 hover:text-primary transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> <span>Back to Home</span>
        </Link>

        <div className="w-full max-w-md mx-auto bg-white p-8 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border border-gray-100 lg:border-transparent">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Citizen Sign In</h2>
            <p className="text-slate-600">Access your municipal dashboard.</p>
          </div>

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center border border-red-100">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input required type="email" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-slate-900" placeholder="citizen@example.com" />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-accent hover:text-teal-700 transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-slate-900 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center">
              <input id="remember" name="remember" type="checkbox" checked={formData.remember} onChange={handleInputChange} className="w-4 h-4 text-accent bg-white border-gray-300 rounded focus:ring-accent" />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">
                Remember me
              </label>
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              disabled={status === 'loading' || !formData.username || !formData.password}
              type="submit" 
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-accent hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </motion.button>

          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/citizen/register" className="font-bold text-accent hover:text-teal-700 transition-colors">
              Create Citizen Account
            </Link>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
