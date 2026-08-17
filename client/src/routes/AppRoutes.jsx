import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ApplicationPayment from "../pages/auth/ApplicationPayment";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ChangePassword from "../pages/auth/ChangePassword";

import Dashboard from "../pages/dashboard/Dashboard";
import AdministratorDashboard from "../pages/administrator/AdministratorDashboard";
import StudentManagement from "../pages/administrator/StudentManagement";
import TeacherManagement from "../pages/administrator/TeacherManagement";
import AdminManagement from "../pages/administrator/AdminManagement";
import BatchManagement from "../pages/administrator/BatchManagement";

import AdminDashboard from "../pages/admin/AdminDashboard";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import StudentDashboard from "../pages/student/StudentDashboard";

import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Home */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Authentication & Admission */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />

        {/* Public Admission Flow */}
        <Route path="/register" element={<Register />} />
        <Route path="/apply" element={<Register />} />
        <Route path="/apply/payment" element={<ApplicationPayment />} />

        {/* Password Change (Requires Auth) */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Administrator Routes */}
        <Route
          path="/administrator/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
              <AdministratorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/students"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR", "ADMIN", "TEACHER"]}>
              <StudentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/teachers"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
              <TeacherManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/admins"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
              <AdminManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/batches"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR", "ADMIN"]}>
              <BatchManagement />
            </ProtectedRoute>
          }
        />

        {/* Role-Specific Dashboards */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Generic Dashboard Fallback */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h1 className="text-4xl font-bold text-red-600">
                404 - Page Not Found
              </h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;