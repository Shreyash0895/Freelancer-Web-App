import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 second timeout
});

// ── Attach JWT token to every request ──
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// ── Auto logout on 401 (expired/invalid token) ──
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login"; // ✅ fixed: was "/" now "/login"
    }
    return Promise.reject(err);
  }
);

export default API;
export { BASE_URL };