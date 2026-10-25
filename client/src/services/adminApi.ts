import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to handle auth errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect if unauthenticated
      localStorage.removeItem('user_data');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await apiClient.get('/dashboards/admin');
    return response.data;
  },

  // Projects
  getProjects: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },
  
  getProjectById: async (id: string | number) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (projectData: any) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  },

  updateProject: async (id: string | number, projectData: any) => {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  },

  archiveProject: async (id: string | number) => {
    const response = await apiClient.post(`/projects/${id}/archive`);
    return response.data;
  },

  assignOfficerToProject: async (projectId: string | number, officerId: string | number) => {
    const response = await apiClient.post(`/projects/${projectId}/assign`, { officer_id: officerId });
    return response.data;
  },

  // Departments
  getDepartments: async () => {
    const response = await apiClient.get('/departments');
    return response.data;
  },
  
  createDepartment: async (deptData: any) => {
    const response = await apiClient.post('/departments', deptData);
    return response.data;
  },

  // Officers
  getOfficers: async (filters?: any) => {
    const response = await apiClient.get('/admin/officers', { params: filters });
    return response.data;
  },
  getOfficersStatistics: async () => {
    const response = await apiClient.get('/admin/officers/statistics');
    return response.data;
  },
  approveOfficer: async (id: number) => {
    const response = await apiClient.patch(`/admin/officers/${id}/approve`);
    return response.data;
  },
  rejectOfficer: async (id: number, reason: string = '') => {
    const response = await apiClient.patch(`/admin/officers/${id}/reject`, { reason });
    return response.data;
  },
  updateOfficer: async (id: number, updates: any) => {
    const response = await apiClient.patch(`/admin/officers/${id}`, updates);
    return response.data;
  },

  // Citizen Requests
  getRequests: async () => {
    const response = await apiClient.get('/admin/citizen-requests');
    return response.data;
  },
  
  getRequestById: async (id: string | number) => {
    const response = await apiClient.get(`/admin/citizen-requests/${id}`);
    return response.data;
  },

  assignRequest: async (id: string | number, data: { officer_id: string | number }) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/assign`, data);
    return response.data;
  },

  updateRequestStatus: async (id: string | number, data: { status: string, remarks?: string, evidence_path?: string }) => {
    const response = await apiClient.patch(`/admin/citizen-requests/${id}/status`, data);
    return response.data;
  },

  verifyRequest: async (id: string | number) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/verify`);
    return response.data;
  },

  rejectRequest: async (id: string | number, data: { reason: string }) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/reject`, data);
    return response.data;
  },

  assignDepartment: async (id: string | number, data: { department_id: string | number, sla_days: number }) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/assign-department`, data);
    return response.data;
  },

  escalateRequest: async (id: string | number, data: { level: number, reason: string }) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/escalate`, data);
    return response.data;
  },

  verifyCompletion: async (id: string | number) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/verify-completion`);
    return response.data;
  },

  rejectCompletion: async (id: string | number, data: { reason: string }) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/reject-completion`, data);
    return response.data;
  },

  addRequestNote: async (id: string | number, data: { note: string }) => {
    const response = await apiClient.post(`/admin/citizen-requests/${id}/notes`, data);
    return response.data;
  },

  // Inspections
  getInspections: async () => {
    const response = await apiClient.get('/admin/inspections');
    return response.data;
  },

  getInspectionById: async (id: string | number) => {
    const response = await apiClient.get(`/admin/inspections/${id}`);
    return response.data;
  },

  scheduleInspection: async (data: any) => {
    const response = await apiClient.post('/admin/inspections', data);
    return response.data;
  },

  verifyInspection: async (id: string | number) => {
    const response = await apiClient.post(`/admin/inspections/${id}/verify`);
    return response.data;
  },

  rejectInspection: async (id: string | number, data: { reason: string }) => {
    const response = await apiClient.post(`/admin/inspections/${id}/reject`, data);
    return response.data;
  },

  // KPIs
  getKpis: async () => {
    const response = await apiClient.get('/kpis');
    return response.data;
  },

  getKpiOverview: async () => {
    const response = await apiClient.get('/kpis/overview');
    return response.data;
  },

  getKpiById: async (id: string | number) => {
    const response = await apiClient.get(`/kpis/${id}`);
    return response.data;
  },

  createKpi: async (data: any) => {
    const response = await apiClient.post('/kpis', data);
    return response.data;
  },

  addKpiMeasurement: async (id: string | number, data: any) => {
    const response = await apiClient.post(`/kpis/${id}/measurements`, data);
    return response.data;
  },

  archiveKpi: async (id: string | number) => {
    const response = await apiClient.delete(`/kpis/${id}`);
    return response.data;
  },

  // Evidence Verification
  getEvidence: async (params?: any) => {
    const response = await apiClient.get('/admin/evidence', { params });
    return response.data;
  },

  getEvidenceStats: async () => {
    const response = await apiClient.get('/admin/evidence/statistics');
    return response.data;
  },

  getEvidenceById: async (id: string | number) => {
    const response = await apiClient.get(`/admin/evidence/${id}`);
    return response.data;
  },

  getEvidenceHistory: async (id: string | number) => {
    const response = await apiClient.get(`/admin/evidence/${id}/history`);
    return response.data;
  },

  verifyEvidence: async (id: string | number, data: { verification_note?: string }) => {
    const response = await apiClient.post(`/admin/evidence/${id}/verify`, data);
    return response.data;
  },

  rejectEvidence: async (id: string | number, data: { reason: string }) => {
    const response = await apiClient.post(`/admin/evidence/${id}/reject`, data);
    return response.data;
  },

  requestEvidenceReplacement: async (id: string | number, data: { reason: string }) => {
    const response = await apiClient.post(`/admin/evidence/${id}/request-replacement`, data);
    return response.data;
  },

  // Data Quality
  getDataQualitySummary: async () => {
    const response = await apiClient.get('/admin/data-quality/summary');
    return response.data;
  },
  getDataQualityIssues: async (params?: any) => {
    const response = await apiClient.get('/admin/data-quality/issues', { params });
    return response.data;
  },
  getDataQualityIssueDetails: async (id: string | number) => {
    const response = await apiClient.get(`/admin/data-quality/issues/${id}`);
    return response.data;
  },
  runDataQualityScan: async () => {
    const response = await apiClient.post('/admin/data-quality/scan');
    return response.data;
  },
  resolveDataQualityIssue: async (id: string | number) => {
    const response = await apiClient.patch(`/admin/data-quality/issues/${id}/resolve`);
    return response.data;
  },
  ignoreDataQualityIssue: async (id: string | number, data: { reason: string }) => {
    const response = await apiClient.patch(`/admin/data-quality/issues/${id}/ignore`, data);
    return response.data;
  },
  getDataQualityHistory: async () => {
    const response = await apiClient.get('/admin/data-quality/history');
    return response.data;
  },

  // Impact Analysis
  getImpactSummary: async () => {
    const response = await apiClient.get('/admin/impact-analysis/summary');
    return response.data;
  },
  getImpactProjects: async () => {
    const response = await apiClient.get('/admin/impact-analysis/projects');
    return response.data;
  },
  getImpactProjectDetails: async (id: string | number) => {
    const response = await apiClient.get(`/admin/impact-analysis/projects/${id}`);
    return response.data;
  },
  getImpactDepartments: async () => {
    const response = await apiClient.get('/admin/impact-analysis/departments');
    return response.data;
  },

  // Risk & AI
  getRiskSummary: async () => {
    const res = await axios.get('/api/admin/risk/summary', { withCredentials: true });
    return res.data;
  },
  getRiskProjects: async () => {
    const res = await axios.get('/api/admin/risk/projects', { withCredentials: true });
    return res.data;
  },
  getRiskProjectDetails: async (id: number) => {
    const res = await axios.get(`/api/admin/risk/projects/${id}`, { withCredentials: true });
    return res.data;
  },
  
  // AI Intelligence Center
  getComplaintClusters: async () => {
    const res = await axios.get('/api/ai-intelligence/complaint-clusters', { withCredentials: true });
    return res.data;
  },
  getPriorityPredictions: async () => {
    const res = await axios.get('/api/ai-intelligence/priority-predictions', { withCredentials: true });
    return res.data;
  },

  // GIS Map
  getGisData: async () => {
    const response = await apiClient.get('/admin/gis/data');
    return response.data;
  },
  getGisFilters: async () => {
    const response = await apiClient.get('/admin/gis/filters');
    return response.data;
  },

  // Reports Center
  getReportHistory: async () => {
    const response = await apiClient.get('/admin/reports/history');
    return response.data;
  },
  previewReport: async (reportType: string, filters: any) => {
    const response = await apiClient.post(`/admin/reports/preview/${reportType}`, filters);
    return response.data;
  },
  generateReport: async (data: any) => {
    const response = await apiClient.post('/admin/reports/generate', data);
    return response.data;
  },
  deleteReport: async (id: number | string) => {
    const response = await apiClient.delete(`/admin/reports/${id}`);
    return response.data;
  },
  getReportDownloadUrl: (id: number | string) => {
    return `${API_BASE_URL}/admin/reports/download/${id}`;
  },

  // Risk, Impact etc... (To be expanded as modules are built)

  // Audit Logs
  getAuditLogs: async (filters: any) => {
    const response = await apiClient.get('/admin/audit-logs', { params: filters });
    return response.data;
  },
  getAuditLogStats: async () => {
    const response = await apiClient.get('/admin/audit-logs/statistics');
    return response.data;
  },

  // Notifications
  getNotifications: async (filters: any) => {
    const response = await apiClient.get('/admin/notifications', { params: filters });
    return response.data;
  },
  getNotificationStats: async () => {
    const response = await apiClient.get('/admin/notifications/statistics');
    return response.data;
  },
  markNotificationRead: async (id: number) => {
    const response = await apiClient.patch(`/admin/notifications/${id}/read`);
    return response.data;
  },
  archiveNotification: async (id: number) => {
    const response = await apiClient.patch(`/admin/notifications/${id}/archive`);
    return response.data;
  },
  markAllNotificationsRead: async () => {
    const response = await apiClient.post('/admin/notifications/mark-all-read');
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },
  updateSettings: async (updates: Record<string, any>) => {
    const response = await apiClient.put('/admin/settings', updates);
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await apiClient.get('/admin/settings/health');
    return response.data;
  }
};
