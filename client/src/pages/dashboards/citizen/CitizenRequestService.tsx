import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, MapPin, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';
import MapLocationPicker from '../../../components/MapLocationPicker';

export default function CitizenRequestService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const categories = [
    'Road Damage', 'Street Lighting', 'Water Supply', 'Waste Management', 
    'Drainage', 'Public Infrastructure', 'Environmental Issue', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const dataToSubmit = { ...form };
      
      const res = await citizenApi.submitRequest(dataToSubmit);
      if (res.success) {
        setSuccess(res.request_id_code);
      } else {
        setError(res.message || 'Failed to submit request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };



  if (success) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Request Submitted Successfully</h2>
          <p className="text-gray-500 mb-6">Your service request has been registered and routed to the appropriate department.</p>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block mb-8">
            <p className="text-sm text-gray-500 mb-1">Request Tracking ID</p>
            <p className="text-xl font-bold font-mono text-gray-900">{success}</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button onClick={() => navigate('/citizen/requests')} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">
              Track Request
            </button>
            <button onClick={() => {setSuccess(null); setForm({title:'', category:'', description:'', location:'', latitude: null, longitude: null});}} className="px-6 py-3 bg-white text-gray-700 border border-gray-300 font-bold rounded-lg hover:bg-gray-50 transition-colors">
              Request Another Service
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Request Municipal Service</h1>
        <p className="text-sm text-gray-500">Provide details about the service required so our team can process it efficiently.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {error && (
          <div className="m-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start border border-red-100">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Request Title <span className="text-red-500">*</span></label>
              <input 
                required type="text" placeholder="e.g. Request for Street Lighting Repair"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map(cat => (
                  <div 
                    key={cat}
                    onClick={() => setForm({...form, category: cat})}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all text-sm font-medium
                      ${form.category === cat ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea 
                required rows={4} placeholder="Please provide specific details about the service needed..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-all bg-gray-50 focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ward / District <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={(form as any).ward || ''} 
                  onChange={e => setForm({...form, ward: e.target.value} as any)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                >
                  <option value="">Select Ward</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(w => <option key={w} value={`Ward ${w}`}>Ward {w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Landmark (Optional)</label>
                <input 
                  type="text" placeholder="e.g. Near Community Hall"
                  value={(form as any).landmark || ''} 
                  onChange={e => setForm({...form, landmark: e.target.value} as any)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <MapLocationPicker 
                onLocationSelect={(lat, lng, address) => {
                  setForm({
                    ...form,
                    location: address,
                    latitude: lat,
                    longitude: lng
                  });
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Evidence (Photo/Document)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer bg-white">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-teal-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">JPG, PNG or PDF (max. 10MB)</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">* Upload functionality simulated for this demo.</p>
            </div>
            
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="button" onClick={() => navigate('/citizen/dashboard')}
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !form.category}
              className="px-8 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : 'Submit Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
