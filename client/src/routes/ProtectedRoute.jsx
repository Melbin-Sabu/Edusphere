import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/common/Loader";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading, getRoleDashboard } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen text="Verifying Authentication..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = (user.role || "").toUpperCase();

  // If user has first login pending and is not ADMINISTRATOR, force change-password page
  if (user.isFirstLogin && userRole !== "ADMINISTRATOR" && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // If specific roles are specified, check user's role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    const uppercaseAllowedRoles = allowedRoles.map((r) => r.toUpperCase());
    if (!uppercaseAllowedRoles.includes(userRole)) {
      // Redirect unauthorized user to their authorized dashboard
      const targetDashboard = getRoleDashboard(userRole);
      return <Navigate to={targetDashboard} replace />;
    }
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, loading, getRoleDashboard } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const userRole = (user.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(userRole);
      navigate(targetDashboard, { replace: true });
    }
  }, [loading, isAuthenticated, user, getRoleDashboard, navigate]);

  if (loading) {
    return <Loader fullScreen text="Checking session..." />;
  }

  // If user IS authenticated, DO NOT show login or forgot-password.
  // Immediately redirect to their role dashboard using replace: true!
  if (isAuthenticated && user) {
    const userRole = (user.role || "").toUpperCase();

    if (user.isFirstLogin && userRole !== "ADMINISTRATOR") {
      return <Navigate to="/change-password" replace />;
    }

    const targetDashboard = getRoleDashboard(userRole);
    return <Navigate to={targetDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;
