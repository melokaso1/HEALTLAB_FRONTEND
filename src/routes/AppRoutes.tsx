import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/auth/login/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const hasPermission = allowedRoles.some(
      (r) => r.toLowerCase() === userRole || (r === 'profesional' && userRole === 'professional')
    );
    if (!hasPermission) {
      const defaultRoute = userRole === 'admin' ? '/admin' : '/admin';
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return <>{children}</>;
};

const DashboardContainer: React.FC = () => {
  const { user } = useAuth();

  const getRoleLabel = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'Director Médico';
    if (r === 'profesional' || r === 'professional') return 'Médico / Profesional';
    if (r === 'recepcionista' || r === 'receptionist') return 'Recepcionista';
    return role || 'Usuario';
  };

  return (
    <DashboardLayout userName={user?.name || 'Juan Perez'} userRole={getRoleLabel(user?.role)}>
      <Routes>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="inicio" element={<AdminDashboard />} />
        <Route path="reportes" element={<AdminDashboard />} />
        <Route path="profesionales" element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminDashboard />} />
        <Route path="pacientes" element={<AdminDashboard />} />
        <Route path="citas" element={<AdminDashboard />} />
        <Route path="historial" element={<AdminDashboard />} />
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    </DashboardLayout>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/admin" replace /> : <Login />
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardContainer />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
