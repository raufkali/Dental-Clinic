import axios from 'axios';

// Automatically detect if running under file: protocol (Electron production bundle) or http:
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const API_BASE_URL = isFileProtocol ? 'http://127.0.0.1:5001/api' : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage (fallback to default offline token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dental_token') || 'offline_doctor_token';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({
      ...error,
      message,
      requiresConfirmation: error.response?.data?.requiresConfirmation,
      remainingBalance: error.response?.data?.remainingBalance
    });
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  recoverPassword: (data) => api.post('/auth/recover', data),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data)
};

export const patientsAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`)
};

export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  toggleStatus: (id) => api.patch(`/services/${id}/toggle-status`),
  delete: (id) => api.delete(`/services/${id}`)
};

export const treatmentsAPI = {
  getAll: (params) => api.get('/treatments', { params }),
  getById: (id) => api.get(`/treatments/${id}`),
  create: (data) => api.post('/treatments', data),
  update: (id, data) => api.put(`/treatments/${id}`, data),
  delete: (id) => api.delete(`/treatments/${id}`),
  addNote: (id, note) => api.post(`/treatments/${id}/notes`, { note }),
  updateStatus: (id, status) => api.patch(`/treatments/${id}/status`, { status }),
  settle: (id, reason) => api.patch(`/treatments/${id}/settle`, { reason })
};

export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  void: (id, reason) => api.post(`/payments/${id}/void`, { reason })
};

export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  void: (id, reason) => api.post(`/transactions/${id}/void`, { reason })
};

export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/appointments/${id}`)
};

export const reportsAPI = {
  getDashboard: (chartPeriod, today) => api.get('/reports/dashboard', { params: { chartPeriod, today } }),
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getServices: () => api.get('/reports/services'),
  getPatientStatement: (patientId) => api.get(`/reports/patient-statement/${patientId}`)
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const backupAPI = {
  create: () => api.post('/backup/create'),
  list: () => api.get('/backup/list'),
  restore: (filename) => api.post('/backup/restore', { filename })
};

export const auditAPI = {
  get: (params) => api.get('/audit-logs', { params })
};

export default api;
