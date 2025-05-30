import axios from 'axios';

// DEV

const DEV_API_BASE_URL = 'http://182.18.177.16'; // Replace with your actual 
export const API_BASE_URL = DEV_API_BASE_URL

//Prod

//  const PROD_API_BASE_URL = 'https://mymulya.com'; // Replace with your actual API URL
// export const API_BASE_URL = PROD_API_BASE_URL


const httpService = {
  get: (url, params = {}) => axios.get(`${API_BASE_URL}${url}`, { params }),

  post: (url, data, config = {}) => axios.post(`${API_BASE_URL}${url}`, data, config),

  put: (url, data, config = {}) => axios.put(`${API_BASE_URL}${url}`, data, config),

  delete: (url, config = {}) => axios.delete(`${API_BASE_URL}${url}`, config),
};

export default httpService;
