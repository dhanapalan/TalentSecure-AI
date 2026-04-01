import axios from "axios";

// In dev: relative "/api" is proxied by Vite → localhost:5050
// In prod (Vercel): VITE_API_URL = "https://api.atherasys.com"
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
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
