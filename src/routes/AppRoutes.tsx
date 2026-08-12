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

// Recepcionista View (única vista activa para recepcionista)
import RecepInicio from '../pages/recepcionista/inicio/Inicio';

import NotFound from '../components/common/NotFound';

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
      return <Navigate to="/inicio" replace />;
    }
  }

  return <>{children}</>;
};

const DashboardContainer: React.FC = () => {
  const { user } = useAuth();
  const userRoleLower = (user?.role || '').toLowerCase();
  const isReceptionist = userRoleLower === 'receptionist' || userRoleLower === 'recepcionista';

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
        {/* Rutas Recepcionista (Se renderiza únicamente la vista de Inicio) */}
        <Route
          path="admin"
          element={isReceptionist ? <RecepInicio /> : <AdminDashboard />}
        />
        <Route
          path="inicio"
          element={isReceptionist ? <RecepInicio /> : <AdminDashboard />}
        />
        <Route
          path="pacientes"
          element={isReceptionist ? <RecepInicio /> : <PatientsManagement />}
        />
        <Route
          path="gestion-citas"
          element={isReceptionist ? <RecepInicio /> : <AppointmentsManagement />}
        />
        <Route
          path="citas"
          element={isReceptionist ? <RecepInicio /> : <AppointmentsManagement />}
        />
        <Route
          path="historial-atencion"
          element={isReceptionist ? <RecepInicio /> : <AdminReportes />}
        />
        <Route
          path="historial"
          element={isReceptionist ? <RecepInicio /> : <AdminReportes />}
        />

        {/* Perfil */}
        <Route path="configuracion" element={<ProfileSettings />} />
        <Route path="perfil" element={<ProfileSettings />} />
        <Route path="settings" element={<ProfileSettings />} />

        {/* Rutas Administrativas (Solo Admin) */}
        <Route
          path="profesionales"
          element={isReceptionist ? <Navigate to="/inicio" replace /> : <AdminProfesionales />}
        />
        <Route
          path="usuarios-roles"
          element={isReceptionist ? <Navigate to="/inicio" replace /> : <UsersManagement />}
        />
        <Route
          path="usuarios"
          element={isReceptionist ? <Navigate to="/inicio" replace /> : <UsersManagement />}
        />
        <Route
          path="reportes"
          element={isReceptionist ? <Navigate to="/inicio" replace /> : <AdminReportes />}
        />
        <Route
          path="estadisticas"
          element={isReceptionist ? <Navigate to="/inicio" replace /> : <AdminReportes />}
        />

        <Route path="*" element={<NotFound />} />
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
        element={isAuthenticated ? <Navigate to="/inicio" replace /> : <Login />}
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
