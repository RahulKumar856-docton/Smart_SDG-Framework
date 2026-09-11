import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, BarChart3, Brain, Building2, CheckCircle2,
  ChevronRight, ClipboardCheck, Droplets, Globe2, LayoutDashboard,
  Leaf, LineChart, Map as MapIcon, ShieldCheck, Sprout, Target,
  Users2, Eye
} from 'lucide-react';
import axios from 'axios';

const Header = () => (
  <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="bg-primary p-2 rounded-lg">
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
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
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
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary">
            Login
          </Link>
          <Link to="/citizen" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-blue-900 transition-all shadow-sm hover:shadow">
            Citizen Portal
          </Link>
        </motion.div>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section id="home" className="pt-32 pb-20 overflow-hidden bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-6 border border-blue-100">
            <Brain className="w-3 h-3" />
            <span>AI-POWERED CIVIC TECHNOLOGY</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Smarter Municipal Development.<br />
            <span className="text-accent">Measurable Sustainable Impact.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Connect citizens, municipal officers and administrators through one evidence-based platform for project monitoring, project evaluation, field verification and intelligent decision support.
          </p>
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <Link to="/projects" className="px-6 py-3.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-900 transition-all shadow-md hover:shadow-lg flex items-center group">
              Explore Platform
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/citizen" className="px-6 py-3.5 bg-white text-slate-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 transition-all shadow-sm">
              Citizen Portal
            </Link>
          </div>
          <p className="text-sm text-slate-500 font-medium flex items-center">
            <Target className="w-4 h-4 mr-2 text-secondary" />
            Built around Core Development Metrics
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-teal-50 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
          <div className="relative bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MapIcon className="w-64 h-64" />
            </div>
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                MUNICIPAL PROJECT INTELLIGENCE
              </h3>
              <span className="text-xs text-slate-400">Illustrative platform preview</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'PROJECT HEALTH', value: '78%', color: 'bg-blue-500' },
                { label: 'DEVELOPMENT PERFORMANCE', value: '72%', color: 'bg-green-500' },
                { label: 'DATA CONFIDENCE', value: '91%', color: 'bg-teal-500' },
                { label: 'CITIZEN SATISFACTION', value: '84%', color: 'bg-indigo-500' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                >
                  <p className="text-[10px] font-bold text-slate-500 mb-1 tracking-wider">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-slate-800">{stat.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stat.value }}
                      transition={{ duration: 1, delay: 0.8 + (i * 0.1) }}
                      className={`h-full ${stat.color} rounded-full`} 
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <ShieldCheck className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-xs font-bold text-red-800 tracking-wider">AI RISK ASSESSMENT</p>
                  <p className="text-sm font-medium text-red-600">Low Risk Detected</p>
                </div>
              </div>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const PortalSelection = () => (
  <section id="portals" className="py-24 bg-white border-y border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Portal</h2>
        <p className="text-lg text-slate-600">Access the tools designed for your role.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Administrator */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col h-full"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Administrator Portal</h3>
          <p className="text-slate-600 mb-6 flex-grow">Manage municipal projects, departments, officers, project performance, citizen requests, data quality, risks and reports.</p>
          <div className="space-y-2 mb-8">
            {['Project Management', 'Development Monitoring', 'Risk & AI', 'Reports', 'Data Quality'].map(f => (
              <div key={f} className="flex items-center text-sm font-semibold text-slate-500">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> {f}
              </div>
            ))}
          </div>
          <Link to="/admin/login" className="w-full text-center px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
            Administrator Login
          </Link>
        </motion.div>

        {/* Municipal Officer */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col h-full"
        >
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Municipal Officer Portal</h3>
          <p className="text-slate-600 mb-6 flex-grow">Monitor assigned projects, conduct field inspections, update KPIs, verify evidence and resolve citizen requirements.</p>
          <div className="space-y-2 mb-8">
            {['Assigned Projects', 'Field Inspection', 'KPI Updates', 'Evidence', 'Citizen Requests'].map(f => (
              <div key={f} className="flex items-center text-sm font-semibold text-slate-500">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> {f}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Link to="/officer/login" className="block w-full text-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors">
              Officer Login
            </Link>
            <Link to="/officer/register" className="block w-full text-center px-6 py-3 bg-white text-primary border border-gray-200 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Officer Registration
            </Link>
          </div>
        </motion.div>

        {/* Citizen */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col h-full"
        >
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Citizen Portal</h3>
          <p className="text-slate-600 mb-6 flex-grow">Report issues, request municipal services, track progress, explore projects and provide feedback.</p>
          <div className="space-y-2 mb-8">
            {['Report Issues', 'Track Requests', 'Explore Projects', 'Give Feedback', 'Public Development Information'].map(f => (
              <div key={f} className="flex items-center text-sm font-semibold text-slate-500">
                <CheckCircle2 className="w-4 h-4 mr-2 text-accent" /> {f}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Link to="/citizen/login" className="block w-full text-center px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
              Citizen Login
            </Link>
            <Link to="/citizen/register" className="block w-full text-center px-6 py-3 bg-white text-accent border border-gray-200 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Create Citizen Account
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

const SDGs = () => (
  <section id="development-monitoring" className="py-24 bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Monitoring the goals that shape sustainable communities</h2>
        <p className="text-lg text-slate-600">Evaluate municipal development through measurable indicators aligned with four critical development goals.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: '6', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', border: 'group-hover:border-blue-500', title: 'Clean Water & Sanitation', desc: 'Monitor water access, sanitation, wastewater and related municipal infrastructure.' },
          { id: '11', icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50', border: 'group-hover:border-orange-500', title: 'Sustainable Cities & Communities', desc: 'Track urban infrastructure, public services and sustainable community development.' },
          { id: '13', icon: Globe2, color: 'text-green-600', bg: 'bg-green-50', border: 'group-hover:border-green-600', title: 'Climate Action', desc: 'Monitor climate resilience, flooding, emissions and adaptation-related initiatives.' },
          { id: '15', icon: Leaf, color: 'text-green-500', bg: 'bg-green-50', border: 'group-hover:border-green-500', title: 'Life on Land', desc: 'Monitor green spaces, trees, biodiversity and land restoration initiatives.' },
        ].map((sdg, i) => (
          <motion.div
            key={sdg.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 ${sdg.border}`}
          >
            <div className={`w-14 h-14 ${sdg.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <sdg.icon className={`w-7 h-7 ${sdg.color}`} />
            </div>
            <div className="text-xs font-bold tracking-widest text-slate-400 mb-2">GOAL {sdg.id}</div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 leading-tight">{sdg.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{sdg.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Timeline = () => {
  const steps = [
    "Citizen Requirement", "AI Classification", "Municipal Review",
    "Officer Field Inspection", "Evidence Verification", "Project Evaluation",
    "AI Risk & Impact Analysis", "Resolution", "Citizen Confirmation"
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">From Citizen Requirements to Verified Municipal Action</h2>
        </div>
        
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          <div className="grid lg:grid-cols-9 gap-4 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-row lg:flex-col items-center lg:text-center space-x-4 lg:space-x-0 group"
              >
                <div className="w-10 h-10 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors mb-0 lg:mb-4 shrink-0 shadow-sm z-10 relative">
                  0{i + 1}
                </div>
                <p className="text-xs font-semibold text-slate-700 max-w-[100px]">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ProjectsExplorer = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/projects/public')
      .then(res => {
        setProjects(res.data.data || []);
      })
      .catch(() => {
        // Fallback for UI visualization purposes if API is not yet built
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="projects" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Explore Municipal Development</h2>
            <p className="text-slate-600">Transparent access to public municipal projects and initiatives.</p>
          </div>
          <Link to="/projects" className="hidden md:flex items-center text-sm font-semibold text-primary hover:text-blue-800">
            View All Projects <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="flex space-x-4 overflow-hidden">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-1/3 h-64 animate-pulse" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2">{p.project_name}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <LayoutDashboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No public municipal projects are currently available.</h3>
            <p className="text-slate-500 max-w-md mx-auto">Projects will appear here once they are published by the municipality.</p>
          </div>
        )}
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-white pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Globe2 className="h-6 w-6 text-accent" />
            <span className="font-bold text-lg tracking-tight">MUNICIPAL MONITOR</span>
          </div>
          <p className="text-slate-400 text-sm">Evidence-based municipal development monitoring.</p>
        </div>
        <div>
          <h4 className="font-bold mb-6">Platform</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link to="/projects" className="hover:text-white transition-colors">Projects</Link></li>
            <li><Link to="/sdgs" className="hover:text-white transition-colors">Development Monitoring</Link></li>
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
            <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#help" className="hover:text-white transition-colors">Help</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Access</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link to="/login" className="hover:text-white transition-colors">Admin Login</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Officer Login</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Citizen Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <p>© 2026 Municipal Monitor</p>
        <p className="mt-2 md:mt-0">Built for transparent and sustainable municipal development.</p>
      </div>
    </div>
  </footer>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <Hero />
      <PortalSelection />
      <SDGs />
      <Timeline />
      
      {/* Citizen Engagement */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Give citizens a direct connection to municipal action.</h2>
          <p className="text-lg text-slate-600 mb-16 max-w-3xl mx-auto">Citizens can report issues, request services, track progress, provide feedback and confirm whether a reported issue has actually been resolved.</p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Sprout, title: 'REPORT', desc: 'Report water, drainage, roads, waste, environmental and other municipal issues.' },
              { icon: Activity, title: 'TRACK', desc: 'Follow the request from submission through inspection, action and verification.' },
              { icon: CheckCircle2, title: 'CONFIRM', desc: 'Confirm whether the municipality actually resolved the issue.' }
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.1 }} className="p-8 bg-slate-50 rounded-2xl border border-gray-100">
                <f.icon className="w-10 h-10 text-primary mx-auto mb-6" />
                <h3 className="font-bold text-lg mb-3 tracking-wide">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <Link to="/citizen" className="inline-flex px-8 py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Open Citizen Portal
          </Link>
        </div>
      </section>

      {/* Intelligence */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-16 text-center">Turn municipal data into actionable intelligence.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'PROJECT MONITORING', desc: 'Track project progress and milestones.', icon: LineChart },
              { title: 'DATA QUALITY', desc: 'Understand how complete, current and verified project information really is.', icon: ShieldCheck },
              { title: 'RISK DETECTION', desc: 'Identify projects that may require intervention.', icon: Activity },
              { title: 'AI DECISION SUPPORT', desc: 'Provide explainable recommendations based on available data.', icon: Brain }
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i*0.1 }} className="border border-slate-700 bg-slate-800/50 p-6 rounded-2xl">
                <f.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-bold text-sm tracking-widest mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ProjectsExplorer />

      {/* CTA */}
      <section className="py-24 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/50"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-6 leading-tight">Better data.<br/>Better decisions.<br/>Better communities.</h2>
          <p className="text-xl text-blue-100 mb-10 font-light">Connect citizens, municipal teams and development goals through one intelligent monitoring platform.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Explore Platform</Link>
            <Link to="/citizen" className="px-8 py-4 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Citizen Portal</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
