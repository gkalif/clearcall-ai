import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  userSignup: (data: { email: string; name: string; password: string }) =>
    api.post("/auth/signup", data),
  userLogin: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  businessSignup: (data: { email: string; name: string; password: string }) =>
    api.post("/auth/business/signup", data),
  businessLogin: (data: { email: string; password: string }) =>
    api.post("/auth/business/login", data),
};

// ── Messages ──────────────────────────────────────────────────
export const messagesAPI = {
  upload: (formData: FormData) =>
    api.post("/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: () => api.get("/messages"),
  get: (id: number) => api.get(`/messages/${id}`),
  reprocess: (id: number) => api.post(`/messages/${id}/process`),
};

// ── Business ──────────────────────────────────────────────────
export const businessAPI = {
  getMessages: () => api.get("/business/messages"),
  getMessage: (id: number) => api.get(`/business/messages/${id}`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/business/messages/${id}/status`, { status }),
  getProfile: () => api.get("/business/profile"),
};

// ── Audio URL helper ──────────────────────────────────────────
export const audioUrl = (path: string | null | undefined) =>
  path ? `${API_BASE}/${path}` : null;
