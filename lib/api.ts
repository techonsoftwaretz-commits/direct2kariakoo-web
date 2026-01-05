import axios from "axios";

// ============================================================
// ✅ Debug which baseURL is being used
// ============================================================
const base =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.direct2kariakoo.com/api";

console.log("🌍 Using API Base URL:", base);

// ============================================================
// ✅ Axios instance
// ============================================================
export const api = axios.create({
  baseURL: base,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// ============================================================
// ✅ Attach token if available
// ============================================================
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// ✅ Handle 401 globally
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }

    if (error.response) {
      console.error("❌ API Error:", error.response.status, error.config?.url);
    } else {
      console.error("❌ Network/Request Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
