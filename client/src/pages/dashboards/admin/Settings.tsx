import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, AlertTriangle, ShieldCheck, 
  Activity, CheckCircle2, Server, Database, Map, X,
  Building, Briefcase, Users, FileText, CheckSquare, 
  BarChart2, Shield, Eye, Bell, Globe, Archive, Clock
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

const SECTIONS = [
  { id: 'General', label: 'General', icon: SettingsIcon, group: 'GENERAL' },
  { id: 'Municipal Information', label: 'Municipal Information', icon: Building, group: 'GENERAL' },
  { id: 'Projects', label: 'Projects', icon: Briefcase, group: 'OPERATIONS' },
  { id: 'Citizen Requests', label: 'Citizen Requests', icon: Users, group: 'OPERATIONS' },
  { id: 'Field Inspections', label: 'Field Inspections', icon: CheckSquare, group: 'OPERATIONS' },
  { id: 'Evidence', label: 'Evidence', icon: FileText, group: 'OPERATIONS' },
  { id: 'Data Quality', label: 'Data Quality', icon: ShieldCheck, group: 'INTELLIGENCE' },
  { id: 'Performance & KPIs', label: 'Performance & KPIs', icon: BarChart2, group: 'INTELLIGENCE' },
  { id: 'Impact Analysis', label: 'Impact Analysis', icon: Activity, group: 'INTELLIGENCE' },
  { id: 'Risk & AI', label: 'Risk & AI', icon: Eye, group: 'INTELLIGENCE' },
  { id: 'GIS & Maps', label: 'GIS & Maps', icon: Map, group: 'REPORTING' },
  { id: 'Reports', label: 'Reports', icon: FileText, group: 'REPORTING' },
  { id: 'Notifications', label: 'Notifications', icon: Bell, group: 'SYSTEM' },
  { id: 'Security', label: 'Security', icon: Shield, group: 'SYSTEM' },
  { id: 'Audit & Retention', label: 'Audit & Retention', icon: Archive, group: 'SYSTEM' },
  { id: 'system_health', label: 'System Health', icon: Activity, group: 'SYSTEM' },
];

export default function Settings() {
  const [settingsDict, setSettingsDict] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>('General');
  
  const [formData, setFormData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  
  const [health, setHealth] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'system_health') {
      loadHealth();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      if (res.success && res.data) {
        setSettingsDict(res.data);
        const flat: any = {};
        for (const cat of Object.keys(res.data)) {
          res.data[cat].forEach((s: any) => {
            flat[s.key] = s.value;
          });
        }
        setFormData(flat);
        setOriginalData(flat);
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Unable to load system settings.' });
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    setHealth(null);
    try {
      const res = await adminApi.getSystemHealth();
      if (res.success) {
        setHealth(res.data);
      }
    } catch (e) {
      console.error("Health check failed", e);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleSave = async () => {
    if (!hasChanges()) return;
    
    const updates: any = {};
    for (const key in formData) {
      if (formData[key] !== originalData[key]) {
        updates[key] = formData[key];
      }
    }
    
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminApi.updateSettings(updates);
      if (res.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully.' });
        setOriginalData({...formData});
      } else {
        setMessage({ type: 'error', text: res.message || 'Unable to save settings.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Unable to save settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to discard your unsaved changes?')) {
      setFormData({...originalData});
      setMessage(null);
    }
  };

  const renderInput = (setting: any) => {
    const val = formData[setting.key];
    
    if (setting.type === 'boolean') {
      return (
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={val} 
              onChange={e => setFormData({...formData, [setting.key]: e.target.checked})}
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${val ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${val ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-sm font-medium text-gray-700">
            {val ? 'Enabled' : 'Disabled'}
          </div>
        </label>
      );
    }
    
    if (setting.type === 'number') {
      return (
        <input 
          type="number" 
          value={val} 
          onChange={e => setFormData({...formData, [setting.key]: parseFloat(e.target.value) || 0})}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      );
    }
    
    if (setting.type === 'secret') {
      return (
        <div className="flex items-center space-x-2">
          <input 
            type="password" 
            placeholder={val === '[CONFIGURED]' ? '•••••••• (Configured)' : 'Not Configured'} 
            onChange={e => setFormData({...formData, [setting.key]: e.target.value})}
            className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {val === '[CONFIGURED]' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        </div>
      );
    }
    
    return (
      <input 
        type="text" 
        value={val || ''} 
        onChange={e => setFormData({...formData, [setting.key]: e.target.value})}
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      />
    );
  };

  const renderHealthTab = () => {
    if (!health) return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Checking system health...</p>
      </div>
    );
    
    const allOp = Object.values(health).every((s: any) => s.status === 'Operational' || s.status === 'Configured' || s.status === 'Not Configured');
    
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
            <p className={`text-sm mt-1 font-medium ${allOp ? 'text-green-600' : 'text-amber-600'}`}>
              {allOp ? 'All systems operational' : 'Some services require attention'}
            </p>
          </div>
          <button onClick={loadHealth} className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
            <Activity className="w-4 h-4 mr-2" /> Refresh Health
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-full mr-4 ${health.database?.status === 'Operational' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Database</p>
              <p className="text-lg font-bold text-gray-900">{health.database?.status || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-full mr-4 ${health.backend?.status === 'Operational' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Backend API</p>
              <p className="text-lg font-bold text-gray-900">{health.backend?.status || 'Unknown'} <span className="text-sm font-normal text-gray-400 ml-2">{health.backend?.latency_ms}ms</span></p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-full mr-4 ${health.storage?.status === 'Operational' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Storage</p>
              <p className="text-lg font-bold text-gray-900">{health.storage?.status || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-full mr-4 ${health.map?.status === 'Configured' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <Map className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Map Service</p>
              <p className="text-lg font-bold text-gray-900">{health.map?.status || 'Not Configured'}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-full mr-4 ${health.notifications?.status === 'Operational' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Notifications</p>
              <p className="text-lg font-bold text-gray-900">{health.notifications?.status || 'Unknown'}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-full mr-4 ${health.ai?.status === 'Configured' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">AI Service</p>
              <p className="text-lg font-bold text-gray-900">{health.ai?.status || 'Not Configured'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-8 flex flex-col justify-between shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 text-slate-800 opacity-50 pointer-events-none">
          <SettingsIcon size={250} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center text-sm text-slate-400 mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Admin</span>
            <span className="mx-2">/</span>
            <span className="text-slate-200 font-medium">Settings</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center mb-2 tracking-tight">
                <SettingsIcon className="h-8 w-8 mr-3 text-indigo-400" />
                System Settings
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm">
                Configure Municipal Monitor preferences, workflows, security, and administrative controls.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto p-6 gap-6 relative">
        
        {/* Sidebar */}
        <div className="w-full md:w-72 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            
            {['GENERAL', 'OPERATIONS', 'INTELLIGENCE', 'REPORTING', 'SYSTEM'].map(group => (
              <div key={group}>
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {SECTIONS.filter(s => s.group === group).map(section => {
                    const Icon = section.icon;
                    return (
                      <li key={section.id}>
                        <button 
                          onClick={() => setActiveTab(section.id)}
                          className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors flex items-center justify-between ${activeTab === section.id ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'}`}
                        >
                          <span className="flex items-center">
                            <Icon className={`w-4 h-4 mr-3 ${activeTab === section.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                            {section.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Settings Panel */}
        <div className="flex-1 min-w-0 pb-32">
          
          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start shadow-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />}
              <p className="font-medium text-sm">{message.text}</p>
              <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading settings...</p>
              </div>
            ) : activeTab === 'system_health' ? (
              renderHealthTab()
            ) : (
              <div className="animate-in fade-in duration-300">
                <div className="mb-8 border-b border-gray-200 pb-5">
                  <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure parameters and defaults for {activeTab.toLowerCase()}.</p>
                </div>
                
                {settingsDict[activeTab] && settingsDict[activeTab].length > 0 ? (
                  <div className="space-y-6">
                    {settingsDict[activeTab].map((setting: any) => (
                      <div key={setting.key} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                        <div className="mb-4 md:mb-0 md:mr-8 flex-1">
                          <label className="block text-sm font-bold text-gray-900 mb-1">
                            {setting.description || setting.key}
                          </label>
                          <p className="text-xs text-gray-500 font-mono bg-gray-200 inline-block px-1.5 py-0.5 rounded border border-gray-300">
                            {setting.key}
                          </p>
                        </div>
                        <div className="shrink-0 md:w-1/2 flex justify-end">
                          {renderInput(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <SettingsIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No settings available</h3>
                    <p className="text-gray-500 text-sm">There are no configurable parameters for this section yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Sticky Save Bar */}
      {hasChanges() && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 animate-in slide-in-from-bottom-full duration-300">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">You have unsaved changes.</span>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleReset} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center shadow-sm">
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
