import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; role: string | null } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success) {
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    // If not authenticated, send them to login based on what they tried to access
    if (allowedRoles.includes('ADMIN')) return <Navigate to="/admin/login" replace />;
    if (allowedRoles.includes('OFFICER')) return <Navigate to="/officer/login" replace />;
    return <Navigate to="/citizen/login" replace />;
  }

  if (!allowedRoles.includes(auth.role as string)) {
    // If they are authenticated but wrong role, send them to their own dashboard
    if (auth.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (auth.role === 'OFFICER') return <Navigate to="/officer" replace />;
    if (auth.role === 'CITIZEN') return <Navigate to="/citizen" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
