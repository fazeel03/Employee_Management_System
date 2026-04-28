import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request debugging interceptor (TEMPORARY)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ems_token');
    const userRaw = localStorage.getItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ems_user');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const tenantId = user?.tenant_id || user?.tenantId;
        const tenantKey = user?.tenant_key || user?.tenantKey;

        if (tenantId) {
          config.headers['X-Tenant-Id'] = String(tenantId);
        }

        if (tenantKey) {
          config.headers['X-Tenant-Key'] = String(tenantKey);
        }
      } catch (error) {
        // Ignore corrupted local user payload and proceed with token-only auth.
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.config?.url);
    
    // Don't handle 401 here - let AuthContext handle it
    // This prevents duplicate token clearing
    return Promise.reject(error);
  }
);

export default axiosInstance;
