// src/utils/api.js
import axios from "axios";

// Base URL for API
const BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log("API URL:", BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// GET request
export const apiGet = async (endpoint, params = {}) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST request
export const apiPost = async (endpoint, data = {}) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PUT request
export const apiPut = async (endpoint, data = {}) => {
  try {
    const response = await api.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// DELETE request
export const apiDelete = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PATCH request
export const apiPatch = async (endpoint, data = {}) => {
  try {
    const response = await api.patch(endpoint, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ================================
//  User APIs
// ================================
// export const userAPI = {
//   register: (userData) => apiPost("/users/register", userData),
//   login: (credentials) => apiPost("/users/login", credentials),
//   logout: (userId) => apiPost(`/users/logout/${userId}`),
//   forgotPassword: (email) => apiPost("/users/forgot-password", email),
//   resetPassword: (resetData) => apiPost("/users/reset-password", resetData),
//   getUser: (userId) => apiGet(`/users/${userId}`),
//   // updateUser: (userId, userData) => apiPut(`/users/${userId}`, userData),
//   // deleteUser: (userId) => apiDelete(`/users/${userId}`),
//   // getAllUsers: (params) => apiGet("/users", params),
//   refreshToken: () => apiPost("/users/refresh-token"),
// };

// ================================
//  Employees APIs
// ================================
// export const employeeAPI = {
//   getAll: (params) => apiGet("/users/allUsers", params),
//   getById: (id) => apiGet(`/users/${id}`),
//   create: (data) => apiPost("/users", data),
//   update: (id, data) => apiPut(`/users/${id}`, data),
//   deleteEmployee: (userId) => apiDelete(`/users/delete/${userId}`),
// };

// ================================
//  Hotlist APIs
// ================================
export const hotlistAPI = {
  getAllConsultants: (params) => apiGet("/hotlist/allConsultants", params),
  searchConsultants: (searchTerm, params) =>
    apiGet(`/hotlist/search/${encodeURIComponent(searchTerm)}`, params),
  getConsultantById: (consultantId) => apiGet(`/hotlist/consultant/${consultantId}`),
  createConsultant: (data) => apiPost("/hotlist/saveConsultant", data),
  updateConsultant: (id, data) =>
    apiPut(`/hotlist/updateConsultant/${id}`, data),
  deleteConsultant: (id) => apiDelete(`/hotlist/deleteConsultant/${id}`),
};

export default api;
