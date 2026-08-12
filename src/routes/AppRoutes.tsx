import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/auth/login/Login';
import DashboardLayout from '../components/layout/DashboardLayout';

// Admin Views
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminReportes from '../pages/admin/reportes/AdminReportes';
import UsersManagement from '../pages/admin/users/UsersManagement';
import PatientsManagement from '../pages/admin/patients/PatientsManagement';
import AppointmentsManagement from '../pages/admin/appointments/AppointmentsManagement';
import AdminProfesionales from '../pages/admin/profesionales/AdminProfesionales';
import ProfileSettings from '../pages/admin/profile/ProfileSettings';
import ProfessionalDashboard from '../pages/professional/ProfessionalDashboard';
import ProfessionalHistory from '../pages/professional/ProfessionalHistory';
import DoctorProfileSettings from '../pages/professional/DoctorProfileSettings';

// Recepcionista Views
import RecepInicio from '../pages/recepcionista/inicio/Inicio';
import RecepHistorial from '../pages/recepcionista/historial/Historial';

import NotFound from '../components/common/NotFound';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

const getInitialRouteForRole = (role?: string) => {
  const r = (role || '').toLowerCase();
  if (r === 'professional' || r === 'profesional' || r === 'doctor') {
    return '/agenda-medico';
  }
  if (r === 'receptionist' || r === 'recepcionista') {
    return '/gestion-citas';
  }
  return '/admin';
};

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
    <DashboardLayout
      userName={user?.name || (isReceptionist ? 'Ana Martínez' : 'Juan Perez')}
      userRole={getRoleLabel(user?.role)}
    >
      <Routes>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="inicio" element={<AdminDashboard />} />
        <Route path="reportes" element={<AdminReportes />} />
        <Route path="estadisticas" element={<AdminReportes />} />
        <Route path="historial-atencion" element={<AdminReportes />} />
        <Route path="profesionales" element={<AdminProfesionales />} />
        <Route path="usuarios-roles" element={<UsersManagement />} />
        <Route path="usuarios" element={<UsersManagement />} />
        <Route path="pacientes" element={<PatientsManagement />} />
        <Route path="gestion-citas" element={<AppointmentsManagement />} />
        <Route path="citas" element={<AppointmentsManagement />} />
        <Route path="configuracion" element={<ProfileSettings />} />
        <Route path="perfil" element={<ProfileSettings />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

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
