import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import OfficerDashboard from './pages/dashboards/OfficerDashboard';
import CitizenDashboard from './pages/dashboards/citizen/CitizenDashboard';
import CitizenRequestService from './pages/dashboards/citizen/CitizenRequestService';

// Admin Pages
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

import AdminLogin from './pages/auth/AdminLogin';
import OfficerLogin from './pages/auth/OfficerLogin';
import OfficerRegister from './pages/auth/OfficerRegister';
import CitizenLogin from './pages/auth/CitizenLogin';
import CitizenRegister from './pages/auth/CitizenRegister';

import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import OfficerLayout from './components/layouts/OfficerLayout';

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

// New Report Pages
import CitizenReportIssue from './pages/dashboards/citizen/CitizenReportIssue';
import CitizenReportsList from './pages/dashboards/citizen/CitizenReportsList';
import ReportDetails from './pages/dashboards/citizen/ReportDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* PUBLIC AUTH ROUTES */}
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/register" element={<OfficerRegister />} />

        <Route path="/citizen/login" element={<CitizenLogin />} />
        <Route path="/citizen/register" element={<CitizenRegister />} />

        <Route path="/forgot-password" element={<div className="p-10">Forgot Password Placeholder</div>} />

        {/* PROTECTED ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="projects" element={<ProjectsManagement />} />
            <Route path="departments" element={<DepartmentsManagement />} />
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
            <Route path="*" element={<div className="p-10">Module Not Found</div>} />
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
            
            {/* Reports */}
            <Route path="report" element={<CitizenReportIssue />} />
            <Route path="reports" element={<CitizenReportsList />} />
            <Route path="reports/:id" element={<ReportDetails />} />
            
            {/* Communication & Account */}
            <Route path="notifications" element={<CitizenNotifications />} />
            <Route path="messages" element={<CitizenMessages />} />
            <Route path="profile" element={<CitizenProfile />} />
            <Route path="settings" element={<CitizenSettings />} />
            <Route path="map" element={<CitizenMap />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
