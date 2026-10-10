import axios from "axios";
import { getTenantHeader } from "../utils/tenant";

// PROD
const PROD_API_BASE_URL = "https://mymulya.com";

// With REACT_APP_USE_LOCAL_SERVICES=true the base is empty, making requests
// relative so src/setupProxy.js can route them to the local microservices.
export const API_BASE_URL =
  process.env.REACT_APP_USE_LOCAL_SERVICES === "true" ? "" : PROD_API_BASE_URL;

// Set axios default to send cookies on all requests
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  config.headers = {
    ...(config.headers || {}),
    ...getTenantHeader(),
  };
  return config;
});

const withTenant = (config = {}) => ({
  withCredentials: true,
  ...config,
  headers: {
    ...getTenantHeader(),
    ...(config.headers || {}),
  },
});

const httpService = {
  get: (url, params = {}, config = {}) => {
    return axios.get(`${API_BASE_URL}${url}`, {
      params: params,
      ...withTenant(config),
    });
  },

  post: (url, data, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.post(`${API_BASE_URL}${url}`, data, {
      params: params,
      ...withTenant(restConfig),
    });
  },

  put: (url, data, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.put(`${API_BASE_URL}${url}`, data, {
      params: params,
      ...withTenant(restConfig),
    });
  },
  
  patch: (url, data, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.patch(`${API_BASE_URL}${url}`, data, {
      params: params,
      ...withTenant(restConfig),
    });
  },

  delete: (url, config = {}) => {
    const { params, ...restConfig } = config;
    return axios.delete(`${API_BASE_URL}${url}`, {
      params: params,
      ...withTenant(restConfig),
    });
  },
};

export default httpService;
