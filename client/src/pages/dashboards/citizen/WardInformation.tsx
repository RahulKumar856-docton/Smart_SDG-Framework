import React, { useState } from 'react';
import { Map, Users, Phone, Building, AlertTriangle, Briefcase, Activity, CheckCircle, Navigation, Info } from 'lucide-react';

const mockWardData = {
  councillor: {
    name: 'Mr. Subramanian K.',
    phone: '+91 98765 43210',
    email: 'ward3@municipality.gov.in',
    party: 'Independent',
    office: 'Ward 3 Office, NSR Road'
  },
  stats: {
    population: '24,500',
    area: '4.2 sq km',
    completedProjects: 12,
    activeIssues: 34
  },
  activeProjects: [
    { id: 1, name: 'Underground Drainage Phase II', status: 'In Progress', progress: 65, date: 'Est. Completion: Dec 2026' },
    { id: 2, name: 'NSR Road Resurfacing', status: 'Planning', progress: 15, date: 'Est. Start: Nov 2026' },
    { id: 3, name: 'Smart LED Streetlights Installation', status: 'Nearly Complete', progress: 90, date: 'Est. Completion: Oct 2026' }
  ],
  notices: [
    { id: 1, title: 'Water Supply Interruption', date: 'Oct 10, 2026', type: 'WARNING', desc: 'Scheduled maintenance of main pipeline will cause low pressure from 10 AM to 4 PM.' },
    { id: 2, title: 'Dengue Awareness Camp', date: 'Oct 12, 2026', type: 'INFO', desc: 'Free medical camp at Ward 3 Community Hall.' }
  ]
};

export default function WardInformation() {
  const [selectedWard, setSelectedWard] = useState<string>('3');
  const [loading, setLoading] = useState(false);
  
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    setSelectedWard(e.target.value);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
            <Map className="w-6 h-6 text-teal-600 mr-2" /> Ward Information
          </h1>
          <p className="text-sm text-gray-500">Access local governance details, projects, and alerts for your ward.</p>
        </div>
        
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Your Ward</label>
          <div className="relative">
            <select 
              value={selectedWard} 
              onChange={handleWardChange}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(w => (
                <option key={w} value={w}>Ward {w}</option>
              ))}
            </select>
            <Navigation className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - People & Stats */}
          <div className="space-y-6">
            
            {/* Councillor Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="h-20 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
              <div className="px-6 pb-6 pt-0 relative">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md -mt-10 mb-3 flex items-center justify-center overflow-hidden">
                  <Users className="w-10 h-10 text-teal-300" />
                </div>
                <div className="absolute top-14 right-6">
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                    WARD COUNCILLOR
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">{mockWardData.councillor.name}</h2>
                <p className="text-sm font-medium text-gray-500 mb-4">{mockWardData.councillor.party}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                    <Phone className="w-4 h-4 text-teal-600 mr-3" /> {mockWardData.councillor.phone}
                  </div>
                  <div className="flex items-start text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                    <Building className="w-4 h-4 text-teal-600 mr-3 mt-0.5 shrink-0" /> 
                    <span>{mockWardData.councillor.office}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{mockWardData.stats.population}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Est. Population</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                  <Map className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{mockWardData.stats.area}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Geographic Area</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{mockWardData.stats.completedProjects}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Projects Finished</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{mockWardData.stats.activeIssues}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Active Civic Issues</p>
              </div>
            </div>
            
          </div>

          {/* Right Column - Activities & Alerts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Alerts & Notices */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-bold text-gray-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-gray-500" /> Ward Notices
                </h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{mockWardData.notices.length} New</span>
              </div>
              <div className="p-6 space-y-4">
                {mockWardData.notices.map(notice => (
                  <div key={notice.id} className={`p-4 rounded-xl border ${notice.type === 'WARNING' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'} flex items-start`}>
                    {notice.type === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mr-3 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mr-3 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-sm ${notice.type === 'WARNING' ? 'text-orange-900' : 'text-blue-900'}`}>{notice.title}</h3>
                        <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 ml-2 whitespace-nowrap">{notice.date}</span>
                      </div>
                      <p className={`text-sm ${notice.type === 'WARNING' ? 'text-orange-700' : 'text-blue-700'}`}>{notice.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-bold text-gray-900 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-gray-500" /> Infrastructure Projects
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {mockWardData.activeProjects.map(project => (
                  <div key={project.id}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{project.name}</h3>
                        <p className="text-xs text-gray-500">{project.date}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'Nearly Complete' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                          project.progress > 80 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] font-bold text-gray-400">0%</span>
                      <span className="text-[10px] font-bold text-teal-600">{project.progress}%</span>
                      <span className="text-[10px] font-bold text-gray-400">100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
