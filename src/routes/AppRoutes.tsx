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

// Recepcionista Views
import RecepInicio from '../pages/recepcionista/inicio/Inicio';
import RecepPacientes from '../pages/recepcionista/pacientes/Pacientes';
import RecepCitas from '../pages/recepcionista/citas/Citas';
import RecepHistorial from '../pages/recepcionista/historial/Historial';

// Doctor / Professional Views
import DoctorInicio from '../pages/professional/DoctorInicio';
import ProfessionalDashboard from '../pages/professional/ProfessionalDashboard';
import DoctorCitas from '../pages/professional/DoctorCitas';
import ProfessionalHistory from '../pages/professional/ProfessionalHistory';

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
  const isDoctor =
    userRoleLower === 'professional' ||
    userRoleLower === 'profesional' ||
    userRoleLower === 'medico' ||
    userRoleLower === 'doctor';

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
        {/* Inicio / Agenda */}
        <Route path="agenda-medico" element={<ProfessionalDashboard />} />
        <Route path="mi-agenda" element={<ProfessionalDashboard />} />
        <Route
          path="admin"
          element={isReceptionist ? <RecepInicio /> : isDoctor ? <DoctorInicio /> : <AdminDashboard />}
        />
        <Route
          path="inicio"
          element={isReceptionist ? <RecepInicio /> : isDoctor ? <DoctorInicio /> : <AdminDashboard />}
        />
        <Route path="doctor-inicio" element={<DoctorInicio />} />

        {/* Pacientes (Vista directorio de pacientes para recepcionista) */}
        <Route
          path="pacientes"
          element={isReceptionist ? <RecepPacientes /> : <PatientsManagement />}
        />

        {/* Citas */}
        <Route
          path="gestion-citas"
          element={
            isDoctor ? (
              <DoctorCitas />
            ) : isReceptionist ? (
              <RecepCitas />
            ) : (
              <AppointmentsManagement />
            )
          }
        />
        <Route
          path="citas"
          element={
            isDoctor ? (
              <DoctorCitas />
            ) : isReceptionist ? (
              <RecepCitas />
            ) : (
              <AppointmentsManagement />
            )
          }
        />

        {/* Historial */}
        <Route
          path="historial-atencion"
          element={
            isDoctor ? (
              <ProfessionalHistory />
            ) : isReceptionist ? (
              <RecepHistorial />
            ) : (
              <AdminReportes />
            )
          }
        />
        <Route
          path="historial"
          element={
            isDoctor ? (
              <ProfessionalHistory />
            ) : isReceptionist ? (
              <RecepHistorial />
            ) : (
              <AdminReportes />
            )
          }
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
