import axios from "axios";

// Uses VITE_API_URL from .env in dev, and from Vercel env vars in production
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const API = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on expired/invalid token
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default API;
