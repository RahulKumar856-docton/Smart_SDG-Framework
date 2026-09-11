import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, MapPin, Calendar, Clock, 
  CheckCircle, AlertCircle, RefreshCw, User, MessageSquare, Image as ImageIcon, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

export default function ReportDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await citizenApi.get(`/reports/${id}`);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load report details');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 font-medium">Loading report details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The report you're looking for doesn't exist."}</p>
        <Link to="/citizen/reports" className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
          Back to Reports
        </Link>
      </div>
    );
  }

  const { report, timeline, evidence } = data;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'SUBMITTED': return <span className="px-3 py-1 text-sm font-bold rounded-full bg-slate-100 text-slate-700">SUBMITTED</span>;
      case 'INVESTIGATION': return <span className="px-3 py-1 text-sm font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">INVESTIGATING</span>;
      case 'ACTION_IN_PROGRESS': return <span className="px-3 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-700">ACTION IN PROGRESS</span>;
      case 'RESOLVED': return <span className="px-3 py-1 text-sm font-bold rounded-full bg-green-100 text-green-700">RESOLVED</span>;
      default: return <span className="px-3 py-1 text-sm font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };
  
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };
  
  const closeLightbox = () => setLightboxOpen(false);
  const nextImage = () => setCurrentImageIndex((prev) => (prev === evidence.length - 1 ? 0 : prev + 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? evidence.length - 1 : prev - 1));

  return (
    <div className="max-w-5xl mx-auto py-8">
      
      <Link to="/citizen/reports" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-red-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Reports
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center mb-2">
            <span className="text-sm font-bold font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded border border-gray-200 mr-3">
              {report.report_id_code}
            </span>
            {getStatusBadge(report.status)}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{report.title}</h1>
        </div>

        <Link
          to={`/citizen/messages?conv=REP-${report.id}`}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-sm text-sm shrink-0"
        >
          <MessageSquare className="w-4 h-4 mr-2" /> Message Staff
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Issue Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" /> {report.category}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" /> {report.location || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Reported</p>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" /> {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Severity</p>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-gray-400" /> {report.severity}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-gray-500" /> Evidence / Photos
            </h2>
            
            {(!evidence || evidence.length === 0) ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">No photos attached to this report.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {evidence.map((img: any, idx: number) => (
                  <div 
                    key={img.id} 
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                    onClick={() => openLightbox(idx)}
                  >
                    <img 
                      src={`http://localhost:5000${img.file_path}`} 
                      alt={img.original_filename} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-bold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">View</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-gray-500" /> Investigation Timeline
            </h2>
            
            <div className="space-y-6">
              {timeline.map((update: any, idx: number) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== timeline.length - 1 && (
                    <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-gray-200"></div>
                  )}
                  
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 z-10">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  
                  <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                      <div className="font-bold text-gray-900 text-sm">
                        {update.author_name}
                        {update.role && <span className="ml-2 text-xs font-medium text-gray-500">({update.role})</span>}
                      </div>
                      <div className="text-xs font-medium text-gray-400 flex items-center mt-1 sm:mt-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(update.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {update.status_change && (
                      <div className="mb-2">
                        <span className="text-xs font-bold bg-white px-2 py-1 border border-gray-200 rounded text-gray-600 shadow-sm">
                          Status updated to: {update.status_change}
                        </span>
                      </div>
                    )}
                    
                    {update.remarks && (
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-100 shadow-sm">
                        {update.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Handling Department</h2>
            {report.department_name ? (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{report.department_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Responsible for investigation</p>
                  {report.officer_name && (
                    <p className="text-xs text-gray-500 mt-2">Officer: {report.officer_name}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Pending assignment
              </div>
            )}
          </div>
          
          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <MessageSquare className="w-32 h-32" />
            </div>
            <h2 className="text-lg font-bold mb-2">Need to update this?</h2>
            <p className="text-slate-300 text-sm mb-4">If the situation has worsened, please provide an update to help prioritize.</p>
            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-bold transition-colors backdrop-blur-sm">
              Provide Update
            </button>
          </div>
        </div>
        
      </div>

      {lightboxOpen && evidence && evidence.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm">
          <div className="absolute top-4 right-4 flex space-x-4 z-50">
            <a 
              href={`http://localhost:5000${evidence[currentImageIndex].file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white text-sm font-bold bg-white/10 px-4 py-2 rounded-lg"
            >
              Open Original
            </a>
            <button onClick={closeLightbox} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {evidence.length > 1 && (
            <button onClick={prevImage} className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <div className="max-w-5xl max-h-[85vh] w-full px-12 relative flex flex-col items-center justify-center">
            <img 
              src={`http://localhost:5000${evidence[currentImageIndex].file_path}`}
              alt={evidence[currentImageIndex].original_filename}
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-bold">{evidence[currentImageIndex].original_filename}</p>
              <p className="text-white/60 text-sm">
                {currentImageIndex + 1} of {evidence.length} &bull; {(evidence[currentImageIndex].file_size / (1024*1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          {evidence.length > 1 && (
            <button onClick={nextImage} className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
      
    </div>
  );
}
