import axios from "axios";

// PROD
const PROD_API_BASE_URL = "https://mymulya.com";

// With REACT_APP_USE_LOCAL_SERVICES=true the base is empty, making requests
// relative so src/setupProxy.js can route them to the local microservices.
export const API_BASE_URL =
  process.env.REACT_APP_USE_LOCAL_SERVICES === "true" ? "" : PROD_API_BASE_URL;

// Set axios default to send cookies on all requests
axios.defaults.withCredentials = true;

const httpService = {
  get: (url, params = {}, config = {}) => {
    // If params is provided, pass it directly to axios
    return axios.get(`${API_BASE_URL}${url}`, {
      params: params,  // Important: pass params directly
      withCredentials: true,
      ...config,
    });
  },

  post: (url, data, config = {}) => {
    // Handle post with potential query params
    const { params, ...restConfig } = config;
    return axios.post(`${API_BASE_URL}${url}`, data, {
      params: params,
      withCredentials: true,
      ...restConfig,
    });
  },

  put: (url, data, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.put(`${API_BASE_URL}${url}`, data, {
      params: params,
      withCredentials: true,
      ...restConfig,
    });
  },
  
  patch: (url, data, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.patch(`${API_BASE_URL}${url}`, data, {
      params: params,
      withCredentials: true,
      ...restConfig,
    });
  },

  delete: (url, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.delete(`${API_BASE_URL}${url}`, {
      params: params,
      withCredentials: true,
      ...restConfig,
    });
  },
};

export default httpService;