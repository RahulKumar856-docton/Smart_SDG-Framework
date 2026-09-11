import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, ShieldCheck, Loader2 } from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

export default function CitizenProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await citizenApi.getProfile();
        if (res.success) {
          setProfile(res.data);
          setForm({
            full_name: res.data.full_name || '',
            phone: res.data.phone || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await citizenApi.updateProfile(form);
      if (res.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your personal information and contact details.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 p-8 text-white flex items-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30 mr-6 shadow-sm backdrop-blur-sm">
            {profile.full_name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{profile.full_name}</h2>
            <p className="text-teal-100 flex items-center text-sm font-medium">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Authenticated Citizen
            </p>
          </div>
        </div>

        <div className="p-8">
          {message && (
            <div className={`p-4 rounded-lg mb-6 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" /> Full Name
                </label>
                <input 
                  type="text" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" /> Email Address
                </label>
                <input 
                  type="email" disabled value={profile.email}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1.5 ml-1">Email cannot be changed directly.</p>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" /> Phone Number
                </label>
                <input 
                  type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" /> Registration Date
                </label>
                <input 
                  type="text" disabled value={new Date(profile.created_at).toLocaleDateString()}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" disabled={saving}
                className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors flex items-center disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Changes
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
