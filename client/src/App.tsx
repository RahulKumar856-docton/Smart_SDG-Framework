import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import OfficerDashboard from './pages/dashboards/OfficerDashboard';
import CitizenDashboard from './pages/dashboards/citizen/CitizenDashboard';
import CitizenRequestService from './pages/dashboards/citizen/CitizenRequestService';

// Admin Pages
import AdminUsers from './pages/dashboards/admin/AdminUsers';
import AdminCommunications from './pages/dashboards/admin/AdminCommunications';
import AdminAnalytics from './pages/dashboards/admin/AdminAnalytics';
import AdminOfficers from './pages/dashboards/admin/AdminOfficers';
import ProjectsManagement from './pages/dashboards/admin/ProjectsManagement';
import DepartmentsManagement from './pages/dashboards/admin/DepartmentsManagement';
import CitizenRequests from './pages/dashboards/admin/CitizenRequests';
import CitizenRequestDetails from './pages/dashboards/admin/CitizenRequestDetails';
import PerformanceKPIs from './pages/dashboards/admin/PerformanceKPIs';
import FieldInspections from './pages/dashboards/admin/FieldInspections';
import FieldInspectionDetails from './pages/dashboards/admin/FieldInspectionDetails';
import EvidenceVerification from './pages/dashboards/admin/EvidenceVerification';
import DataQuality from './pages/dashboards/admin/DataQuality';
import ImpactAnalysis from './pages/dashboards/admin/ImpactAnalysis';
import RiskAI from './pages/dashboards/admin/RiskAI';
import GISMap from './pages/dashboards/admin/GISMap';
import ReportsCenter from './pages/dashboards/admin/ReportsCenter';
import AuditLogs from './pages/dashboards/admin/AuditLogs';
import Notifications from './pages/dashboards/admin/Notifications';
import Settings from './pages/dashboards/admin/Settings';

// Super Admin / System Pages
import SystemLayout from './components/layouts/SystemLayout';
import SystemDashboard from './pages/system/SystemDashboard';
import SystemUsers from './pages/system/SystemUsers';
import SystemRolesPermissions from './pages/system/SystemRolesPermissions';
import SystemDepartments from './pages/system/SystemDepartments';
import SystemConfiguration from './pages/system/SystemConfiguration';
import SystemAIConfiguration from './pages/system/SystemAIConfiguration';
import SystemSecurity from './pages/system/SystemSecurity';
import SystemAuditLogs from './pages/system/SystemAuditLogs';
import SystemHealth from './pages/system/SystemHealth';
import SystemAnalytics from './pages/system/SystemAnalytics';

// Auth Pages
import AdminLogin from './pages/auth/AdminLogin';
import SystemLogin from './pages/auth/SystemLogin';
import AuthorityLogin from './pages/auth/AuthorityLogin';
import OfficerLogin from './pages/auth/OfficerLogin';
import OfficerRegister from './pages/auth/OfficerRegister';
import CitizenLogin from './pages/auth/CitizenLogin';
import CitizenRegister from './pages/auth/CitizenRegister';

import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import OfficerLayout from './components/layouts/OfficerLayout';
import AuthorityLayout from './components/layouts/AuthorityLayout';

import OfficerProjects from './pages/dashboards/officer/OfficerProjects';
import OfficerProjectDetails from './pages/dashboards/officer/OfficerProjectDetails';
import OfficerRequests from './pages/dashboards/officer/OfficerRequests';
import OfficerInspections from './pages/dashboards/officer/OfficerInspections';
import OfficerInspectionDetails from './pages/dashboards/officer/OfficerInspectionDetails';
import OfficerKPIs from './pages/dashboards/officer/OfficerKPIs';
import OfficerEvidence from './pages/dashboards/officer/OfficerEvidence';
import OfficerProjectPerformance from './pages/dashboards/officer/OfficerProjectPerformance';
import OfficerRiskAlerts from './pages/dashboards/officer/OfficerRiskAlerts';
import OfficerReports from './pages/dashboards/officer/OfficerReports';
import OfficerNotifications from './pages/dashboards/officer/OfficerNotifications';
import OfficerProfile from './pages/dashboards/officer/OfficerProfile';

import CitizenLayout from './components/layouts/CitizenLayout';

import CitizenRequestsTrack from './pages/dashboards/citizen/TrackRequests';
import CitizenPortalRequestDetails from './pages/dashboards/citizen/RequestDetails';
import CitizenNotifications from './pages/dashboards/citizen/CitizenNotifications';
import CitizenProfile from './pages/dashboards/citizen/CitizenProfile';
import CitizenMap from './pages/dashboards/citizen/CitizenMap';
import CitizenMessages from './pages/dashboards/citizen/CitizenMessages';
import CitizenSettings from './pages/dashboards/citizen/CitizenSettings';

import AiAssistant from './pages/dashboards/citizen/AiAssistant';
import MunicipalServices from './pages/dashboards/citizen/MunicipalServices';
import Announcements from './pages/dashboards/citizen/Announcements';
import RequestHistory from './pages/dashboards/citizen/RequestHistory';
import Feedback from './pages/dashboards/citizen/Feedback';
import NearbyIssues from './pages/dashboards/citizen/NearbyIssues';
import WardInformation from './pages/dashboards/citizen/WardInformation';

// New Report Pages
import CitizenReportIssue from './pages/dashboards/citizen/CitizenReportIssue';
import CitizenReportsList from './pages/dashboards/citizen/CitizenReportsList';
import ReportDetails from './pages/dashboards/citizen/ReportDetails';

// Authority Pages
import AuthorityDashboard from './pages/dashboards/authority/AuthorityDashboard';
import AuthorityReports from './pages/dashboards/authority/AuthorityReports';
import AuthorityReportDetail from './pages/dashboards/authority/AuthorityReportDetail';
import AuthorityOperations from './pages/dashboards/authority/AuthorityOperations';
import AuthorityGIS from './pages/dashboards/authority/AuthorityGIS';
import AuthorityAIInsights from './pages/dashboards/authority/AuthorityAIInsights';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* PUBLIC AUTH ROUTES */}
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/system-access/login" element={<SystemLogin />} />
        <Route path="/system/login" element={<Navigate to="/system-access/login" replace />} />
        <Route path="/super-admin/login" element={<Navigate to="/system-access/login" replace />} />
        <Route path="/super-admin" element={<Navigate to="/system/dashboard" replace />} />
        <Route path="/super-admin/*" element={<Navigate to="/system/dashboard" replace />} />
        
        <Route path="/authority/login" element={<AuthorityLogin />} />
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/register" element={<OfficerRegister />} />

        <Route path="/citizen/login" element={<CitizenLogin />} />
        <Route path="/citizen/register" element={<CitizenRegister />} />

        <Route path="/forgot-password" element={<div className="p-10">Forgot Password Placeholder</div>} />

        {/* PROTECTED SUPER ADMIN (SYSTEM ROOT) ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/system" element={<SystemLayout />}>
            <Route index element={<Navigate to="/system/dashboard" replace />} />
            <Route path="dashboard" element={<SystemDashboard />} />
            <Route path="users" element={<SystemUsers />} />
            <Route path="admin-accounts" element={<SystemUsers onlyAdmins={true} />} />
            <Route path="roles-permissions" element={<SystemRolesPermissions />} />
            <Route path="departments" element={<SystemDepartments />} />
            <Route path="wards-services" element={<SystemDepartments />} />
            <Route path="categories" element={<SystemDepartments />} />
            <Route path="configuration" element={<SystemConfiguration />} />
            <Route path="sla-policies" element={<SystemConfiguration />} />
            <Route path="escalation-rules" element={<SystemConfiguration />} />
            <Route path="ai-configuration" element={<SystemAIConfiguration />} />
            <Route path="model-performance" element={<SystemAIConfiguration />} />
            <Route path="integrations" element={<SystemAIConfiguration />} />
            <Route path="security" element={<SystemSecurity />} />
            <Route path="audit-logs" element={<SystemAuditLogs />} />
            <Route path="access-history" element={<SystemSecurity />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<SystemConfiguration />} />
            <Route path="analytics" element={<SystemAnalytics />} />
            <Route path="*" element={<Navigate to="/system/dashboard" replace />} />
          </Route>
        </Route>

        {/* PROTECTED OPERATIONAL ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="departments" element={<DepartmentsManagement />} />
            <Route path="communications" element={<AdminCommunications />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="projects" element={<ProjectsManagement />} />
            <Route path="sdg" element={<PerformanceKPIs />} />
            <Route path="citizen-requests" element={<CitizenRequests />} />
            <Route path="citizen-requests/:id" element={<CitizenRequestDetails />} />
            <Route path="inspections" element={<FieldInspections />} />
            <Route path="inspections/:id" element={<FieldInspectionDetails />} />
            <Route path="evidence" element={<EvidenceVerification />} />
            <Route path="data-quality" element={<DataQuality />} />
            <Route path="impact" element={<ImpactAnalysis />} />
            <Route path="risk-ai" element={<RiskAI />} />
            <Route path="gis" element={<GISMap />} />
            <Route path="reports" element={<ReportsCenter />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="officers" element={<AdminOfficers />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="super-admin" element={<Navigate to="/system/dashboard" replace />} />
            <Route path="super-admin/*" element={<Navigate to="/system/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* PROTECTED OFFICER ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
          <Route path="/officer" element={<OfficerLayout />}>
            <Route index element={<Navigate to="/officer/dashboard" replace />} />
            <Route path="dashboard" element={<OfficerDashboard />} />
            <Route path="projects" element={<OfficerProjects />} />
            <Route path="projects/:id" element={<OfficerProjectDetails />} />
            <Route path="requests" element={<OfficerRequests />} />
            <Route path="inspections" element={<OfficerInspections />} />
            <Route path="inspections/:id" element={<OfficerInspectionDetails />} />
            <Route path="kpis" element={<OfficerKPIs />} />
            <Route path="evidence" element={<OfficerEvidence />} />
            <Route path="sdg" element={<OfficerProjectPerformance />} />
            <Route path="risk" element={<OfficerRiskAlerts />} />
            <Route path="reports" element={<OfficerReports />} />
            <Route path="notifications" element={<OfficerNotifications />} />
            <Route path="profile" element={<OfficerProfile />} />
            <Route path="*" element={<div className="p-10">Coming Soon</div>} />
          </Route>
        </Route>

        {/* PROTECTED CITIZEN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
          <Route path="/citizen" element={<CitizenLayout />}>
            <Route index element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="dashboard" element={<CitizenDashboard />} />
            
            {/* Services */}
            <Route path="request-service" element={<CitizenRequestService />} />
            <Route path="services" element={<CitizenRequestsTrack />} />
            <Route path="services/:id" element={<CitizenPortalRequestDetails />} />
            <Route path="municipal-services" element={<MunicipalServices />} />
            <Route path="announcements" element={<Announcements />} />
            
            {/* Reports */}
            <Route path="report" element={<CitizenReportIssue />} />
            <Route path="reports" element={<CitizenReportsList />} />
            <Route path="reports/:id" element={<ReportDetails />} />
            
            {/* My Activity & History */}
            <Route path="history" element={<RequestHistory />} />
            <Route path="feedback" element={<Feedback />} />
            
            {/* AI Assistant */}
            <Route path="assistant" element={<AiAssistant />} />

            {/* Communication & Account */}
            <Route path="notifications" element={<CitizenNotifications />} />
            <Route path="messages" element={<CitizenMessages />} />
            <Route path="profile" element={<CitizenProfile />} />
            <Route path="settings" element={<CitizenSettings />} />
            
            {/* Map & City */}
            <Route path="map" element={<CitizenMap />} />
            <Route path="nearby" element={<NearbyIssues />} />
            <Route path="ward-info" element={<WardInformation />} />
          </Route>
        </Route>

        {/* PROTECTED AUTHORITY ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['HIGHER_OFFICIAL', 'ADMIN']} />}>
          <Route path="/authority" element={<AuthorityLayout />}>
            <Route index element={<Navigate to="/authority/dashboard" replace />} />
            <Route path="dashboard" element={<AuthorityDashboard />} />
            <Route path="reports" element={<AuthorityReports />} />
            <Route path="reports/:id" element={<AuthorityReportDetail />} />
            <Route path="operations" element={<AuthorityOperations />} />
            <Route path="gis" element={<AuthorityGIS />} />
            <Route path="ai-insights" element={<AuthorityAIInsights />} />
            <Route path="*" element={<div className="p-10 text-white">Module Not Found</div>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
