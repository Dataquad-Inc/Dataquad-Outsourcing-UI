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

export const filterRequirementsByDateRange = createAsyncThunk(
  'requirements/filterByDateRange',
  async ({ startDate, endDate, page = 0, size = 10, search = "", ...filters }, { rejectWithValue }) => {
    try {
      console.log('filterRequirementsByDateRange called with:', { startDate, endDate, page, size, search });

      // Build query parameters with pagination
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: page.toString(),
        size: size.toString(),
      });

      // Add search parameter
      if (search && search.trim() !== "") {
        params.append("search", search.trim());
      }

      // Add other filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      console.log('API call URL:', `/requirements/filterByDate?${params.toString()}`);
      const response = await httpService.get(`/requirements/filterByDate?${params.toString()}`);
      console.log('API Response:', response.data);

      // Return both data and pagination info
      return {
        data: response.data,
        pagination: {
          totalElements: response.data?.totalElements || 0,
          totalPages: response.data?.totalPages || 0,
          currentPage: page,
          pageSize: size,
        },
        filterParams: { startDate, endDate, search }
      };
    } catch (error) {
      console.error('filterRequirementsByDateRange error:', error);
      return rejectWithValue(error);
    }
  }
)

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
      search: "",
    },
    assignedJobs: [],
    filterAssignedRequirements: [],
    filteredTeamLeadRequirements: [],
    requirementsAllBDM: [],
    requirementsSelfBDM: [],
    isFilteredDataRequested: false,
    error: null
  },
  reducers: {
    setFilteredReqDataRequested: (state, action) => {
      state.isFilteredDataRequested = action.payload;
    },
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
        search: "",
      };
      state.isFilteredDataRequested = false;
    }
  },
  extraReducers: (builder) => {
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

      .addCase(filterRequirementsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterRequirementsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.isFilteredDataRequested = true;

        console.log('filterRequirementsByDateRange fulfilled:', action.payload);

        // Extract data from response based on API structure
        let data = [];

        if (action.payload.data) {
          if (Array.isArray(action.payload.data)) {
            // Direct array response
            data = action.payload.data;
            // Use pagination from action.payload.pagination
            state.filteredRequirementPagination = {
              totalElements: action.payload.pagination.totalElements || data.length,
              totalPages: action.payload.pagination.totalPages || Math.ceil(data.length / action.payload.pagination.pageSize),
              currentPage: action.payload.pagination.currentPage || 0,
              pageSize: action.payload.pagination.pageSize || 10,
              hasNext: action.payload.pagination.currentPage < (action.payload.pagination.totalPages - 1),
              hasPrevious: action.payload.pagination.currentPage > 0
            };
          } else if (action.payload.data.content) {
            // Spring Boot paginated response
            data = action.payload.data.content || [];
            state.filteredRequirementPagination = {
              totalElements: action.payload.data.totalElements || 0,
              totalPages: action.payload.data.totalPages || 0,
              currentPage: action.payload.data.pageable?.pageNumber || action.payload.pagination.currentPage,
              pageSize: action.payload.data.pageable?.pageSize || action.payload.pagination.pageSize,
              hasNext: !action.payload.data.last,
              hasPrevious: !action.payload.data.first
            };
          } else if (action.payload.data.data) {
            // Custom paginated response format { data: { data: [], total: number } }
            data = action.payload.data.data || [];
            state.filteredRequirementPagination = {
              totalElements: action.payload.data.total || data.length,
              totalPages: action.payload.data.totalPages ||
                Math.ceil((action.payload.data.total || data.length) / action.payload.pagination.pageSize),
              currentPage: action.payload.pagination.currentPage || 0,
              pageSize: action.payload.pagination.pageSize || 10,
              hasNext: action.payload.data.hasNext ||
                (action.payload.pagination.currentPage < (action.payload.data.totalPages - 1)),
              hasPrevious: action.payload.data.hasPrevious || (action.payload.pagination.currentPage > 0)
            };
          }
        }

        // Update filters in state
        if (action.payload.filterParams) {
          state.filteredRequirementFilters = {
            ...state.filteredRequirementFilters,
            ...action.payload.filterParams
          };
        }

        state.filteredRequirementList = data;
        console.log('Updated state:', {
          data: data.length,
          pagination: state.filteredRequirementPagination
        });
      })
      .addCase(filterRequirementsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.isFilteredDataRequested = false;
        state.error = action.payload?.message || 'Filtering failed';
      })

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
        state.error = action.payload?.message;
      })

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