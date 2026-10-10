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
import FeeManagement from "../pages/administrator/FeeManagement";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminReports from "../pages/admin/AdminReports";
import TimetableGenerator from "../pages/admin/TimetableGenerator";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import ManageSubjectTeachers from "../pages/teacher/ManageSubjectTeachers";
import TeacherQuizDashboard from "../pages/teacher/TeacherQuizDashboard";
import QuizBuilder from "../pages/teacher/QuizBuilder";
import QuizResults from "../pages/teacher/QuizResults";
import TeacherAttendance from "../pages/teacher/TeacherAttendance";

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentFeeView from "../pages/student/StudentFeeView";
import StudentQuizList from "../pages/student/StudentQuizList";
import QuizPlayer from "../pages/student/QuizPlayer";
import QuizResultView from "../pages/student/QuizResultView";
import StudentResultDashboard from "../pages/student/StudentResultDashboard";
import StudentAttendance from "../pages/student/StudentAttendance";

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
        <Route
          path="/administrator/timetable"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR", "ADMIN"]}>
              <TimetableGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/fees"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
              <FeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/reports"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRATOR", "ADMIN"]}>
              <AdminReports />
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
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <TimetableGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <FeeManagement />
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
          path="/teacher/subject-teachers"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <ManageSubjectTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherQuizDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes/create"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <QuizBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <QuizBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes/:id/results"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <QuizResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherAttendance />
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
        <Route
          path="/student/fees"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentFeeView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentQuizList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes/:id/play"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <QuizPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes/:id/attempt/:attemptId"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <QuizPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes/:id/result"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <QuizResultView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentResultDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentAttendance />
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