import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  User, Mail, Phone, ShieldCheck, Briefcase, 
  MapPin, Clock, Save, X, Lock, CheckCircle2, AlertCircle, Building2,
  FolderKanban, Target, Activity, FileCheck, ClipboardList, AlertTriangle
} from 'lucide-react';

export default function OfficerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [pwdStatus, setPwdStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/officer/profile');
      const data = res.data.data;
      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || ''
      });
      setError('');
    } catch (err: any) {
      if (err.response?.status === 401) window.location.href = '/officer/login';
      setError('Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      await axios.put('/api/officer/profile', editForm);
      setSaveStatus({ type: 'success', msg: 'Profile updated successfully.' });
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    } catch (err: any) {
      setSaveStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPwdStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    
    try {
      await axios.post('/api/officer/profile/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPwdStatus({ type: 'success', msg: 'Password changed successfully.' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPwdStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to change password.' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <div className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
            <div className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>
          </div>
          <div className="h-96 bg-slate-200 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
        <button onClick={fetchProfile} className="px-6 py-2 bg-slate-900 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      
      {/* HEADER HERO */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-blue-500"></div>
        
        <div className="w-24 h-24 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-3xl font-black shrink-0 border-4 border-white shadow-md">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-900 mb-1">{profile.full_name}</h1>
          <p className="text-slate-500 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-teal-600" />
            {profile.designation || 'Municipal Officer'}
            <span className="mx-2 text-slate-300">|</span>
            <Building2 className="w-5 h-5 text-blue-600" />
            {profile.department_name || 'No Department'}
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${
              profile.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 
              profile.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {profile.status === 'ACTIVE' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              {profile.status === 'PENDING' && <Clock className="w-3.5 h-3.5 mr-1" />}
              {profile.status}
            </span>
            {profile.employee_id && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                ID: {profile.employee_id}
              </span>
            )}
          </div>
        </div>
        
        <div className="shrink-0 text-center bg-slate-50 rounded-2xl p-4 border border-slate-100 min-w-[150px]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MEMBER SINCE</p>
          <p className="text-lg font-black text-slate-800">
            {new Date(profile.created_at).getFullYear()}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: FORMS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PERSONAL INFO */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <User className="w-5 h-5 mr-2 text-teal-600" />
                Personal Information
              </h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-teal-600 hover:text-teal-800 transition-colors">
                  Edit Profile
                </button>
              ) : (
                <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </button>
              )}
            </div>
            
            <div className="p-6">
              {saveStatus && (
                <div className={`p-4 rounded-xl mb-6 flex items-center ${saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {saveStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                  {saveStatus.msg}
                </div>
              )}
              
              <form onSubmit={handleProfileSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={isEditing ? editForm.full_name : profile.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-70 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                    <input 
                      type="text" 
                      value={profile.username}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 opacity-70 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Official Email</label>
                    <input 
                      type="email" 
                      value={isEditing ? editForm.email : profile.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-70 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                    <input 
                      type="tel" 
                      value={isEditing ? editForm.phone : profile.phone || ''}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-70 font-medium"
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <div className="mt-8 flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors flex items-center">
                      <Save className="w-5 h-5 mr-2" /> Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </motion.div>

          {/* SECURITY */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-slate-600" />
                Security
              </h2>
            </div>
            
            <div className="p-6">
              {pwdStatus && (
                <div className={`p-4 rounded-xl mb-6 flex items-center ${pwdStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {pwdStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                  {pwdStatus.msg}
                </div>
              )}
              
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Current Password *</label>
                  <input 
                    type="password" 
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    className="w-full md:w-2/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">New Password *</label>
                    <input 
                      type="password" 
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password *</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

        </div>
        
        {/* RIGHT COL: STATS & OFFICIAL */}
        <div className="space-y-8">
          
          {/* PROFESSIONAL INFO */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Professional Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400">Employee ID</p>
                <p className="font-bold text-slate-800">{profile.employee_id || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Department</p>
                <p className="font-bold text-slate-800">{profile.department_name || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Designation</p>
                <p className="font-bold text-slate-800">{profile.designation || 'Municipal Officer'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Account Status</p>
                <p className={`font-bold ${profile.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'}`}>
                  {profile.status}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Registration Date</p>
                <p className="font-medium text-slate-700">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </motion.div>

          {/* WORK SUMMARY */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-900 rounded-2xl shadow-md border border-slate-800 p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full blur-[80px] opacity-20"></div>
            
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-6 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" />
              My Work Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Link to="/officer/projects" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors group">
                <FolderKanban className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black">{profile.stats?.assigned_projects || 0}</p>
                <p className="text-xs font-bold text-slate-400">Assigned Projects</p>
              </Link>
              
              <Link to="/officer/requests" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors group">
                <Activity className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black">{profile.stats?.citizen_requests || 0}</p>
                <p className="text-xs font-bold text-slate-400">Citizen Requests</p>
              </Link>
              
              <Link to="/officer/inspections" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors group">
                <MapPin className="w-5 h-5 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black">{profile.stats?.inspections || 0}</p>
                <p className="text-xs font-bold text-slate-400">Field Inspections</p>
              </Link>
              
              <Link to="/officer/kpis" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors group">
                <Target className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black">{profile.stats?.kpi_updates || 0}</p>
                <p className="text-xs font-bold text-slate-400">KPI Updates</p>
              </Link>
              
              <Link to="/officer/evidence" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors group">
                <FileCheck className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black">{profile.stats?.evidence || 0}</p>
                <p className="text-xs font-bold text-slate-400">Evidence Files</p>
              </Link>
              
              <Link to="/officer/reports" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors group">
                <ClipboardList className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black">{profile.stats?.reports || 0}</p>
                <p className="text-xs font-bold text-slate-400">Reports</p>
              </Link>
              
              <Link to="/officer/risk" className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-red-900/50 transition-colors group col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <AlertTriangle className="w-5 h-5 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-400">Active Risk Alerts</p>
                  </div>
                  <p className="text-3xl font-black text-red-400">{profile.stats?.risks || 0}</p>
                </div>
              </Link>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
