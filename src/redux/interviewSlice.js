import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";

export const fetchInterviewsTeamLead = createAsyncThunk(
  "interviews/teamlead",
  async ({ page = 0, size = 10, search = "" } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;
      
      let url = `/candidate/interviews/teamlead/${userId}?page=${page}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await httpService.get(url);
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const filterInterviewsByDateRange = createAsyncThunk(
  "interviews/filterByDateRange",
  async ({ startDate, endDate, page = 0, size = 10, search = "" }, { rejectWithValue }) => {
    try {
      let url = `/candidate/interviews/filterByDate?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const response = await httpService.get(url);
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

// Filter interviews for recruiter/BDM with pagination support
export const filterInterviewsByRecruiter = createAsyncThunk(
  "recruiter/interviews/filterByDateRange",
  async ({ startDate, endDate, page = 0, size = 10, search = "" }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;

      let url = `/candidate/interviews/${userId}/filterByDate?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await httpService.get(url);
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const filterInterviewsByTeamLead = createAsyncThunk(
  "teamlead/interviews/filterByDateRange",
  async ({ startDate, endDate, teamLeadId, page = 0, size = 10, search = "" }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Use passed teamLeadId instead of userId
      const id = teamLeadId || state.auth.userId;

      let url = `/candidate/interviews/teamlead/${id}/filterByDate?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await httpService.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const filterInterviewsByCoordinator = createAsyncThunk(
  "coordinator/interviews/filterByDateRange",
  async ({ startDate, endDate, page = 0, size = 10, search = "" }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;

      let url = `/candidate/interviews/${userId}/filterByDate?coordinator=true&startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await httpService.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const interviewSlice = createSlice({
  name: "interview",
  initialState: {
    loading: false,
    selfInterviewsTL: [],
    teamInterviewsTL: [],
    selfInterviewsTLTotalCount: 0, // Added for pagination
    teamInterviewsTLTotalCount: 0, // Added for pagination
    filteredInterviewList: [],
    filteredTotalCount: 0, 
    filterInterviewsForRecruiter: [],
    filterInterviewsForRecruiterTotalCount: 0,
    filterInterviewsForTeamLeadTeam: [],
    filterInterviewsForTeamLeadSelf: [],
    filterInterviewsForTeamLeadTeamTotalCount: 0,
    filterInterviewsForTeamLeadSelfTotalCount: 0,
    filterInterviewsForCoordinator: [],
    filterInterviewsForCoordinatorTotalCount: 0,
    // Add these flags to track when filtered data is active
    isFilteredDataRequested: false,
    isCoordinatorFilterActive: false,
    isRecruiterFilterActive: false,
    isTeamLeadFilterActive: false,
    error: null,
  },
  reducers: {
    clearFilteredData: (state) => {
      state.filterInterviewsForTeamLeadTeam = [];
      state.filterInterviewsForTeamLeadSelf = [];
      state.filterInterviewsForRecruiter = [];
      state.filterInterviewsForCoordinator = [];
      state.filteredInterviewList = [];
      state.filteredTotalCount = 0;
      state.filterInterviewsForRecruiterTotalCount = 0;
      state.filterInterviewsForTeamLeadTeamTotalCount = 0;
      state.filterInterviewsForTeamLeadSelfTotalCount = 0;
      state.filterInterviewsForCoordinatorTotalCount = 0;
      // Reset filter flags
      state.isFilteredDataRequested = false;
      state.isCoordinatorFilterActive = false;
      state.isRecruiterFilterActive = false;
      state.isTeamLeadFilterActive = false;
    },
    // Add action to clear specific filter type
    clearCoordinatorFilter: (state) => {
      state.filterInterviewsForCoordinator = [];
      state.filterInterviewsForCoordinatorTotalCount = 0;
      state.isCoordinatorFilterActive = false;
      state.isFilteredDataRequested = false;
    },
    clearRecruiterFilter: (state) => {
      state.filterInterviewsForRecruiter = [];
      state.filterInterviewsForRecruiterTotalCount = 0;
      state.isRecruiterFilterActive = false;
      state.isFilteredDataRequested = false;
    },
    clearTeamLeadFilter: (state) => {
      state.filterInterviewsForTeamLeadTeam = [];
      state.filterInterviewsForTeamLeadSelf = [];
      state.filterInterviewsForTeamLeadTeamTotalCount = 0;
      state.filterInterviewsForTeamLeadSelfTotalCount = 0;
      state.isTeamLeadFilterActive = false;
      state.isFilteredDataRequested = false;
    },
    clearSelfInterviews: (state) => {
      state.selfInterviewsTL = [];
      state.selfInterviewsTLTotalCount = 0;
    },
    clearTeamInterviews: (state) => {
      state.teamInterviewsTL = [];
      state.teamInterviewsTLTotalCount = 0;
    },
    // Add action to set filter flags
    setFilterFlag: (state, action) => {
      const { filterType, isActive } = action.payload;
      switch (filterType) {
        case 'recruiter':
          state.isRecruiterFilterActive = isActive;
          state.isFilteredDataRequested = isActive;
          break;
        case 'teamlead':
          state.isTeamLeadFilterActive = isActive;
          state.isFilteredDataRequested = isActive;
          break;
        case 'coordinator':
          state.isCoordinatorFilterActive = isActive;
          state.isFilteredDataRequested = isActive;
          break;
        case 'general':
          state.isFilteredDataRequested = isActive;
          break;
        default:
          break;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // UPDATED: Teamlead interviews with pagination
      .addCase(fetchInterviewsTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviewsTeamLead.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Handle paginated response for self interviews
        if (payload?.selfInterviews?.content) {
          state.selfInterviewsTL = payload.selfInterviews.content;
          state.selfInterviewsTLTotalCount = payload.selfInterviews.totalElements || 0;
        } else {
          state.selfInterviewsTL = Array.isArray(payload?.selfInterviews) ? payload.selfInterviews : [];
          state.selfInterviewsTLTotalCount = state.selfInterviewsTL.length;
        }
        
        // Handle paginated response for team interviews
        if (payload?.teamInterviews?.content) {
          state.teamInterviewsTL = payload.teamInterviews.content;
          state.teamInterviewsTLTotalCount = payload.teamInterviews.totalElements || 0;
        } else {
          state.teamInterviewsTL = Array.isArray(payload?.teamInterviews) ? payload.teamInterviews : [];
          state.teamInterviewsTLTotalCount = state.teamInterviewsTL.length;
        }
      })
      .addCase(fetchInterviewsTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch interviews";
      })

      // Filter Interviews List By date Range For Coordinator (paginated)
      .addCase(filterInterviewsByCoordinator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByCoordinator.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Handle paginated response
        if (payload?.content && Array.isArray(payload.content)) {
          state.filterInterviewsForCoordinator = payload.content;
          state.filterInterviewsForCoordinatorTotalCount = payload.totalElements || 0;
        } else if (Array.isArray(payload)) {
          state.filterInterviewsForCoordinator = payload;
          state.filterInterviewsForCoordinatorTotalCount = payload.length;
        } else if (payload?.data && Array.isArray(payload.data)) {
          state.filterInterviewsForCoordinator = payload.data;
          state.filterInterviewsForCoordinatorTotalCount = payload.data.length;
        } else {
          state.filterInterviewsForCoordinator = [];
          state.filterInterviewsForCoordinatorTotalCount = 0;
        }
        
        state.isCoordinatorFilterActive = true;
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByCoordinator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to filter interviews";
        state.isCoordinatorFilterActive = false;
        state.isFilteredDataRequested = false;
      })

      // Filter Interviews List By date Range For Recruiter (paginated)
      .addCase(filterInterviewsByRecruiter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByRecruiter.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Handle paginated response
        if (payload?.content && Array.isArray(payload.content)) {
          state.filterInterviewsForRecruiter = payload.content;
          state.filterInterviewsForRecruiterTotalCount = payload.totalElements || 0;
        } else if (Array.isArray(payload)) {
          state.filterInterviewsForRecruiter = payload;
          state.filterInterviewsForRecruiterTotalCount = payload.length;
        } else if (payload?.data && Array.isArray(payload.data)) {
          state.filterInterviewsForRecruiter = payload.data;
          state.filterInterviewsForRecruiterTotalCount = payload.data.length;
        } else {
          state.filterInterviewsForRecruiter = [];
          state.filterInterviewsForRecruiterTotalCount = 0;
        }
        
        state.isRecruiterFilterActive = true;
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByRecruiter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to filter interviews";
        state.isRecruiterFilterActive = false;
        state.isFilteredDataRequested = false;
      })

      // Filter Interviews List By date Range For TeamLead (paginated)
      .addCase(filterInterviewsByTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByTeamLead.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Handle different response structures
        if (payload?.selfInterviews || payload?.teamInterviews) {
          // Handle paginated self interviews
          if (payload.selfInterviews?.content) {
            state.filterInterviewsForTeamLeadSelf = payload.selfInterviews.content;
            state.filterInterviewsForTeamLeadSelfTotalCount = payload.selfInterviews.totalElements || 0;
          } else {
            state.filterInterviewsForTeamLeadSelf = Array.isArray(payload.selfInterviews) ? payload.selfInterviews : [];
            state.filterInterviewsForTeamLeadSelfTotalCount = state.filterInterviewsForTeamLeadSelf.length;
          }
          
          // Handle paginated team interviews
          if (payload.teamInterviews?.content) {
            state.filterInterviewsForTeamLeadTeam = payload.teamInterviews.content;
            state.filterInterviewsForTeamLeadTeamTotalCount = payload.teamInterviews.totalElements || 0;
          } else {
            state.filterInterviewsForTeamLeadTeam = Array.isArray(payload.teamInterviews) ? payload.teamInterviews : [];
            state.filterInterviewsForTeamLeadTeamTotalCount = state.filterInterviewsForTeamLeadTeam.length;
          }
        } else if (payload?.content && Array.isArray(payload.content)) {
          // Single paginated response
          state.filterInterviewsForTeamLeadSelf = payload.content;
          state.filterInterviewsForTeamLeadSelfTotalCount = payload.totalElements || 0;
          state.filterInterviewsForTeamLeadTeam = [];
          state.filterInterviewsForTeamLeadTeamTotalCount = 0;
        } else if (Array.isArray(payload)) {
          // Legacy array response
          state.filterInterviewsForTeamLeadSelf = payload;
          state.filterInterviewsForTeamLeadSelfTotalCount = payload.length;
          state.filterInterviewsForTeamLeadTeam = [];
          state.filterInterviewsForTeamLeadTeamTotalCount = 0;
        } else {
          state.filterInterviewsForTeamLeadSelf = [];
          state.filterInterviewsForTeamLeadTeam = [];
          state.filterInterviewsForTeamLeadSelfTotalCount = 0;
          state.filterInterviewsForTeamLeadTeamTotalCount = 0;
        }
        
        state.isTeamLeadFilterActive = true;
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to filter team lead interviews";
        state.isTeamLeadFilterActive = false;
        state.isFilteredDataRequested = false;
      })

      // Filter Interviews By date Range (paginated, used by AllInterviews)
      .addCase(filterInterviewsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Handle paginated response
        if (payload?.content && Array.isArray(payload.content)) {
          state.filteredInterviewList = payload.content;
          state.filteredTotalCount = payload.totalElements || 0;
        } else if (Array.isArray(payload)) {
          state.filteredInterviewList = payload;
          state.filteredTotalCount = payload.length;
        } else if (payload?.data && Array.isArray(payload.data)) {
          state.filteredInterviewList = payload.data;
          state.filteredTotalCount = payload.data.length;
        } else {
          state.filteredInterviewList = [];
          state.filteredTotalCount = 0;
        }
        
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "An error occurred";
        state.isFilteredDataRequested = false;
      });
  },
});

export const { 
  clearFilteredData, 
  setFilterFlag, 
  clearRecruiterFilter, 
  clearTeamLeadFilter, 
  clearCoordinatorFilter,
  clearSelfInterviews,
  clearTeamInterviews
} = interviewSlice.actions;

export default interviewSlice.reducer;