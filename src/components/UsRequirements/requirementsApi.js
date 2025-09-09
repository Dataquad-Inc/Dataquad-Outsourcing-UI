// requirementsApi.js
import { apiGet, apiPost, apiPut, apiDelete } from "../../utils/apiUtils";

const requirementsApi = {
  // Get all requirements with pagination and filtering
  getAllRequirements: async (params = {}) => {
    const queryParams = {
      page: params.page || 0,
      size: params.size || 20,
      ...(params.search && { search: params.search.trim() }),
      ...(params.status && { status: params.status }),
      ...(params.jobMode && { jobMode: params.jobMode }),
      ...(params.clientName && { clientName: params.clientName }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortDirection && { sortDirection: params.sortDirection })
    };
    
    return apiGet("/api/us/requirements/allRequirements", queryParams);
  },

  // Create new requirement
  createRequirement: async (requirementData) => {
    if (!requirementData) {
      throw new Error("Requirement data is required");
    }

    // Validate required fields
    const requiredFields = ['jobTitle', 'clientName', 'status'];
    for (const field of requiredFields) {
      if (!requirementData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    return apiPost("/api/us/requirements/post-requirement", requirementData);
  },

  // Update requirement (when API becomes available)
  updateRequirement: async (jobId, updateData) => {
    if (!jobId) {
      throw new Error("Job ID is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }

    // TODO: Replace with actual update endpoint when available
    return apiPut(`/api/us/requirements/update/${jobId}`, updateData);
  },

  // Delete requirement (when API becomes available)
  deleteRequirement: async (jobId) => {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    // TODO: Replace with actual delete endpoint when available
    return apiDelete(`/api/us/requirements/delete/${jobId}`);
  },

  // Get requirement by ID (when API becomes available)
  getRequirementById: async (jobId) => {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    // TODO: Replace with actual get by ID endpoint when available
    return apiGet(`/api/us/requirements/${jobId}`);
  },

  // Get requirements statistics (when API becomes available)
  getRequirementsStats: async () => {
    // TODO: Replace with actual stats endpoint when available
    return apiGet("/api/us/requirements/stats");
  },

  // Search requirements with advanced filters
  searchRequirements: async (searchParams) => {
    const queryParams = {
      page: searchParams.page || 0,
      size: searchParams.size || 20,
      ...(searchParams.query && { search: searchParams.query.trim() }),
      ...(searchParams.skills && { skills: searchParams.skills }),
      ...(searchParams.experience && { experience: searchParams.experience }),
      ...(searchParams.location && { location: searchParams.location }),
      ...(searchParams.salaryRange && { 
        minSalary: searchParams.salaryRange.min,
        maxSalary: searchParams.salaryRange.max
      }),
      ...(searchParams.dateRange && {
        startDate: searchParams.dateRange.start,
        endDate: searchParams.dateRange.end
      })
    };

    return apiGet("/api/us/requirements/search", queryParams);
  },

  // Bulk operations (when API becomes available)
  bulkUpdateRequirements: async (jobIds, updateData) => {
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      throw new Error("Job IDs array is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }

    // TODO: Replace with actual bulk update endpoint when available
    return apiPost("/api/us/requirements/bulk-update", {
      jobIds,
      updateData
    });
  },

  bulkDeleteRequirements: async (jobIds) => {
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      throw new Error("Job IDs array is required");
    }

    // TODO: Replace with actual bulk delete endpoint when available
    return apiPost("/api/us/requirements/bulk-delete", { jobIds });
  },

  // Export requirements (when API becomes available)
  exportRequirements: async (params = {}) => {
    const queryParams = {
      format: params.format || 'csv', // csv, excel, pdf
      ...(params.filters && params.filters),
      ...(params.columns && { columns: params.columns })
    };

    // TODO: Replace with actual export endpoint when available
    return apiGet("/api/us/requirements/export", queryParams);
  }
};

export default requirementsApi;