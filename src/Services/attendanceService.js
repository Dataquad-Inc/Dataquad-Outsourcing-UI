// src/services/attendanceService.js
import axios from 'axios';

const API_BASE_URL = 'https://mymulya.com/users/attendance';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add userId header
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId') || 'ADRTIN291';
  config.headers['userId'] = userId;
  return config;
});

// User/Employee APIs
export const userAPI = {
  getAllEmployees: () => api.get('/employees'),
  getEmployeeById: (userId) => api.get(`/employees/${userId}`),
  searchEmployees: (keyword) => api.get('/employees/search', { params: { keyword } }),
};

// Attendance Cycle APIs
export const attendanceCycleAPI = {
  createCycle: (data) => api.post('/cycles', data),
  getAllCycles: () => api.get('/cycles'),
  getCycleById: (cycleId) => api.get(`/cycles/${cycleId}`),
  updateCycle: (cycleId, data) => api.put(`/cycles/${cycleId}`, data),
  closeCycle: (cycleId) => api.put(`/cycles/${cycleId}/close`),
  generateMonthlyAttendance: (cycleId) => api.post(`/cycles/${cycleId}/generate`),
};

// Holiday APIs
export const holidayAPI = {
  createHoliday: (data) => api.post('/holidays', data),
  getAllHolidays: () => api.get('/holidays'),
  getHolidayById: (holidayId) => api.get(`/holidays/${holidayId}`),
  updateHoliday: (holidayId, data) => api.put(`/holidays/${holidayId}`, data),
  deleteHoliday: (holidayId) => api.delete(`/holidays/${holidayId}`),
};

// Week Off Configuration APIs
export const weekOffAPI = {
  configureWeekOff: (dayOfWeek, isWeekOff, entity = 'IN') => 
    api.post('/weekoff/configure', null, { params: { dayOfWeek, isWeekOff, entity } }),
  getWeekOffDays: (entity = 'IN') => api.get('/weekoff/days', { params: { entity } }),
  isWeekOff: (dayOfWeek, entity = 'IN') => api.get(`/weekoff/check/${dayOfWeek}`, { params: { entity } }),
  resetToDefault: (entity = 'IN') => api.post('/weekoff/reset', null, { params: { entity } }),
};

// Attendance Operations APIs
export const attendanceAPI = {
  generateDailyAttendance: (attendanceDate) => api.post('/generate-daily', { attendanceDate }),
  markAttendance: (data) => api.post('/mark', data),
  updateAttendance: (data) => api.put('/update', data),
  getAttendanceGrid: (employeeId, cycleId) => api.get(`/grid/${employeeId}/cycle/${cycleId}`),
  getAttendanceSummary: (employeeId, cycleId) => api.get(`/summary/${employeeId}/cycle/${cycleId}`),
  getMonthlyAttendance: (params) => api.get('/monthly', { params }),
  getAttendanceStats: (cycleId) => api.get(`/stats/cycle/${cycleId}`),
  bulkUpdateAttendance: (requests) => api.post('/bulk-update', requests),
};

export default api;