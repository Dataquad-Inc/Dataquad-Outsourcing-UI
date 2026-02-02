import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";

// Fetch all submissions with pagination
export const fetchAllSubmissions = createAsyncThunk(
  'submissions/fetchAll',
  async(_, { rejectWithValue }) => {
    try {
      const response = await httpService.get('/candidate/submissions');
      return response.data;
    } catch(error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchSubmissionsTeamLead = createAsyncThunk(
  'submissions/teamlead',
  async(_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;
      const response = await httpService.get(`/candidate/submissions/teamlead/${userId}`);
      return response.data;
    } catch(error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

// Filter Submissions by Date Range with pagination support - For Admin
export const filterSubmissionsByDateRange = createAsyncThunk(
  'submissions/filterByDateRange',
  async (
    { startDate, endDate, page = 0, size = 10, globalSearch = "", ...filters },
    { rejectWithValue }
  ) => {
    try {
      // Build query parameters
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
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(
        `https://mymulya.com/candidate/submissions/filterByDate?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Handle the API response format
      let data = [];
      let paginationInfo = {
        totalElements: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: size,
      };

      // If response is an object (paginated format)
      if (responseData && typeof responseData === "object") {
        if (Array.isArray(responseData.data)) {
          data = responseData.data;

          paginationInfo.totalElements =
            responseData.totalElements ?? paginationInfo.totalElements;
          paginationInfo.totalPages =
            responseData.totalPages ?? paginationInfo.totalPages;
          paginationInfo.currentPage =
            responseData.currentPage ?? paginationInfo.currentPage;
          paginationInfo.pageSize =
            responseData.pageSize ?? paginationInfo.pageSize;
        }
        // Legacy: response is an array
        else if (Array.isArray(responseData)) {
          data = responseData;
        }
        // Single object response
        else {
          data = [responseData];
        }
      }

      return {
        data,
        pagination: paginationInfo,
        filterParams: { startDate, endDate },
      };
    } catch (error) {
      console.error("Error in filterSubmissionsByDateRange:", error);
      return rejectWithValue(error.message || "Failed to filter submissions");
    }
  }
);

// Filter Submissions by Date Range for Recruiter
export const filterSubmissionsByRecruiter = createAsyncThunk(
  'submissions/filterByRecruiterDate',
  async (
    { startDate, endDate, page = 0, size = 10, globalSearch = "", ...filters },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const recruiterId = state.auth.userId;
      
      // Build query parameters
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
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(
        `https://mymulya.com/candidate/submissions/${recruiterId}/filterByDate?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      let data = [];
      let paginationInfo = {
        totalElements: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: size,
      };

      if (responseData && typeof responseData === "object") {
        if (Array.isArray(responseData.data)) {
          data = responseData.data;
          paginationInfo.totalElements =
            responseData.totalElements ?? paginationInfo.totalElements;
          paginationInfo.totalPages =
            responseData.totalPages ?? paginationInfo.totalPages;
          paginationInfo.currentPage =
            responseData.currentPage ?? paginationInfo.currentPage;
          paginationInfo.pageSize =
            responseData.pageSize ?? paginationInfo.pageSize;
        } else if (Array.isArray(responseData)) {
          data = responseData;
        } else {
          data = [responseData];
        }
      }

      return {
        data,
        pagination: paginationInfo,
        filterParams: { startDate, endDate },
      };
    } catch (error) {
      console.error("Error in filterSubmissionsByRecruiter:", error);
      return rejectWithValue(error.message || "Failed to filter submissions");
    }
  }
);

// Filter Submissions by Date Range for TeamLead
export const filterSubmissionsByTeamLead = createAsyncThunk(
  'submissions/filterByTeamLeadDate',
  async (
    {
      startDate,
      endDate,
      page = 0,
      size = 10,
      globalSearch = "",
      isTeam = false,
      ...filters
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const userId = state.auth.userId;

      // Build query parameters
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: page.toString(),
        size: size.toString(),
      });

      // Add team flag if needed
      if (isTeam) {
        params.append("team", "true");
      }

      // Add global search if provided
      if (globalSearch && globalSearch.trim() !== "") {
        params.append("globalSearch", globalSearch.trim());
      }

      // Add other filters
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(
        `https://mymulya.com/candidate/submissions/teamlead/${userId}/filterByDate?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      let data = [];
      let teamData = [];
      let paginationInfo = {
        totalElements: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: size,
      };

      if (responseData && typeof responseData === "object") {
        if (isTeam) {
          data = responseData.teamSubmissions || [];
          teamData = responseData.teamSubmissions || [];
          paginationInfo.totalElements =
            responseData.totalTeamSubmissions || 0;
        } else {
          data = responseData.selfSubmissions || [];
          teamData = responseData.teamSubmissions || [];
          paginationInfo.totalElements =
            responseData.totalSelfSubmissions || 0;
        }

        paginationInfo.totalPages = responseData.totalPages || 0;
        paginationInfo.currentPage =
          responseData.currentPage ?? page;
        paginationInfo.pageSize =
          responseData.pageSize || size;
      }

      return {
        data,
        teamData,
        pagination: paginationInfo,
        filterParams: { startDate, endDate },
        isTeam,
      };
    } catch (error) {
      console.error("Error in filterSubmissionsByTeamLead:", error);
      return rejectWithValue(
        error.message || "Failed to filter submissions"
      );
    }
  }
);


const submissionSlice = createSlice({
  name: "submission",
  initialState: {
    loading: false,
    allSubmissions: [],
    selfSubmissionsTL: [],
    teamSubmissionsTL: [],
    filteredSubmissionsList: [],
    filteredSubmissionsForRecruiter: [],
    filteredSubmissionsForTeamLead: [],
    // Add pagination states
    filteredSubmissionsPagination: null,
    filteredRecruiterPagination: null,
    filteredTeamLeadPagination: null,
    error: null,
    isFiltered: false,
    isRecruiterFiltered: false,
    isTeamLeadFiltered: false,
  },
  reducers: {
    resetFilteredSubmissions: (state) => {
      state.filteredSubmissionsList = [];
      state.filteredSubmissionsPagination = null;
      state.isFiltered = false;
    },
    resetRecruiterFilteredSubmissions: (state) => {
      state.filteredSubmissionsForRecruiter = [];
      state.filteredRecruiterPagination = null;
      state.isRecruiterFiltered = false;
    },
    resetTeamLeadFilteredSubmissions: (state) => {
      state.filteredSubmissionsForTeamLead = [];
      state.selfSubmissionsTL = [];
      state.teamSubmissionsTL = [];
      state.filteredTeamLeadPagination = null;
      state.isTeamLeadFiltered = false;
    },
    setFilteredFlag: (state, action) => {
      state.isFiltered = action.payload;
    },
    setRecruiterFilteredFlag: (state, action) => {
      state.isRecruiterFiltered = action.payload;
    },
    setTeamLeadFilteredFlag: (state, action) => {
      state.isTeamLeadFiltered = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // For all submissions
      .addCase(fetchAllSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.allSubmissions = action.payload;
        state.isFiltered = false;
      })
      .addCase(fetchAllSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // For the teamlead self-submissions and team-submissions 
      .addCase(fetchSubmissionsTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionsTeamLead.fulfilled, (state, action) => {
        state.loading = false;
        state.selfSubmissionsTL = action.payload.selfSubmissions;
        state.teamSubmissionsTL = action.payload.teamSubmissions;
        state.isTeamLeadFiltered = false;
      })
      .addCase(fetchSubmissionsTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // Filter Submissions List By date Range (Admin)
      .addCase(filterSubmissionsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSubmissionsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredSubmissionsList = action.payload.data;
        state.filteredSubmissionsPagination = action.payload.pagination;
        state.isFiltered = true;
      })
      .addCase(filterSubmissionsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Filter Submissions By date Range For Recruiter
      .addCase(filterSubmissionsByRecruiter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSubmissionsByRecruiter.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredSubmissionsForRecruiter = action.payload.data;
        state.filteredRecruiterPagination = action.payload.pagination;
        state.isRecruiterFiltered = true;
      })
      .addCase(filterSubmissionsByRecruiter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Filter Submissions By date Range For TeamLead
      .addCase(filterSubmissionsByTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSubmissionsByTeamLead.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredSubmissionsForTeamLead = action.payload.data;
        
        if (action.payload.isTeam) {
          state.teamSubmissionsTL = action.payload.teamData || action.payload.data;
        } else {
          state.selfSubmissionsTL = action.payload.data;
          state.teamSubmissionsTL = action.payload.teamData || [];
        }
        
        state.filteredTeamLeadPagination = action.payload.pagination;
        state.isTeamLeadFiltered = true;
      })
      .addCase(filterSubmissionsByTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  resetFilteredSubmissions, 
  resetRecruiterFilteredSubmissions,
  resetTeamLeadFilteredSubmissions,
  setFilteredFlag,
  setRecruiterFilteredFlag,
  setTeamLeadFilteredFlag 
} = submissionSlice.actions;

export default submissionSlice.reducer;