import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";
import axios from "axios";

export const fetchAllRequirementsBDM = createAsyncThunk(
  'requirements/All/BDM',
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpService.get('/requirements/getAssignments');
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
)

export const fetchRequirementsBdmSelf = createAsyncThunk(
  'requirements/BDM/self',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;
      const response = await httpService.get(`/requirements/bdmrequirements/${userId}`);
      return response.data || [];
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
)

// Filter requirements by date range with pagination support
export const filterRequirementsByDateRange = createAsyncThunk(
  'requirements/filterByDateRange',
  async ({ startDate, endDate, page = 0, size = 10, globalSearch = "", ...filters }, { rejectWithValue }) => {
    try {
      // Build query parameters with pagination
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: page.toString(),
        size: size.toString(),
      });

      // Add global search if provided
      if (globalSearch && globalSearch.trim() !== "") {
        params.append("globalSearch", globalSearch.trim());
      }

      // Add other filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await httpService.get(`/requirements/filterByDate?${params.toString()}`);

      // Return both data and pagination info
      return {
        data: response.data,
        pagination: {
          totalElements: response.data?.totalElements || 0,
          totalPages: response.data?.totalPages || 0,
          currentPage: page,
          pageSize: size,
        },
        filterParams: { startDate, endDate }
      };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
)

// Filter requirements for employee - keep without pagination for now
export const filterRequirementsByRecruiter = createAsyncThunk(
  'recruiter/requirements/filterByDateRange',
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const recruiterId = state.auth.userId;

      const response = await httpService.get(`/requirements/recruiter/${recruiterId}/filterByDate?startDate=${startDate}&endDate=${endDate}`);

      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
)

export const getRequirementDetailsByJobId = createAsyncThunk(
  'requirements/getByJobId',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await httpService.get(`/requirements/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching requirement by job ID:', error);
      return rejectWithValue(error);
    }
  }
);

export const fetchAssignedJobs = createAsyncThunk(
  'assignedJobs/fetch',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await httpService.get(`/requirements/recruiter/${userId}`);
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.message) {
        return rejectWithValue(response.data.message);
      } else {
        return rejectWithValue("Data fetched was not in the expected format");
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const requirementSlice = createSlice({
  name: "requirement",
  initialState: {
    loading: false,
    filteredRequirementList: [],
    // Pagination state for filtered data
    filteredRequirementPagination: {
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10,
      hasNext: false,
      hasPrevious: false
    },
    filteredRequirementFilters: {
      startDate: null,
      endDate: null,
      globalSearch: "",
      otherFilters: {}
    },
    assignedJobs: [],
    filterAssignedRequirements: [],
    filteredTeamLeadRequirements: [],
    requirementsAllBDM: [],
    requirementsSelfBDM: [],
    isFilteredReqRequested: false,
    error: null
  },
  reducers: {
    setFilteredReqDataRequested: (state, action) => {
      state.isFilteredDataRequested = action.payload;
    },
    // Add pagination actions
    setFilteredRequirementPage: (state, action) => {
      state.filteredRequirementPagination.currentPage = action.payload;
    },
    setFilteredRequirementSize: (state, action) => {
      state.filteredRequirementPagination.pageSize = action.payload;
    },
    setFilteredRequirementFilters: (state, action) => {
      state.filteredRequirementFilters = {
        ...state.filteredRequirementFilters,
        ...action.payload
      };
    },
    resetFilteredRequirements: (state) => {
      state.filteredRequirementList = [];
      state.filteredRequirementPagination = {
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 10,
        hasNext: false,
        hasPrevious: false
      };
      state.filteredRequirementFilters = {
        startDate: null,
        endDate: null,
        globalSearch: "",
        otherFilters: {}
      };
      state.isFilteredDataRequested = false;
    }

  }, extraReducers: (builder) => {
    builder

      .addCase(fetchAllRequirementsBDM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRequirementsBDM.fulfilled, (state, action) => {
        state.loading = false;
        state.requirementsAllBDM = action.payload;
      })
      .addCase(fetchAllRequirementsBDM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })

      .addCase(fetchRequirementsBdmSelf.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequirementsBdmSelf.fulfilled, (state, action) => {
        state.loading = false;
        state.requirementsSelfBDM = action.payload;
      })
      .addCase(fetchRequirementsBdmSelf.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })

      // Filter Requirement List By date Range (with pagination)
      .addCase(filterRequirementsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterRequirementsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.isFilteredDataRequested = true;

        // Extract data from response based on API structure
        let data = [];
        if (action.payload.data) {
          // Handle different API response structures
          if (Array.isArray(action.payload.data)) {
            data = action.payload.data;
          } else if (action.payload.data.content) {
            // Spring Boot paginated response
            data = action.payload.data.content || [];
            state.filteredRequirementPagination = {
              totalElements: action.payload.data.totalElements || 0,
              totalPages: action.payload.data.totalPages || 0,
              currentPage: action.payload.data.pageable?.pageNumber || 0,
              pageSize: action.payload.data.pageable?.pageSize || 10,
              hasNext: !action.payload.data.last,
              hasPrevious: !action.payload.data.first
            };
          } else if (action.payload.data.data) {
            // Custom paginated response format
            data = action.payload.data.data || [];
            state.filteredRequirementPagination = {
              totalElements: action.payload.data.total || data.length,
              totalPages: action.payload.data.totalPages ||
                Math.ceil((action.payload.data.total || data.length) /
                  (action.payload.pagination.pageSize || 10)),
              currentPage: action.payload.pagination.currentPage || 0,
              pageSize: action.payload.pagination.pageSize || 10,
              hasNext: action.payload.data.hasNext || false,
              hasPrevious: action.payload.data.hasPrevious || false
            };
          } else {
            // Assume response is the data array itself
            data = action.payload.data || [];
          }
        }

        // If pagination info was provided separately in action.payload.pagination
        if (action.payload.pagination && !action.payload.data?.content) {
          state.filteredRequirementPagination = {
            totalElements: action.payload.pagination.totalElements || data.length,
            totalPages: action.payload.pagination.totalPages ||
              Math.ceil(data.length / (action.payload.pagination.pageSize || 10)),
            currentPage: action.payload.pagination.currentPage || 0,
            pageSize: action.payload.pagination.pageSize || 10,
            hasNext: action.payload.pagination.totalPages ?
              (action.payload.pagination.currentPage < action.payload.pagination.totalPages - 1) : false,
            hasPrevious: action.payload.pagination.currentPage > 0
          };
        }

        // Fallback if no pagination info was extracted
        if (!state.filteredRequirementPagination.totalElements && data.length > 0) {
          state.filteredRequirementPagination = {
            totalElements: data.length,
            totalPages: Math.ceil(data.length / state.filteredRequirementPagination.pageSize),
            currentPage: 0,
            pageSize: state.filteredRequirementPagination.pageSize,
            hasNext: false,
            hasPrevious: false
          };
        }

        // Update filters in state
        if (action.payload.filterParams) {
          state.filteredRequirementFilters = {
            ...state.filteredRequirementFilters,
            ...action.payload.filterParams
          };
        }

        state.filteredRequirementList = data;
      })
      .addCase(filterRequirementsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.isFilteredDataRequested = false;
        state.error = action.payload?.message || 'Filtering failed';

      })

      // Filter Recruiter requirements (keep as is - no pagination)
      .addCase(filterRequirementsByRecruiter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterRequirementsByRecruiter.fulfilled, (state, action) => {
        state.loading = false;
        state.assignedJobs = action.payload;
      })
      .addCase(filterRequirementsByRecruiter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;

      })

      //jobDetails tracking 
      .addCase(getRequirementDetailsByJobId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRequirementDetailsByJobId.fulfilled, (state, action) => {
        state.loading = false;
        state.requirementDetails = action.payload;
      })
      .addCase(getRequirementDetailsByJobId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      })


      .addCase(fetchAssignedJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.assignedJobs = action.payload;
      })
      .addCase(fetchAssignedJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load assigned jobs';
        state.assignedJobs = [];
      })

  }
})

export const {
  setFilteredReqDataRequested,
  setFilteredRequirementPage,
  setFilteredRequirementSize,
  setFilteredRequirementFilters,
  resetFilteredRequirements
} = requirementSlice.actions;
export default requirementSlice.reducer;