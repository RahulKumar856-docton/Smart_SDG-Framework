import { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ArrowRight, Brain, Building2, CheckCircle2,
  ClipboardCheck, Droplets, Globe2, LayoutDashboard,
  Leaf, Map as MapIcon, ShieldCheck,
  Users2, Eye, Shield, Settings, Clock, AlertTriangle, FileText, Lock
} from 'lucide-react';

const Header = () => {
  const [showSystemAccess, setShowSystemAccess] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="bg-slate-900 p-2 rounded-lg">
                <Globe2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight leading-tight">
                MUNICIPAL<br />MONITOR
              </span>
            </motion.div>
            
            <nav className="hidden md:flex space-x-8">
              {['Home', 'How It Works', 'Development Monitoring', 'Projects', 'Transparency', 'About'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Login
              </Link>
              <Link to="/citizen" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow">
                Citizen Portal
              </Link>
              
              {/* Hidden System Access */}
              <div className="relative ml-2">
                <button 
                  onClick={() => setShowSystemAccess(true)}
                  className="p-2 text-slate-300 hover:text-slate-600 transition-colors group relative rounded-lg hover:bg-slate-100"
                  title="Authorized System Access"
                  aria-label="Authorized System Access"
                >
                  <Lock className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  <span className="absolute hidden group-hover:block w-max bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg top-9 right-0 z-50">
                    Authorized System Access
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* System Access Modal */}
      <AnimatePresence>
        {showSystemAccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"></div>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center shadow-md">
                  <Lock className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center text-slate-900 mb-1">SYSTEM ACCESS CONSOLE</h3>
              <p className="text-sm text-center text-slate-500 mb-2">Platform Root Administration</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-6 text-center">
                <p className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider">
                  Restricted to Super Administrators
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowSystemAccess(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowSystemAccess(false);
                    navigate('/system-access/login');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Authenticate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => (
  <section id="home" className="pt-32 pb-20 overflow-hidden bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-6 border border-blue-200">
            <Brain className="w-3 h-3" />
            <span>AI-POWERED CIVIC TECHNOLOGY</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Smarter Municipal Development.<br />
            <span className="text-blue-600">Transparent Civic Action.</span><br />
            Measurable Results.
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Connect citizens, municipal officers, departments and higher authorities through one intelligent, evidence-based platform for municipal service delivery, project monitoring, field verification, work-progress tracking and AI-assisted decision support.
          </p>
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <Link to="/login" className="px-6 py-3.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center group">
              Explore Platform
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/citizen" className="px-6 py-3.5 bg-white text-slate-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 transition-all shadow-sm">
              Citizen Portal
            </Link>
            <a href="#how-it-works" className="px-6 py-3.5 text-slate-500 font-medium hover:text-slate-800 transition-colors">
              How It Works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-teal-100 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
          <div className="relative bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MapIcon className="w-64 h-64" />
            </div>
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h3 className="font-bold text-white text-sm tracking-wide flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-2 text-blue-400" />
                MUNICIPAL COMMAND CENTER
              </h3>
              <span className="text-xs text-slate-400">Platform Preview</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'REPORTS', value: '1,284', icon: FileText, color: 'text-blue-400' },
                { label: 'ACTIVE WORK', value: '241', icon: Activity, color: 'text-emerald-400' },
                { label: 'DELAYED', value: '72', icon: Clock, color: 'text-orange-400' },
                { label: 'ESCALATED', value: '35', icon: AlertTriangle, color: 'text-red-400' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <p className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider">{stat.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-400 tracking-wider">SLA COMPLIANCE</p>
                  <p className="text-lg font-bold text-white">89%</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-400 tracking-wider">AI RISK</p>
                  <p className="text-lg font-bold text-emerald-300">Low</p>
                </div>
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const PlatformOverview = () => (
  <section className="py-24 bg-white border-y border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-2">One Platform</h2>
        <h3 className="text-3xl font-bold text-slate-900 mb-4">Four Levels of Municipal Action</h3>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Citizen */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <Users2 className="w-8 h-8 text-blue-500 mb-4" />
          <h4 className="font-bold text-lg mb-4 text-slate-900">Citizen</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Report issues</li>
            <li>• Request services</li>
            <li>• Track work</li>
            <li>• Confirm resolution</li>
            <li>• Provide feedback</li>
          </ul>
        </motion.div>

        {/* Officer */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <ClipboardCheck className="w-8 h-8 text-emerald-500 mb-4" />
          <h4 className="font-bold text-lg mb-4 text-slate-900">Municipal Officer</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Manage assigned work</li>
            <li>• Conduct inspections</li>
            <li>• Update progress</li>
            <li>• Upload evidence</li>
            <li>• Respond to citizens</li>
          </ul>
        </motion.div>

        {/* Higher Official */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl transform scale-105 z-10">
          <ShieldCheck className="w-8 h-8 text-blue-400 mb-4" />
          <h4 className="font-bold text-lg mb-4 text-white">Higher Official</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Review citizen reports</li>
            <li>• Monitor departments</li>
            <li>• Track delays</li>
            <li>• Manage escalations</li>
            <li>• Verify completion</li>
            <li>• Use AI decision support</li>
          </ul>
        </motion.div>

        {/* Super Admin */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-slate-900 rounded-2xl p-6 border border-purple-500/30 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ROOT SYSTEM</span>
            </div>
            <h4 className="font-bold text-lg mb-2 text-white">Super Admin</h4>
            <p className="text-xs text-slate-300 mb-4">Full infrastructure governance, role authorization, department control, and audit logs.</p>
            <ul className="space-y-1.5 text-xs text-slate-300 mb-6">
              <li>• System Telemetry & Health</li>
              <li>• User & Role Management</li>
              <li>• Department Infrastructure</li>
              <li>• Security & Audit Trail</li>
              <li>• SLA & AI Global Controls</li>
            </ul>
          </div>
          <Link to="/admin/login" className="block w-full text-center py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            Super Admin Access →
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);

const ChoosePortal = () => (
  <section id="portals" className="py-24 bg-slate-50 border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Portal</h2>
        <p className="text-slate-600">Access role-tailored dashboards designed for citizens, field officers, department leadership, and system administrators.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CITIZEN PORTAL */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Citizen Portal</h3>
          <p className="text-sm text-slate-600 mb-4 flex-grow">Report issues, request services, track municipal work and confirm whether reported issues have actually been resolved.</p>
          <ul className="text-xs text-slate-500 space-y-1 mb-6 font-medium">
            <li>• Report Issues</li>
            <li>• Track Requests</li>
            <li>• Municipal Services</li>
            <li>• Feedback</li>
            <li>• AI Municipal Assistant</li>
          </ul>
          <div className="space-y-2 mt-auto">
            <Link to="/citizen/login" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Citizen Login</Link>
            <Link to="/citizen/register" className="block w-full text-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Create Citizen Account</Link>
          </div>
        </div>

        {/* OFFICER PORTAL */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Municipal Officer Portal</h3>
          <p className="text-sm text-slate-600 mb-4 flex-grow">Monitor assigned work, conduct field inspections, update progress, upload evidence and respond to citizen requirements.</p>
          <ul className="text-xs text-slate-500 space-y-1 mb-6 font-medium">
            <li>• Assigned Work</li>
            <li>• Field Inspection</li>
            <li>• Work Progress</li>
            <li>• Evidence</li>
            <li>• Citizen Requests</li>
          </ul>
          <div className="space-y-2 mt-auto">
            <Link to="/officer/login" className="block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">Officer Login</Link>
            <Link to="/officer/register" className="block w-full text-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Officer Registration</Link>
          </div>
        </div>

        {/* HIGHER OFFICIAL PORTAL */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col text-white">
          <h3 className="text-xl font-bold text-white mb-2">Higher Official Portal</h3>
          <p className="text-sm text-slate-400 mb-4 flex-grow">Monitor municipality-wide performance, review reports, identify delays, manage escalations and verify completed work.</p>
          <ul className="text-xs text-slate-300 space-y-1 mb-6 font-medium">
            <li>• Municipal Command Center</li>
            <li>• Department Monitoring</li>
            <li>• SLA & Delays</li>
            <li>• Escalations</li>
            <li>• AI Intelligence</li>
            <li>• Completion Verification</li>
          </ul>
          <div className="space-y-2 mt-auto">
            <Link to="/authority/login" className="block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">Higher Official Login</Link>
          </div>
        </div>

        {/* SUPER ADMIN PORTAL */}
        <div className="bg-gradient-to-br from-slate-950 to-indigo-950 rounded-2xl p-6 border border-purple-500/40 shadow-xl flex flex-col text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white">Super Admin Portal</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ROOT</span>
          </div>
          <p className="text-sm text-slate-400 mb-4 flex-grow">Control municipal system telemetry, configure administrative roles, manage department hierarchies, and audit security events.</p>
          <ul className="text-xs text-slate-300 space-y-1 mb-6 font-medium">
            <li>• Super Admin Dashboard</li>
            <li>• Role Matrix & User Directory</li>
            <li>• Department Infrastructure</li>
            <li>• Real-Time Security Audit Logs</li>
            <li>• Operational Telemetry</li>
          </ul>
          <div className="space-y-2 mt-auto">
            <Link to="/admin/login" className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-colors shadow">Super Admin Sign In</Link>
            <Link to="/admin/dashboard" className="block w-full text-center px-4 py-2 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">Command Center</Link>
          </div>
        </div>

      </div>
    </div>
  </section>
);

const HowItWorks = () => {
  const steps = [
    { num: "01", title: "Citizen Requirement", desc: "Citizen reports an issue or requests a municipal service." },
    { num: "02", title: "AI Analysis", desc: "AI identifies intent, category, location, priority and potential duplicates." },
    { num: "03", title: "Higher Official Review", desc: "The responsible authority verifies the report and routes it." },
    { num: "04", title: "Department Investigation", desc: "The department identifies the problem, root cause and required action." },
    { num: "05", title: "Field Inspection", desc: "Officer visits the location and records findings and evidence." },
    { num: "06", title: "Work & Progress", desc: "The department/field officer performs the work and updates progress." },
    { num: "07", title: "AI Risk Analysis", desc: "AI identifies potential delay, recurring issues and operational risks." },
    { num: "08", title: "Evidence Verification", desc: "Completion evidence is reviewed by authorized officials." },
    { num: "09", title: "Resolution", desc: "The authority verifies the completed work." },
    { num: "10", title: "Citizen Confirmation", desc: "Citizen receives the result and can confirm whether the issue was resolved." },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">From Citizen Report to Verified Municipal Action</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-blue-600 font-black text-xl mb-2 block">{step.num}</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">{step.title}</h4>
              <p className="text-xs text-slate-600 leading-snug">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Accountability = () => (
  <section className="py-24 bg-slate-900 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-4xl font-bold mb-4">From Complaint to Completion.<br/>Every Action Accountable.</h2>
      <p className="text-lg text-slate-400 mb-12 max-w-3xl mx-auto">
        Municipal Monitor does not stop when a citizen submits a complaint. Every report can move through verification, department investigation, field inspection, work progress, evidence submission and higher-authority verification.
      </p>
      
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {['REPORT', 'VERIFIED', 'DEPARTMENT ASSIGNED', 'INVESTIGATION', 'INSPECTION', 'WORK STARTED', '65% COMPLETE', '100% COMPLETE', 'AUTHORITY VERIFIED', 'CITIZEN CONFIRMED'].map((step, i, arr) => (
          <Fragment key={step}>
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-xs font-bold tracking-wider">{step}</div>
            {i < arr.length - 1 && <div className="hidden md:flex items-center text-slate-600"><ArrowRight className="w-4 h-4" /></div>}
          </Fragment>
        ))}
      </div>
      
      <p className="text-xl font-medium text-blue-400 bg-blue-900/20 inline-block px-6 py-3 rounded-2xl border border-blue-800/50">
        "Citizens can see what is happening, why work is delayed and how much work has actually been completed."
      </p>
    </div>
  </section>
);

const DelayTransparency = () => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Know Why Work Is Delayed.</h2>
          <p className="text-lg text-slate-600 mb-6">Real transparency means sharing progress and roadblocks. Citizens are kept informed of exact progress percentages, reasons for delay, and the current actions being taken by the municipality.</p>
          <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-slate-200">
            <Eye className="w-3 h-3" />
            <span>Illustrative workflow transparency</span>
          </div>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-lg font-mono text-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
            <span className="font-bold text-slate-900">REPORT MM-2026-00125</span>
            <span className="text-slate-500">Road Damage — Ward 4</span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600 font-semibold text-xs uppercase">Work Progress</span>
              <span className="font-bold text-blue-600">65%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold block mb-1">Status</span>
              <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">Delayed by 4 days</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold block mb-1">Reason</span>
              <span className="text-slate-800">Material procurement delay</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold block mb-1">Current Action</span>
              <span className="text-slate-800">Materials received. Repair work underway.</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold block mb-1">Expected Completion</span>
                <span className="text-slate-800 font-semibold">16 October</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold block mb-1">Department</span>
                <span className="text-slate-800 font-semibold">Roads & Infrastructure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const AiIntelligence = () => (
  <section className="py-24 bg-slate-50 border-y border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">AI-Powered Municipal Intelligence</h2>
        <p className="text-lg text-slate-600">AI assists officials. AI does not replace official decisions.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs font-bold text-slate-400 block mb-1 uppercase">Citizen Input</span>
              <p className="text-slate-800 font-medium">"Water is not coming in Ward 3 for 5 days."</p>
            </div>
            
            <div className="flex justify-center text-blue-400"><ArrowRight className="rotate-90 w-5 h-5" /></div>
            
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-600 block mb-3 uppercase flex items-center"><Brain className="w-3 h-3 mr-1" /> AI Analysis</span>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-slate-500">Intent:</div><div className="font-semibold text-slate-800">Issue Report</div>
                <div className="text-slate-500">Category:</div><div className="font-semibold text-slate-800">Water Supply</div>
                <div className="text-slate-500">Ward:</div><div className="font-semibold text-slate-800">3</div>
                <div className="text-slate-500">Priority:</div><div className="font-semibold text-red-600">High</div>
                <div className="text-slate-500">Recommended Dept:</div><div className="font-semibold text-slate-800">Water Supply</div>
                <div className="text-slate-500">Delay Risk:</div><div className="font-semibold text-orange-500">Medium</div>
              </div>
            </div>
            
            <div className="flex justify-center text-blue-400"><ArrowRight className="rotate-90 w-5 h-5" /></div>
            
            <div className="bg-slate-900 p-4 rounded-lg text-white">
              <span className="text-xs font-bold text-slate-400 block mb-3 uppercase">Higher Official Review</span>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded text-sm font-bold transition-colors">Accept Recommendation</button>
                <button className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm font-bold transition-colors">Modify</button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4">Illustrative AI workflow</p>
        </div>
        
        <div>
          <ul className="space-y-4">
            {[
              "Natural-language citizen assistance", "Report classification & priority prediction",
              "Department & officer recommendation", "Duplicate detection", "Delay & risk prediction",
              "Recurring issue detection", "Root cause analysis", "GIS intelligence", "Explainable recommendations"
            ].map((cap, i) => (
              <li key={i} className="flex items-center text-slate-700">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                {cap}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-900 text-white pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Globe2 className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-lg tracking-tight">MUNICIPAL MONITOR</span>
          </div>
          <p className="text-slate-400 text-sm">Evidence-based municipal development monitoring.</p>
        </div>
        <div>
          <h4 className="font-bold mb-6">Platform</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link to="/projects" className="hover:text-white transition-colors">Projects</Link></li>
            <li><a href="#development-monitoring" className="hover:text-white transition-colors">Development Monitoring</a></li>
            <li><Link to="/citizen" className="hover:text-white transition-colors">Citizen Portal</Link></li>
            <li><Link to="/map" className="hover:text-white transition-colors">GIS Map</Link></li>
            <li><Link to="/reports" className="hover:text-white transition-colors">Reports</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Resources</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
            <li><a href="#transparency" className="hover:text-white transition-colors">Transparency</a></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/help" className="hover:text-white transition-colors">Help</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Access</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link to="/authority/login" className="hover:text-white transition-colors">Higher Official Login</Link></li>
            <li><Link to="/officer/login" className="hover:text-white transition-colors">Officer Login</Link></li>
            <li><Link to="/citizen/login" className="hover:text-white transition-colors">Citizen Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <p>© 2026 Municipal Monitor</p>
        <div className="mt-2 md:mt-0 flex items-center">
          <Link to="/admin/login" className="flex items-center hover:text-slate-300 transition-colors" title="System Administration">
            <Lock className="w-3 h-3 mr-1" /> Authorized system access
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-500/30">
      <Header />
      <Hero />
      <PlatformOverview />
      <ChoosePortal />
      <HowItWorks />
      <Accountability />
      <DelayTransparency />
      
      {/* Higher Official Command Center Preview */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">A Command Center for Municipal Authorities.</h2>
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Higher officials can identify delayed work, understand why it is delayed, intervene with departments, monitor progress and verify completion before a report is marked resolved.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl"><span className="text-2xl font-bold block text-blue-400">1,284</span><span className="text-xs text-slate-400 uppercase tracking-widest">Total Reports</span></div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl"><span className="text-2xl font-bold block text-orange-400">142</span><span className="text-xs text-slate-400 uppercase tracking-widest">Pending Review</span></div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl"><span className="text-2xl font-bold block text-red-400">72</span><span className="text-xs text-slate-400 uppercase tracking-widest">Delayed</span></div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl"><span className="text-2xl font-bold block text-purple-400">35</span><span className="text-xs text-slate-400 uppercase tracking-widest">Escalated</span></div>
          </div>
          
          <Link to="/authority/login" className="inline-flex px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors">
            Explore Higher Official Portal
          </Link>
        </div>
      </section>
      
      <AiIntelligence />
      
      {/* Development Metrics */}
      <section id="development-monitoring" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Monitoring the Indicators That Shape Better Municipal Services</h2>
          <p className="text-lg text-slate-600 mb-16 max-w-3xl mx-auto">Track core municipal infrastructure, environmental resilience, and operational metrics.</p>
          
          <div className="grid md:grid-cols-4 gap-6 text-left">
            {[
              { icon: Droplets, title: 'WATER & SANITATION', desc: 'Monitor water supply, sanitation, wastewater and related municipal infrastructure.' },
              { icon: Building2, title: 'URBAN DEVELOPMENT', desc: 'Track roads, drainage, public infrastructure, public services and community development.' },
              { icon: Globe2, title: 'CLIMATE & RESILIENCE', desc: 'Monitor flooding, climate risks, resilience and adaptation initiatives.' },
              { icon: Leaf, title: 'ENVIRONMENT & PUBLIC SPACES', desc: 'Monitor green spaces, trees, biodiversity and environmental initiatives.' },
            ].map((m, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <m.icon className="w-8 h-8 text-blue-600 mb-4" />
                <h4 className="font-bold text-sm text-slate-900 mb-2">{m.title}</h4>
                <p className="text-sm text-slate-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-blue-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="text-5xl font-black mb-6 leading-tight">Better Data.<br/>Better Decisions.<br/>Better Municipal Services.</h2>
          <p className="text-xl text-blue-100 mb-10 font-light">Connect citizens, municipal teams, departments and authorities through one intelligent monitoring platform.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Explore Platform</Link>
            <Link to="/citizen" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Citizen Portal</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
