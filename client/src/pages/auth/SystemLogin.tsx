import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, ShieldAlert, Lock, Cpu, Database, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function SystemLogin() {
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
      // Use dedicated root system-login endpoint that strictly rejects non-SuperAdmins
      const res = await axios.post('/api/auth/system-login', { 
        username: username.trim(), 
        password: password.trim() 
      }, { withCredentials: true });

      if (res.data.success) {
        localStorage.setItem('user_data', JSON.stringify(res.data.data));
        navigate('/system/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('ACCESS VIOLATION: This console is strictly reserved for Platform Super Administrators. Security event recorded.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Authentication failed. Invalid system credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('superadmin');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* BRANDING PANEL (Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -40 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.7 }}
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600 rounded-full filter blur-[100px]"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Citizen Portal
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider mb-6">
            <Lock className="w-3.5 h-3.5" /> ROOT SYSTEM ACCESS
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            Platform Core Administration
          </h1>
          
          <p className="text-slate-400 text-base max-w-md leading-relaxed mb-10">
            Authoritative control panel for platform security, access control matrices, AI model telemetry, audit immutability, and municipal infrastructure.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Administrator Account Governance</div>
                <div className="text-[11px] text-slate-400">Enforce RBAC policies & provision platform admins</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">AI Engine & SLA Configuration</div>
                <div className="text-[11px] text-slate-400">Configure NLP models, classification thresholds & breach alerts</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Zero-Trust Audit & Telemetry</div>
                <div className="text-[11px] text-slate-400">Immutable system-wide audit logging & intrusion monitoring</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>SEC-GATEWAY: V2.4.0</span>
          <span>HOST: MUNICIPAL-SEC-NODE-01</span>
        </div>
      </motion.div>

      {/* LOGIN PANEL (Right) */}
      <motion.div 
        initial={{ opacity: 0, x: 40 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.7 }}
        className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-950"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-indigo-500/20 text-amber-400 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-amber-500/30 shadow-xl shadow-amber-500/5">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Super Administrator Console</h2>
            <p className="text-slate-400 text-xs">Enter root credentials to initialize administrative session.</p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mb-6 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><KeyRound className="w-3 h-3" /> Quick Demo Root Access</span>
              <span className="text-[10px] font-mono text-slate-500">Authorized Root</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full p-2.5 text-left bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-lg transition-all group flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-xs text-slate-200 group-hover:text-amber-300">👑 Root Super Administrator</div>
                <div className="text-[11px] text-slate-500 font-mono">superadmin / password123</div>
              </div>
              <span className="text-xs text-amber-400 font-medium">Use Key</span>
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-6 p-4 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-medium flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">System Username / UID</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="superadmin"
                className="w-full px-4 py-3 rounded-xl border border-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-slate-900 text-white placeholder-slate-600 text-sm font-mono" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Master Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-slate-900 text-white placeholder-slate-600 pr-12 text-sm font-mono" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/10 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-amber-400 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying Root Credentials...</> : 'Authenticate System Access'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-slate-900 pt-6">
            <Link to="/admin/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Operational Administrator? Switch to Operational Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
