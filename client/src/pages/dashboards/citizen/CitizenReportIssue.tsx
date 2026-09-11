import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Camera, MapPin, Send, Loader2, Upload, X } from 'lucide-react';
import axios from 'axios';
import MapLocationPicker from '../../../components/MapLocationPicker';

export default function CitizenReportIssue() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
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
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles = newFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, and WEBP are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (evidenceFiles.length + validFiles.length > 5) {
      setError('Maximum 5 images can be uploaded.');
      return;
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    const newUrls = validFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    setError('');
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.title || !formData.description) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const submitData = new FormData();
      submitData.append('category', formData.category);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('location', formData.location);
      if (formData.latitude) submitData.append('latitude', formData.latitude.toString());
      if (formData.longitude) submitData.append('longitude', formData.longitude.toString());
      submitData.append('severity', formData.severity);
      
      evidenceFiles.forEach(file => {
        submitData.append('evidence', file);
      });

      const res = await axios.post('http://localhost:5000/api/citizen/reports', submitData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        // Cleanup URLs
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

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
        <p className="text-gray-600">Help us maintain our community by reporting infrastructure problems, damages, or hazards.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r text-sm font-medium flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Issue Category <span className="text-red-500">*</span></label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Short Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Large pothole on Main St"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Detailed Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue in detail..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2 border-t border-b border-gray-100 py-6 my-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-700">Evidence / Photos</label>
                  <span className="text-xs text-gray-500">Maximum 5 images</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Upload photos that help municipal officers understand and verify the issue.</p>
                
                {evidenceFiles.length < 5 && (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer bg-white"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-red-600 mb-1">+ Upload Photos</p>
                    <p className="text-xs text-gray-500 mb-2">or Drag and drop images here</p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP (Max 5MB each)</p>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/jpeg, image/png, image/webp" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </div>
                )}
                
                {previewUrls.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {previewUrls.map((url, idx) => (
                      <div key={url} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 shrink-0">
                            <img src={url} alt="preview" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 truncate max-w-[150px] sm:max-w-[300px]">
                              {evidenceFiles[idx].name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(evidenceFiles[idx].size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2 border-t border-gray-100 py-6 mt-4">
                <MapLocationPicker 
                  onLocationSelect={(lat, lng, address) => {
                    setFormData({
                      ...formData,
                      location: address,
                      latitude: lat,
                      longitude: lng
                    });
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-bold text-gray-700">Severity Level</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: e.target.value})}
                >
                  <option value="LOW">Low - Minor issue</option>
                  <option value="MEDIUM">Medium - Needs attention</option>
                  <option value="HIGH">High - Causing disruption</option>
                  <option value="CRITICAL">Critical - Safety hazard</option>
                </select>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/citizen/dashboard')}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg mr-4 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-md disabled:opacity-70"
              >
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading evidence...</> : <><Send className="w-5 h-5 mr-2" /> Submit Report</>}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
