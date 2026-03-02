import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
