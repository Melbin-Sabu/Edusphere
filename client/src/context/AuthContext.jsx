import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("token"));
  });

  const [loading, setLoading] = useState(true);

  // Helper to map role to dashboard path
  const getRoleDashboard = useCallback((roleInput) => {
    const roleUpper = (roleInput || "").toUpperCase();
    switch (roleUpper) {
      case "ADMINISTRATOR":
        return "/administrator/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      case "TEACHER":
        return "/teacher/dashboard";
      case "STUDENT":
        return "/student/dashboard";
      default:
        return "/dashboard";
    }
  }, []);

  // Restore/verify session from backend on app load
  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Validate token with backend /api/auth/me
      const response = await api.get("/auth/me");
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setToken(storedToken);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        throw new Error("Invalid session response");
      }
    } catch (error) {
      console.warn("Session restoration failed:", error?.response?.data?.message || error.message);
      // Clear invalid session
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Event listener for 401 unauthorized
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    };

    // Event listener for browser Back/Forward navigation (popstate)
    const handlePopState = () => {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    };

    // Event listener for pages restored from browser back-forward cache (BFCache)
    const handlePageShow = (event) => {
      if (event.persisted) {
        restoreSession();
      }
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [restoreSession]);

  // Centralized login method
  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Centralized logout method
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Helper method to update local user state
  const updateUser = (updatedUserData) => {
    const mergedUser = { ...user, ...updatedUserData };
    localStorage.setItem("user", JSON.stringify(mergedUser));
    setUser(mergedUser);
  };

  const getUserRole = () => {
    return user?.role ? user.role.toUpperCase() : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        restoreSession,
        updateUser,
        getUserRole,
        getRoleDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
