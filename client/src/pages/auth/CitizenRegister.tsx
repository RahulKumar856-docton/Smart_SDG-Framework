import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe2, ArrowLeft, Eye, EyeOff, CheckCircle, ShieldCheck, Leaf, Droplets, Building2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function CitizenRegister() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    ward: '',
    address: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (pass.length < 10) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Basic frontend validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    
    setStatus('loading');

    try {
      const res = await axios.post('/api/auth/register', {
        full_name: formData.fullName,
        username: formData.email, // using email as username
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'CITIZEN',
        // In a full implementation, ward and address would be saved to a specific citizen_profiles table or extra json field
      });

      if (res.data.success) {
        setStatus('success');
      }
    } catch (err: any) {
      setStatus('error');
      if (!err.response) {
        setErrorMessage('Network error: Unable to reach the server. Please ensure the backend server is running.');
      } else {
        setErrorMessage(err.response?.data?.message || 'An error occurred during registration.');
      }
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Account Created Successfully</h2>
          <p className="text-slate-600 mb-8">Your citizen account is ready. You can now login to report issues and track services.</p>
          <div className="space-y-4">
            <Link to="/citizen/login" className="block w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors">
              Sign In
            </Link>
            <Link to="/" className="block w-full py-3 bg-white text-slate-700 border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* LEFT: VISUAL */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-5/12 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply"></div>
        <div className="absolute top-0 right-0 p-32 opacity-10">
          <Globe2 className="w-96 h-96" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-12 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-2 mb-16">
            <Globe2 className="h-8 w-8 text-accent" />
            <span className="font-bold text-xl tracking-tight">MUNICIPAL MONITOR</span>
          </div>

          <h1 className="text-4xl font-bold mb-6 leading-tight">Join Your Municipal Community</h1>
          <p className="text-lg text-slate-300 mb-12 max-w-md">Create your citizen account to report issues, request municipal services, track progress and participate in sustainable community development.</p>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400"><Droplets className="w-6 h-6"/></div>
              <div><p className="font-bold text-sm tracking-wide text-blue-300">Goal 6</p><p className="text-slate-300 text-sm">Clean Water & Sanitation</p></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400"><Building2 className="w-6 h-6"/></div>
              <div><p className="font-bold text-sm tracking-wide text-orange-300">Goal 11</p><p className="text-slate-300 text-sm">Sustainable Cities & Communities</p></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400"><Globe2 className="w-6 h-6"/></div>
              <div><p className="font-bold text-sm tracking-wide text-green-300">Goal 13</p><p className="text-slate-300 text-sm">Climate Action</p></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-400"><Leaf className="w-6 h-6"/></div>
              <div><p className="font-bold text-sm tracking-wide text-teal-300">Goal 15</p><p className="text-slate-300 text-sm">Life on Land</p></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT: FORM */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32 relative overflow-y-auto"
      >
        <Link to="/" className="lg:hidden flex items-center space-x-2 text-slate-500 hover:text-primary transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> <span>Back to Home</span>
        </Link>

        <div className="w-full max-w-xl mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Citizen Account</h2>
            <p className="text-slate-600">Connect with your municipality.</p>
          </div>

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center border border-red-100">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid md:grid-cols-2 gap-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" placeholder="John Doe" />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" placeholder="john@example.com" />
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" placeholder="+1 (555) 000-0000" />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ward / District *</label>
                <input required type="text" name="ward" value={formData.ward} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" placeholder="Ward 4" />
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" placeholder="123 Main St" />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 pr-10" placeholder="••••••••" minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Strength */}
              {formData.password && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 flex gap-1 h-1.5">
                    <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-gray-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-gray-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-gray-200'} transition-colors duration-300`}></div>
                  </div>
                  <span className={`text-xs font-semibold ${strength.score === 1 ? 'text-red-500' : strength.score === 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
              <input required type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" placeholder="••••••••" minLength={6} />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-start">
              <div className="flex items-center h-5">
                <input required id="terms" name="terms" type="checkbox" checked={formData.terms} onChange={handleInputChange} className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-slate-700">I agree to the Terms of Service and Privacy Policy.</label>
              </div>
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              disabled={status === 'loading' || !formData.terms || !formData.fullName || !formData.email || !formData.password || formData.password !== formData.confirmPassword}
              type="submit" 
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-accent hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</>
              ) : (
                'Create Citizen Account'
              )}
            </motion.button>

          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/citizen/login" className="font-bold text-primary hover:text-blue-800 transition-colors">
              Sign In
            </Link>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
