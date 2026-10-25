import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const roleRoutes: Record<string, string> = {
  SUPER_ADMIN: "/system/dashboard",
  ADMIN: "/admin/dashboard",
  HIGHER_OFFICIAL: "/authority/dashboard",
  DEPARTMENT_HEAD: "/department/dashboard",
  FIELD_OFFICER: "/officer/dashboard",
  OFFICER: "/officer/dashboard",
  CITIZEN: "/citizen/dashboard",
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; role: string | null } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success && res.data.data) {
          setAuth({ isAuthenticated: true, role: res.data.data.role });
        } else {
          setAuth({ isAuthenticated: false, role: null });
        }
      } catch (err) {
        setAuth({ isAuthenticated: false, role: null });
      }
    };
    checkAuth();
  }, []);

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  const userRole = (auth.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

  if (!auth.isAuthenticated) {
    // If route requires strictly SUPER_ADMIN
    if (normalizedAllowed.length === 1 && normalizedAllowed.includes('SUPER_ADMIN')) {
      return <Navigate to="/system-access/login" replace />;
    }
    if (normalizedAllowed.includes('ADMIN') || normalizedAllowed.includes('SUPER_ADMIN')) {
      return <Navigate to="/admin/login" replace />;
    }
    if (normalizedAllowed.includes('OFFICER') || normalizedAllowed.includes('FIELD_OFFICER')) {
      return <Navigate to="/officer/login" replace />;
    }
    if (normalizedAllowed.includes('HIGHER_OFFICIAL')) {
      return <Navigate to="/authority/login" replace />;
    }
    return <Navigate to="/citizen/login" replace />;
  }

  // Strict check:
  // If route is SUPER_ADMIN only, only SUPER_ADMIN is permitted (ADMIN is rejected!)
  let isAuthorized = false;
  if (normalizedAllowed.includes(userRole)) {
    isAuthorized = true;
  } else if (userRole === 'SUPER_ADMIN' && normalizedAllowed.includes('ADMIN')) {
    // Super Admin has oversight on Admin routes
    isAuthorized = true;
  }

  if (!isAuthorized) {
    // Redirect to authoritative role dashboard
    const targetDashboard = roleRoutes[userRole] || "/";
    return <Navigate to={targetDashboard} replace />;
  }

  return <Outlet />;
}
