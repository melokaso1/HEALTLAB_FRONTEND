import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/auth/login/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
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
      return <Navigate to={getInitialRouteForRole(userRole)} replace />;
    }
  }

  return <>{children}</>;
};

const DashboardContainer: React.FC = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isDoctor = role === 'professional' || role === 'profesional' || role === 'doctor';

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
        <Route
          path=""
          element={<Navigate to={getInitialRouteForRole(user?.role)} replace />}
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="inicio"
          element={
            isDoctor ? (
              <Navigate to="/agenda-medico" replace />
            ) : (
              <AdminDashboard />
            )
          }
        />
        <Route path="agenda-medico" element={<ProfessionalDashboard />} />
        <Route path="mi-agenda" element={<ProfessionalDashboard />} />
        <Route path="profesional" element={<ProfessionalDashboard />} />
        <Route
          path="reportes"
          element={isDoctor ? <ProfessionalHistory /> : <AdminReportes />}
        />
        <Route
          path="estadisticas"
          element={isDoctor ? <ProfessionalHistory /> : <AdminReportes />}
        />
        <Route
          path="historial-atencion"
          element={isDoctor ? <ProfessionalHistory /> : <AdminReportes />}
        />
        <Route
          path="historial"
          element={isDoctor ? <ProfessionalHistory /> : <AdminReportes />}
        />
        <Route
          path="profesionales"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProfesionales />
            </ProtectedRoute>
          }
        />
        <Route
          path="usuarios-roles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersManagement />
            </ProtectedRoute>
          }
        />
        <Route path="pacientes" element={<PatientsManagement />} />
        <Route path="gestion-citas" element={<AppointmentsManagement />} />
        <Route path="citas" element={<AppointmentsManagement />} />
        <Route
          path="configuracion"
          element={isDoctor ? <DoctorProfileSettings /> : <ProfileSettings />}
        />
        <Route
          path="perfil"
          element={isDoctor ? <DoctorProfileSettings /> : <ProfileSettings />}
        />
        <Route
          path="settings"
          element={isDoctor ? <DoctorProfileSettings /> : <ProfileSettings />}
        />
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
          isAuthenticated ? (
            <Navigate to={getInitialRouteForRole(user?.role)} replace />
          ) : (
            <Login />
          )
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
