import axios from "axios";

// In dev: relative "/api" is proxied by Vite → localhost:5050
// In staging (Docker): http://localhost:5050
// In prod: https://api.atherasys.com
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const VITE_API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? "http://localhost:5050" : "https://api.gradlogic.atherasys.com");
const baseURL = VITE_API_URL.endsWith("/") ? `${VITE_API_URL}api` : `${VITE_API_URL}/api`;

const api = axios.create({
  baseURL,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 by forcing re-authentication when the request is not an auth endpoint.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as { url?: string };
    const isAuthEndpoint = typeof original?.url === "string" && original.url.startsWith("/auth/");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
