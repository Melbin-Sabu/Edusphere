import axios from "axios";

// Dynamically use current hostname (localhost on PC, 192.168.x.x on mobile phone)
const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

const api = axios.create({
  baseURL: `http://${hostname}:5000/api`,
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