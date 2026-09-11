import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertOctagon, AlertTriangle, ShieldAlert, CheckCircle, 
  Search, Filter, Clock, ChevronRight, X, Info
} from 'lucide-react';

interface RiskAlert {
  id: number;
  project_id: number;
  project_name: string;
  type: string;
  severity: string;
  description: string;
  is_resolved: boolean;
  detected_at: string;
  resolved_at: string | null;
}

export default function OfficerRiskAlerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);

  useEffect(() => {
    fetchRiskAlerts();
  }, []);

  const fetchRiskAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/officer/risk-alerts');
      setAlerts(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href = '/officer/login';
      } else {
        setError('Unable to load risk alerts.');
      }
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      await axios.patch(`/api/officer/risk-alerts/${id}/acknowledge`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, severity: 'ACKNOWLEDGED' } : a));
      if (selectedAlert?.id === id) {
        setSelectedAlert({ ...selectedAlert, severity: 'ACKNOWLEDGED' });
      }
    } catch (err: any) {
      alert('Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACKNOWLEDGED': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'MEDIUM': return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      case 'ACKNOWLEDGED': return <CheckCircle className="w-5 h-5 text-slate-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getActionLink = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PROJECT DELAY': return { path: '/officer/projects', label: 'View Project' };
      case 'KPI UNDERPERFORMANCE': return { path: '/officer/kpis', label: 'View KPI' };
      case 'REJECTED EVIDENCE': return { path: '/officer/evidence', label: 'Upload Evidence' };
      case 'MILESTONE DELAY': return { path: '/officer/projects', label: 'Review Milestones' };
      default: return { path: '/officer/projects', label: 'View Project' };
    }
  };

  const getRecommendedAction = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PROJECT DELAY': return 'Review remaining project milestones and update field progress.';
      case 'KPI UNDERPERFORMANCE': return 'Update KPI measurement and attach supporting evidence.';
      case 'REJECTED EVIDENCE': return 'Upload the required valid completion evidence.';
      case 'MILESTONE DELAY': return 'Review blocked tasks and report progress on the current milestone.';
      default: return 'Review the project dashboard for immediate action.';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = !a.is_resolved;
    if (statusFilter === 'RESOLVED') matchesStatus = a.is_resolved;

    let matchesSeverity = true;
    if (severityFilter !== 'ALL') matchesSeverity = a.severity.toUpperCase() === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const activeAlerts = alerts.filter(a => !a.is_resolved);
  const counts = {
    CRITICAL: activeAlerts.filter(a => a.severity.toUpperCase() === 'CRITICAL').length,
    HIGH: activeAlerts.filter(a => a.severity.toUpperCase() === 'HIGH').length,
    MEDIUM: activeAlerts.filter(a => a.severity.toUpperCase() === 'MEDIUM').length,
    LOW: activeAlerts.filter(a => a.severity.toUpperCase() === 'LOW').length,
    RESOLVED: alerts.filter(a => a.is_resolved).length
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 animate-pulse rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-slate-200 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
        <button onClick={fetchRiskAlerts} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">RISK ALERTS</h1>
        <p className="text-slate-500 mt-2">Identify operational issues that may require immediate attention.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-red-200 p-5 text-center">
          <p className="text-xs font-bold text-red-600 mb-1">CRITICAL</p>
          <h3 className="text-3xl font-black text-slate-900">{counts.CRITICAL}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl shadow-sm border border-orange-200 p-5 text-center">
          <p className="text-xs font-bold text-orange-600 mb-1">HIGH</p>
          <h3 className="text-3xl font-black text-slate-900">{counts.HIGH}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-amber-200 p-5 text-center">
          <p className="text-xs font-bold text-amber-600 mb-1">MEDIUM</p>
          <h3 className="text-3xl font-black text-slate-900">{counts.MEDIUM}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 text-center">
          <p className="text-xs font-bold text-blue-600 mb-1">LOW</p>
          <h3 className="text-3xl font-black text-slate-900">{counts.LOW}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-5 text-center">
          <p className="text-xs font-bold text-slate-600 mb-1">RESOLVED</p>
          <h3 className="text-3xl font-black text-slate-900">{counts.RESOLVED}</h3>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search alerts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Alerts</option>
            <option value="RESOLVED">Resolved Alerts</option>
          </select>
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {statusFilter === 'ACTIVE' ? 'No Active Risks' : 'No Risks Found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Your assigned municipal work currently has no detected operational risks matching these criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map((alert, idx) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-xl shadow-sm border ${alert.is_resolved ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:shadow-md'} overflow-hidden flex flex-col transition-all`}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(alert.severity)}
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()} RISK
                    </span>
                  </div>
                  {alert.is_resolved && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                      RESOLVED
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{alert.type}</h3>
                <p className="text-sm font-medium text-slate-500 mb-4 truncate">{alert.project_name}</p>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="text-sm text-slate-700 line-clamp-3">{alert.description}</p>
                </div>
                
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Detected: {new Date(alert.detected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedAlert(alert)}
                className="w-full py-3 bg-slate-50 border-t border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-sm"
              >
                View Details <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSelectedAlert(null)}
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl mr-4 ${getSeverityColor(selectedAlert.severity)} bg-opacity-20`}>
                    {getSeverityIcon(selectedAlert.severity)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider border ${getSeverityColor(selectedAlert.severity)}`}>
                        {selectedAlert.severity.toUpperCase()} RISK
                      </span>
                      {selectedAlert.is_resolved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedAlert.type}</h2>
                    <p className="text-sm font-medium text-slate-500">{selectedAlert.project_name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-wider">WHY THIS WAS FLAGGED</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                    {selectedAlert.description}
                  </div>
                </div>

                {!selectedAlert.is_resolved && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-wider">RECOMMENDED ACTION</h4>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-blue-900 font-medium flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
                      {getRecommendedAction(selectedAlert.type)}
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm text-slate-500 mb-8 border-t border-slate-100 pt-4">
                  <Clock className="w-4 h-4 mr-2" />
                  Detected: {new Date(selectedAlert.detected_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  {selectedAlert.is_resolved && selectedAlert.resolved_at && (
                    <span className="ml-4">
                      • Resolved: {new Date(selectedAlert.resolved_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {!selectedAlert.is_resolved && selectedAlert.severity !== 'ACKNOWLEDGED' && (
                    <button 
                      onClick={() => acknowledgeAlert(selectedAlert.id)}
                      className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Acknowledge Risk
                    </button>
                  )}
                  <Link 
                    to={getActionLink(selectedAlert.type).path}
                    className="flex-1 py-3 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-center"
                  >
                    {getActionLink(selectedAlert.type).label}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
