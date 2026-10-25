import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, Send, Loader2, Upload, X, ChevronRight, ChevronLeft, Check, Camera, FileText } from 'lucide-react';
import axios from 'axios';
import MapLocationPicker from '../../../components/MapLocationPicker';

export default function CitizenReportIssue() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    ward: '',
    landmark: '',
    severity: 'MEDIUM'
  });

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Pothole / Road Damage',
    'Streetlight Broken',
    'Water Leak / Burst Pipe',
    'Illegal Dumping',
    'Vandalism / Graffiti',
    'Drainage / Flooding',
    'Other Infrastructure Issue'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles = newFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (evidenceFiles.length + validFiles.length > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    setError('');
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!formData.category || !formData.title || !formData.description)) {
      setError('Please fill in all required fields.');
      return;
    }
    if (step === 2 && (!formData.ward)) {
      setError('Please select a ward.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') submitData.append(key, value.toString());
      });
      
      evidenceFiles.forEach(file => {
        submitData.append('evidence', file);
      });

      const res = await axios.post('/api/citizen/reports', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        navigate('/citizen/reports');
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Description', icon: FileText },
    { num: 2, title: 'Location', icon: MapPin },
    { num: 3, title: 'Evidence', icon: Camera },
    { num: 4, title: 'Review', icon: Check }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a Civic Issue</h1>
        <p className="text-slate-500">Provide details to help authorities identify and resolve the problem.</p>
      </div>

      {/* STEPPER */}
      <div className="mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500 rounded-full" 
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>
        
        <div className="relative z-10 flex justify-between">
          {steps.map((s, i) => {
            const isActive = step === s.num;
            const isPassed = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors duration-300 ${isActive ? 'bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-200' : isPassed ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {isPassed ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs font-bold mt-2 uppercase tracking-widest ${isActive ? 'text-blue-700' : isPassed ? 'text-slate-700' : 'text-slate-400'}`}>{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center animate-in fade-in">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> {error}
            </div>
          )}

          {/* STEP 1: Description */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Issue Category <span className="text-red-500">*</span></label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Short Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Large pothole on Main St" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description <span className="text-red-500">*</span></label>
                <textarea rows={5} placeholder="Describe the issue, how long it has been there, and any impact it is causing..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ward <span className="text-red-500">*</span></label>
                  <select value={formData.ward} onChange={e => setFormData({...formData, ward: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none">
                    <option value="">Select Ward</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(w => <option key={w} value={`Ward ${w}`}>Ward {w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Landmark (Optional)</label>
                  <input type="text" placeholder="e.g. Near Central Bus Stand" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Pinpoint Location on Map</label>
                <div className="h-[400px] border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <MapLocationPicker onLocationSelect={(lat, lng, address) => setFormData({...formData, location: address, latitude: lat, longitude: lng})} />
                </div>
                {formData.location && <p className="mt-2 text-sm text-slate-600 font-medium">Selected: {formData.location}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: Evidence */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start">
                <Camera className="w-5 h-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">Clear photos help municipal officers understand the issue better and can lead to faster resolution. You can upload up to 5 images.</p>
              </div>

              {evidenceFiles.length < 5 && (
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer bg-white"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files)); }}
                >
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                  <p className="text-base font-bold text-blue-600 mb-2">Click to Upload Photos</p>
                  <p className="text-sm text-slate-500 mb-2">or drag and drop images here</p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">JPG, PNG, WEBP • Max 5MB</p>
                  <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
              )}
              
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  {previewUrls.map((url, idx) => (
                    <div key={url} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square shadow-sm">
                      <img src={url} alt="preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeFile(idx)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 hover:scale-110 transition-all shadow-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Details</h3>
                    <p className="text-lg font-bold text-slate-900">{formData.title}</p>
                    <p className="text-sm font-semibold text-blue-600">{formData.category}</p>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">{formData.description}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</h3>
                    <p className="font-semibold text-slate-800">{formData.ward}</p>
                    {formData.landmark && <p className="text-sm text-slate-600">Landmark: {formData.landmark}</p>}
                    {formData.location && <p className="text-sm text-slate-500 mt-1 flex items-start"><MapPin className="w-4 h-4 mr-1 shrink-0 mt-0.5" /> {formData.location}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Evidence</h3>
                  {previewUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm"><img src={url} className="w-full h-full object-cover"/></div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
                      <p className="text-sm text-slate-500 font-medium">No photos uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between items-center">
            {step > 1 ? (
              <button type="button" onClick={handleBack} disabled={loading} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors flex items-center">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button type="button" onClick={handleNext} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center shadow-lg shadow-slate-900/20">
                Next Step <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5 mr-2" /> Submit Final Report</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
