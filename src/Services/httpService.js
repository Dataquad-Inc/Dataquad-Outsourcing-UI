import axios from 'axios';

// DEV
// const DEV_API_BASE_URL = 'http://182.18.177.16'; // Replace with your actual
// export const API_BASE_URL = DEV_API_BASE_URL

// // PROD
 const PROD_API_BASE_URL = 'https://mymulya.com'; // Replace with your actual API URL
//  const PROD_API_BASE_URL = 'http://192.168.0.115:8083'; // Replace with your actual API URL
export const API_BASE_URL = PROD_API_BASE_URL

// Set axios default to send cookies on all requests
axios.defaults.withCredentials = true;

const httpService = {
  get: (url, params = {}, config = {}) =>
    axios.get(`${API_BASE_URL}${url}`, {
      params,
      withCredentials: true, // ensure cookies sent with GET
      ...config,
    }),

  post: (url, data, config = {}) =>
    axios.post(`${API_BASE_URL}${url}`, data, {
      withCredentials: true, // ensure cookies sent with POST
      ...config,
    }),

  put: (url, data, config = {}) =>
    axios.put(`${API_BASE_URL}${url}`, data, {
      withCredentials: true, // ensure cookies sent with PUT
      ...config,
    }),

  delete: (url, config = {}) =>
    axios.delete(`${API_BASE_URL}${url}`, {
      withCredentials: true, // ensure cookies sent with DELETE
      ...config,
    }),
};

export default httpService;
