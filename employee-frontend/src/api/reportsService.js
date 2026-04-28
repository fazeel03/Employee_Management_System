// reportsService.js - Direct API calls to FastAPI Reports Microservice
import axios from 'axios';

const REPORTS_BASE_URL = '/api/reports';

const reportsApi = axios.create({
    baseURL: REPORTS_BASE_URL,
});

reportsApi.interceptors.request.use((config) => {
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

            if (tenantId) config.headers['X-Tenant-Id'] = String(tenantId);
            if (tenantKey) config.headers['X-Tenant-Key'] = String(tenantKey);
        } catch (_) {
            // Ignore invalid user payload.
        }
    }

    return config;
});

export const getEmployeesJSON = () =>
    reportsApi.get('/employees/export?format=json');

export const getDepartmentSummary = () =>
    reportsApi.get('/departments/summary');

export const getAttendanceSummary = (start_date = null, end_date = null) => {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    return reportsApi.get(`/attendance/summary?${params}`);
};

export const downloadEmployeesCSV = () =>
    reportsApi.get('/employees/export?format=csv', { responseType: 'blob' });

export const downloadEmployeesExcel = () =>
    reportsApi.get('/employees/export-excel', { responseType: 'blob' });

export const downloadAttendanceCSV = (start_date = null, end_date = null) => {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    return reportsApi.get(`/attendance/export?${params}`, { responseType: 'blob' });
};

export const downloadAttendanceExcel = (start_date = null, end_date = null) => {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    return reportsApi.get(`/attendance/export-excel?${params}`, { responseType: 'blob' });
};
