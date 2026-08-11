import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/login/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <DashboardLayout userName="Juan Perez" userRole="Director Médico">
            <AdminDashboard />
          </DashboardLayout>
        }
      />
      <Route
        path="/"
        element={
          <DashboardLayout userName="Juan Perez" userRole="Director Médico">
            <AdminDashboard />
          </DashboardLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
