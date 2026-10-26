import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, Shield, Key, Moon, Sun, Monitor, Eye, 
  Globe, Clock, Smartphone, Mail, AlertTriangle, Check, 
  Save, RotateCcw, LogOut, Trash2, Edit3, X, CheckCircle2,
  Lock, Laptop, MapPin, Sliders, Volume2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';
import axios from 'axios';

export default function CitizenSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Original & Working State
  const [originalData, setOriginalData] = useState<any>(null);
  const [account, setAccount] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    username: '',
    status: 'ACTIVE',
    id: ''
  });

  const [preferences, setPreferences] = useState<any>({
    notif_service_updates: true,
    notif_report_updates: true,
    notif_work_updates: true,
    notif_verification_requests: true,
    notif_messages: true,
    notif_announcements: true,
    channel_email: true,
    channel_push: true,
    profile_visibility: 'PRIVATE',
    location_sharing: 'WHEN_NEEDED',
    report_visibility: 'ANONYMOUS',
    theme: 'SYSTEM',
    reduce_motion: false,
    text_size: 'NORMAL',
    high_contrast: false,
    language: 'en',
    time_format: '12h',
    date_format: 'SYSTEM',
    timezone: 'SYSTEM'
  });

  const [sessions, setSessions] = useState<any[]>([]);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ full_name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: '', confirmation: '' });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Fetch settings from database
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await citizenApi.getSettings();
      if (res.success && res.data) {
        const { account: acc, preferences: prefs, sessions: sess } = res.data;
        setAccount(acc || {});
        setEditProfileForm({ full_name: acc?.full_name || '', phone: acc?.phone || '' });
        
        const mappedPrefs = {
          notif_service_updates: Boolean(prefs?.notif_service_updates),
          notif_report_updates: Boolean(prefs?.notif_report_updates),
          notif_work_updates: Boolean(prefs?.notif_work_updates),
          notif_verification_requests: Boolean(prefs?.notif_verification_requests),
          notif_messages: Boolean(prefs?.notif_messages),
          notif_announcements: Boolean(prefs?.notif_announcements),
          channel_email: Boolean(prefs?.channel_email),
          channel_push: Boolean(prefs?.channel_push),
          profile_visibility: prefs?.profile_visibility || 'PRIVATE',
          location_sharing: prefs?.location_sharing || 'WHEN_NEEDED',
          report_visibility: prefs?.report_visibility || 'ANONYMOUS',
          theme: prefs?.theme || 'SYSTEM',
          reduce_motion: Boolean(prefs?.reduce_motion),
          text_size: prefs?.text_size || 'NORMAL',
          high_contrast: Boolean(prefs?.high_contrast),
          language: prefs?.language || 'en',
          time_format: prefs?.time_format || '12h',
          date_format: prefs?.date_format || 'SYSTEM',
          timezone: prefs?.timezone || 'SYSTEM'
        };

        setPreferences(mappedPrefs);
        setSessions(sess || []);
        setOriginalData({ account: acc, preferences: mappedPrefs });

        // Apply theme and accessibility
        applyAppearanceSettings(mappedPrefs);
      } else {
        setError(res.message || 'Unable to load your settings.');
      }
    } catch (err: any) {
      console.error("Settings load error:", err);
      setError('Unable to connect to the municipal settings service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply Appearance & Accessibility directly to UI
  const applyAppearanceSettings = (prefs: any) => {
    const root = document.documentElement;
    
    // Theme
    if (prefs.theme === 'DARK') {
      root.classList.add('dark');
    } else if (prefs.theme === 'LIGHT') {
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Text Size
    root.setAttribute('data-text-size', prefs.text_size || 'NORMAL');

    // Reduce Motion
    if (prefs.reduce_motion) {
      root.setAttribute('data-reduce-motion', 'true');
    } else {
      root.removeAttribute('data-reduce-motion');
    }
  };

  // Check if dirty (unsaved changes)
  const isDirty = originalData && JSON.stringify(preferences) !== JSON.stringify(originalData.preferences);

  // Toggle helper
  const handleToggle = (key: string) => {
    setPreferences((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      if (['theme', 'text_size', 'reduce_motion'].includes(key)) {
        applyAppearanceSettings(next);
      }
      return next;
    });
  };

  // Select helper
  const handleSelect = (key: string, value: any) => {
    setPreferences((prev: any) => {
      const next = { ...prev, [key]: value };
      if (['theme', 'text_size', 'reduce_motion'].includes(key)) {
        applyAppearanceSettings(next);
      }
      return next;
    });
  };

  // Save All Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await citizenApi.updateSettings(preferences);
      if (res.success) {
        setOriginalData((prev: any) => ({ ...prev, preferences }));
        applyAppearanceSettings(preferences);
        showToast('Settings saved successfully.');
      } else {
        setError(res.message || 'Unable to save settings.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to save your settings.');
    } finally {
      setSaving(false);
    }
  };

  // Discard changes
  const handleDiscard = () => {
    if (originalData) {
      setPreferences(originalData.preferences);
      applyAppearanceSettings(originalData.preferences);
    }
  };

  // Show Toast
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Profile Edit Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await citizenApi.updateProfile(editProfileForm);
      if (res.success) {
        setAccount((prev: any) => ({
          ...prev,
          full_name: editProfileForm.full_name,
          phone: editProfileForm.phone
        }));
        setIsEditProfileOpen(false);
        showToast('Profile updated successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await citizenApi.changePassword(passwordForm);
      if (res.success) {
        setIsPasswordModalOpen(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        showToast('Password changed successfully.');
      } else {
        setPasswordError(res.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Current password is incorrect.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (e) {}
    window.location.href = '/citizen/login';
  };

  // Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (deleteForm.confirmation.toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await citizenApi.deleteAccount(deleteForm);
      if (res.success) {
        window.location.href = '/citizen/login?msg=account_deleted';
      } else {
        setDeleteError(res.message || 'Failed to delete account.');
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Incorrect password.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse"></div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !originalData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load settings</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button 
            onClick={fetchSettings}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center space-x-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">SETTINGS</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account, notifications, privacy, and application preferences.</p>
      </div>

      {/* ========================================================================= */}
      {/* 1. ACCOUNT SECTION                                                        */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Account Information</h2>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-2xl font-extrabold rounded-2xl flex items-center justify-center shadow-md shrink-0">
            {getInitials(account.full_name || account.username)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
              <p className="font-bold text-slate-900">{account.full_name || 'Citizen'}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-slate-800">{account.email || account.username}</p>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Verified</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
              <p className="font-medium text-slate-800">{account.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</span>
              <p className="font-bold text-emerald-600 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>{account.status || 'ACTIVE'}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. NOTIFICATIONS PREFERENCES                                              */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Notification Preferences</h2>
        </div>

        <div className="space-y-4 divide-y divide-slate-100">
          {[
            { key: 'notif_service_updates', title: 'Service Request Updates', desc: 'Updates on stage transitions, assignment, and progress.' },
            { key: 'notif_report_updates', title: 'Report Updates', desc: 'Alerts when your infrastructure reports are investigated or resolved.' },
            { key: 'notif_work_updates', title: 'Work Completion Updates', desc: 'Notices when field teams complete municipal tasks.' },
            { key: 'notif_verification_requests', title: 'Verification Requests', desc: 'Requests for citizen verification after work is completed.' },
            { key: 'notif_messages', title: 'Direct Messages', desc: 'Incoming messages from assigned officers and municipal staff.' },
            { key: 'notif_announcements', title: 'Municipal Announcements', desc: 'City-wide updates, alerts, and sustainable community news.' }
          ].map(item => (
            <div key={item.key} className="pt-4 first:pt-0 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(item.key)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                  preferences[item.key] ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm transform ${
                  preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}

          {/* Mandatory notification notice */}
          <div className="pt-4 flex items-center justify-between opacity-80">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security & Account Alerts</h3>
              <p className="text-xs text-slate-500">Critical security updates and authentication notices.</p>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              Required
            </span>
          </div>
        </div>

        {/* Channels */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Delivery Channels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => handleToggle('channel_email')}
              className={`p-4 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                preferences.channel_email ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500">{preferences.channel_email ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            <div 
              onClick={() => handleToggle('channel_push')}
              className={`p-4 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                preferences.channel_push ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">In-App & Browser Push</p>
                <p className="text-xs text-slate-500">{preferences.channel_push ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PRIVACY CONTROLS                                                       */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Eye className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Privacy Controls</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Profile Visibility</h3>
              <p className="text-xs text-slate-500">Choose who can view your basic community profile.</p>
            </div>
            <select
              value={preferences.profile_visibility}
              onChange={e => handleSelect('profile_visibility', e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRIVATE">Private (Only Municipal Staff)</option>
              <option value="COMMUNITY">Community (Verified Citizens)</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Location Sharing</h3>
              <p className="text-xs text-slate-500">Determine how your geolocation is requested.</p>
            </div>
            <select
              value={preferences.location_sharing}
              onChange={e => handleSelect('location_sharing', e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="WHEN_NEEDED">Only when required for a Request or Report</option>
              <option value="ALWAYS">Always allow location for municipal map</option>
              <option value="NEVER">Never request location automatically</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Public Report Anonymity</h3>
              <p className="text-xs text-slate-500">Hide your personal identity on public SDG issue feeds.</p>
            </div>
            <select
              value={preferences.report_visibility}
              onChange={e => handleSelect('report_visibility', e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="ANONYMOUS">Anonymize My Name on Public Issues</option>
              <option value="PRIVATE">Keep Entirely Private</option>
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECURITY & SESSIONS                                                    */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Security & Authentication</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Key className="w-4 h-4 text-slate-600" />
              <span>Password</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Ensure your account is protected with a secure password.</p>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl transition shadow-sm"
          >
            Change Password
          </button>
        </div>

        {/* Active Sessions */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active Sessions</h3>
          <div className="space-y-2">
            {sessions.map((sess, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <Laptop className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{sess.browser}</span>
                      {sess.is_current && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px]">IP: {sess.ip_address} • Active: {sess.last_active}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. APPEARANCE (THEME)                                                     */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Sun className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Appearance & Theme</h2>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Theme Selection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'SYSTEM', label: 'System Default', icon: Monitor, desc: 'Syncs with your device appearance' },
              { id: 'LIGHT', label: 'Light Mode', icon: Sun, desc: 'Crisp, high-contrast light colors' },
              { id: 'DARK', label: 'Dark Mode', icon: Moon, desc: 'Sleek, low-light dark environment' }
            ].map(t => {
              const Icon = t.icon;
              const isSelected = preferences.theme === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect('theme', t.id)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-3 ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                    {isSelected && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ACCESSIBILITY                                                          */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Accessibility</h2>
        </div>

        <div className="space-y-4">
          {/* Reduce Motion */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reduce Motion</h3>
              <p className="text-xs text-slate-500">Minimize animations and smooth scrolling transitions.</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('reduce_motion')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                preferences.reduce_motion ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm transform ${
                preferences.reduce_motion ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Text Scaling */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Text Display Size</h3>
              <p className="text-xs text-slate-500">Adjust the base font scaling across the citizen dashboard.</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'NORMAL', label: 'Normal' },
                { id: 'LARGE', label: 'Large' },
                { id: 'EXTRA_LARGE', label: 'Extra Large' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect('text_size', opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    preferences.text_size === opt.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">High Contrast Mode</h3>
              <p className="text-xs text-slate-500">Enhance border definition and element outlines.</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('high_contrast')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                preferences.high_contrast ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm transform ${
                preferences.high_contrast ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. REGIONAL & TIME PREFERENCES                                            */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Regional & Localization</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Language</label>
            <select
              value={preferences.language}
              onChange={e => handleSelect('language', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English (Default)</option>
              <option value="es">Español (Spanish)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="fr">Français (French)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Time Format</label>
            <select
              value={preferences.time_format}
              onChange={e => handleSelect('time_format', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="12h">12-hour (e.g. 6:30 PM)</option>
              <option value="24h">24-hour (e.g. 18:30)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Date Format</label>
            <select
              value={preferences.date_format}
              onChange={e => handleSelect('date_format', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="SYSTEM">System Default (e.g. Friday, August 21, 2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 21/08/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/21/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-21)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Timezone</label>
            <div className="px-3.5 py-2.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-between">
              <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">Local</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. ACCOUNT ACTIONS                                                        */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Account Actions</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sign Out</h3>
            <p className="text-xs text-slate-500">Safely terminate your current authenticated session.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-700">Deactivate / Delete Account</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Permanently deactivates your citizen account. Historical service requests and report logs will remain preserved for legal audit compliance.
            </p>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition flex items-center space-x-2 border border-red-200 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STICKY SAVE / DISCARD BAR                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-700 max-w-md w-full justify-between"
          >
            <span className="text-xs font-medium text-slate-200">You have unsaved changes</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow transition flex items-center space-x-1.5"
              >
                {saving ? (
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROFILE                                                       */}
      {/* ========================================================================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Citizen Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.full_name}
                  onChange={e => setEditProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editProfileForm.phone}
                  onChange={e => setEditProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={account.email || account.username}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">Email modifications require administrator verification.</p>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE PASSWORD                                                    */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ACCOUNT                                                     */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-900 text-base flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Delete Citizen Account</span>
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeleteAccount} className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                This action is irreversible. Your account will be deactivated and personal details cleared. Historical municipal reports and requests will remain for regulatory audit.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Enter your password</label>
                <input
                  type="password"
                  required
                  value={deleteForm.password}
                  onChange={e => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={deleteForm.confirmation}
                  onChange={e => setDeleteForm(prev => ({ ...prev, confirmation: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {deletingAccount ? 'Deactivating...' : 'Confirm Deactivation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
