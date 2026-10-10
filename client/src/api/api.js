import axios from "axios";

// Export BASE_URL so other files can use it for constructing absolute URLs (like images)
export const BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:5000/api` : "http://localhost:5000/api");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized errors automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

      // Clear authentication storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Dispatch custom event so AuthContext can update state in real time
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));

        // Redirect to /login if not already on login page or attempting login
        if (!isLoginRequest && currentPath !== "/login") {
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;