import axios from "axios";

// Base URL for API
// const BASE_URL = "http://192.168.0.115:8092";
const BASE_URL = "https://mymulya.com";
console.log("API URL:", BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// Add auth token to each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access");
      // Optionally redirect to login or clear auth token
      // localStorage.removeItem("authToken");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ========== Base HTTP Methods ==========
export const apiGet = async (endpoint, params = {}) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`GET ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiPost = async (endpoint, data = {}) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`POST ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiPut = async (endpoint, data = {}) => {
  try {
    const response = await api.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`PUT ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiDelete = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`DELETE ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiPatch = async (endpoint, data = {}) => {
  try {
    const response = await api.patch(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`PATCH ${endpoint} failed:`, error);
    throw error;
  }
};

// ========== Form Data Methods ==========
export const apiPostFormData = async (endpoint, formData) => {
  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`POST FormData ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiPutFormData = async (endpoint, formData) => {
  try {
    const response = await api.put(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`PUT FormData ${endpoint} failed:`, error);
    throw error;
  }
};

// ========== User Authentication APIs ==========
export const userAPI = {
  // Authentication
  register: async (userData) => {
    return apiPost("/users/register", userData);
  },

  login: async (credentials) => {
    return apiPost("/users/login", credentials);
  },

  logout: async (userId) => {
    return apiPost(`/users/logout/${userId}`);
  },

  refreshToken: async () => {
    return apiPost("/users/refresh-token");
  },

  // Password Management
  forgotPassword: async (email) => {
    return apiPost("/users/forgot-password", { email });
  },

  resetPassword: async (resetData) => {
    return apiPost("/users/reset-password", resetData);
  },

  // User Management
  getUser: async (userId) => {
    return apiGet(`/users/${userId}`);
  },

  updateUser: async (userId, userData) => {
    return apiPut(`/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return apiDelete(`/users/${userId}`);
  },

  getAllUsers: async (params = {}) => {
    return apiGet("/users/allUsers", params);
  },
};

// ========== Employee Management APIs ==========
export const employeeAPI = {
  // Get all employees with pagination and filtering
  getAll: async (params = {}) => {
    return apiGet("/users/allUsers", params);
  },

  // Get employee by ID
  getById: async (id) => {
    if (!id) throw new Error("Employee ID is required");
    return apiGet(`/users/${id}`);
  },

  // Create new employee
  create: async (employeeData) => {
    if (!employeeData) throw new Error("Employee data is required");
    return apiPost("/users", employeeData);
  },

  // Update employee
  update: async (id, employeeData) => {
    if (!id) throw new Error("Employee ID is required");
    if (!employeeData) throw new Error("Employee data is required");
    return apiPut(`/users/${id}`, employeeData);
  },

  // Delete employee
  deleteEmployee: async (userId) => {
    if (!userId) throw new Error("User ID is required");
    return apiDelete(`/users/delete/${userId}`);
  },

  // Get employees by role
  getByRole: async (role) => {
    if (!role) throw new Error("Role is required");
    return apiGet(`/users/getByRole/${role}`);
  },
};

// ========= team Management APIs ==========
export const teamAPI = {
  // Create new team
  createTeam: async (userId, teamdata) => {
    if (!teamdata) throw new Error("team data is not found");
    return apiPost(`/users/assignTeamLead/${userId}`, teamdata);
  },

  getAllEmps: async () => {
    return apiGet("/users/getAll");
  },

  getTeam: async (teamLeadId) => {
    if (!teamLeadId) throw new Error("teamLeadId is required");
    return apiGet(`/users/associated-users/${teamLeadId}`);
  },
};

// ==========Requirements API ===========

export const requirementsAPI = {
  // Get all requirements with pagination and filtering
  getAllRequirements: async (params = {}) => {
    return apiGet("/api/us/requirements/allRequirements", params);
  },

  // Create new requirement with form data (for file uploads)
  createRequirement: async (userId, requirementData) => {
    if (!requirementData) throw new Error("Form data is required");
    return apiPostFormData(
      `/api/us/requirements/post-requirement${userId}`,
      requirementData
    );
  },
};

//=========== US-Clients Management APIs =========

export const usClientsAPI = {
  //get all clients
  getAllClients: async (params = {}) => {
    return apiGet("/api/us/requirements/client/getAllClientsNames");
  },
};

// ======= RTR FORM SUBMISSION  API ===========

export const rightToRepresentAPI = {
  submitRTR: async (userId, rtrData) => {
    if (!userId) throw new Error("User ID is required");
    if (!rtrData) throw new Error("RTR data is required");

    return apiPost(`/hotlist/create-rtr/${userId}`, rtrData);
  },

  getAllRTR: async (params = {}) => {
    return apiGet("/hotlist/rtr-list", params);
  },

  getRTRById: async (rtrId) => {
    if (!rtrId) throw new Error("RTR ID is required");
    return apiGet(`/hotlist/rtr-id/${rtrId}`);
  },

  updateRTR: async (rtrId, userId, payload) => {
    if (!rtrId) throw new Error("RTR ID is required");
    if (!userId) throw new Error("User ID is required");
    if (!payload) throw new Error("Payload is required");

    return apiPut(`/hotlist/update-rtr/rtr/${rtrId}/user/${userId}`, payload);
  },

  deleteRTR: async (rtrId, userId) => {
    if (!rtrId) throw new Error("RTR ID is required");
    if (!userId) throw new Error("User ID is required");

    return apiDelete(`/hotlist/delete-rtr/${rtrId}/${userId}`, {
      data: { deletedBy: userId },
    });
  },
};

// ========== Hotlist/Consultant Management APIs ==========
export const hotlistAPI = {
  // Get all consultants with pagination
  getAllConsultants: async (params = {}) => {
    return apiGet("/hotlist/allConsultants", params);
  },

  // Get consultants by user ID
  getConsultantsByUserId: async (userId, params = {}) => {
    if (!userId) throw new Error("User ID is required");
    return apiGet(`/hotlist/consultantsByUserId/${userId}`, params);
  },

  getSalesExecConsultants: async (userId, params = {}) => {
    if (!userId) throw new Error("User ID is required");
    return apiGet(`/hotlist/salesExecutiveConsultants/${userId}`, params);
  },

  // Get team consultants - Added this missing function
  getTeamConsultants: async (userId, params = {}) => {
    if (!userId) throw new Error("User ID is required");
    return apiGet(`/hotlist/getTeamConsultants/${userId}`, params);
  },

  // Search consultants
  searchConsultants: async (searchTerm, params = {}) => {
    if (!searchTerm) throw new Error("Search term is required");
    return apiGet(`/hotlist/search/${encodeURIComponent(searchTerm)}`, params);
  },

  // Get consultant by ID
  getConsultantById: async (consultantId) => {
    if (!consultantId) throw new Error("Consultant ID is required");
    return apiGet(`/hotlist/consultant/${consultantId}`);
  },

  // Create new consultant
  createConsultant: async (formData, queryParams = {}) => {
    if (!formData) throw new Error("Form data is required");
    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/hotlist/addConsultant${
      queryString ? `?${queryString}` : ""
    }`;
    return apiPostFormData(endpoint, formData);
  },

  // Update consultant
  updateConsultant: async (consultantId, consultantDto) => {
    console.log("-----------", consultantDto);
    if (!consultantId) throw new Error("Consultant ID is required");
    if (!consultantDto) throw new Error("Consultant data is required");
    return apiPut(`/hotlist/updateConsultant/${consultantId}`, consultantDto);
  },

  // Delete consultant
  deleteConsultant: async (consultantId, userId) => {
    if (!consultantId) throw new Error("Consultant ID is required");
    return apiDelete(`/hotlist/deleteConsultant/${consultantId}/${userId}`);
  },

  // Get users by role
  getUsersByRole: async (role) => {
    if (!role) throw new Error("Role is required");
    return apiGet(`/hotlist/getUsers/${role}`);
  },

  // Export consultants
  exportConsultants: async (params = {}) => {
    return apiGet("/hotlist/export", params);
  },

  // Bulk operations
  bulkDeleteConsultants: async (consultantIds) => {
    if (!consultantIds || !Array.isArray(consultantIds)) {
      throw new Error("Consultant IDs array is required");
    }
    return apiPost("/hotlist/bulkDelete", { consultantIds });
  },

  bulkUpdateConsultants: async (updates) => {
    if (!updates) throw new Error("Update data is required");
    return apiPut("/hotlist/bulkUpdate", updates);
  },

  getYetToOnboardConsultants: async (params = {}) => {
    return apiGet("/hotlist/yetToOnBoardConsultants", params);
  },

  moveToHotlist: async (consultantId) => {
    return apiPatch(`hotlist/moveToHotlist/${consultantId}`);
  },
  sendApproval: async (consultantId, userId, isApproved) => {
    return apiPatch(
      `/hotlist/modify-approvalStatus/${userId}?consultantId=${consultantId}&isApproved=${isApproved}`
    );
  },
  moveToYetToOnboard: async (consultantId) => {
    return apiPatch(`hotlist/moveToYetToOnBoard/${consultantId}`);
  },
};

// ========== File Management APIs ==========
export const fileAPI = {
  // Upload resume file
  uploadResume: async (file, consultantId) => {
    if (!file) throw new Error("File is required");
    if (!consultantId) throw new Error("Consultant ID is required");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("consultantId", consultantId);
    return apiPostFormData("/files/upload/resume", formData);
  },

  // Upload document file
  uploadDocument: async (file, consultantId, documentType) => {
    if (!file) throw new Error("File is required");
    if (!consultantId) throw new Error("Consultant ID is required");
    if (!documentType) throw new Error("Document type is required");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("consultantId", consultantId);
    formData.append("documentType", documentType);
    return apiPostFormData("/files/upload/document", formData);
  },

  // Download file
  downloadFile: async (fileId) => {
    if (!fileId) throw new Error("File ID is required");
    return apiGet(`/files/download/${fileId}`);
  },

  // Delete file
  deleteFile: async (fileId) => {
    if (!fileId) throw new Error("File ID is required");
    return apiDelete(`/files/delete/${fileId}`);
  },
};

// ========== Helper Functions ==========
export const apiHelpers = {
  // Build query string from object
  buildQueryString: (params) => {
    return new URLSearchParams(params).toString();
  },

  // Handle API errors consistently
  handleApiError: (error, customMessage = "An error occurred") => {
    console.error(customMessage, error);

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        success: false,
        status,
        message: data?.message || customMessage,
        data: data || null,
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        status: 0,
        message: "Network error. Please check your connection.",
        data: null,
      };
    } else {
      // Other error
      return {
        success: false,
        status: 0,
        message: error.message || customMessage,
        data: null,
      };
    }
  },

  // Format API response consistently
  formatApiResponse: (response, customMessage = "Success") => {
    return {
      success: true,
      status: response.status || 200,
      message: response.message || customMessage,
      data: response.data || response,
    };
  },
};

export default api;
