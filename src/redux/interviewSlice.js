import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";

export const fetchInterviewsTeamLead = createAsyncThunk(
  "interviews/teamlead",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;
      const response = await httpService.get(
        `/candidate/interviews/teamlead/${userId}`
      );

      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const filterInterviewsByDateRange = createAsyncThunk(
  "interviews/filterByDateRange",
  async ({ startDate, endDate, userId, role }, { rejectWithValue }) => {
    try {
      let response;

      response = await httpService.get(
        `/candidate/interviews/filterByDate?startDate=${startDate}&endDate=${endDate}`
      );

      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

// Filter interviews for employee
export const filterInterviewsByRecruiter = createAsyncThunk(
  "recruiter/interviews/filterByDateRange",
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;

      const response = await httpService.get(
        `/candidate/interviews/${userId}/filterByDate?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const filterInterviewsByTeamLead = createAsyncThunk(
  "teamlead/interviews/filterByDateRange",
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;

      const response = await httpService.get(
        `/candidate/interviews/teamlead/${userId}/filterByDate?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const filterInterviewsByCoordinator = createAsyncThunk(
  "coordinator/interviews/filterByDateRange",
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;

      const response = await httpService.get(
        `/candidate/interviews/${userId}/filterByDate?coordinator=true&startDate=${startDate}&endDate=${endDate}`
      );
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
    filteredInterviewList: [],
    filterInterviewsForRecruiter: [],
    filterInterviewsForTeamLeadTeam: [],
    filterInterviewsForTeamLeadSelf: [],
    filterInterviewsForCoordinator: [],
    // Add these flags to track when filtered data is active
    isFilteredDataRequested: false,
    isCoordinatorFilterActive:false,
    isRecruiterFilterActive: false,
    isTeamLeadFilterActive: false,
    error: null,
  },
  reducers: {
    clearFilteredData: (state) => {
      state.filterInterviewsForTeamLeadTeam = [];
      state.filterInterviewsForTeamLeadSelf = [];
      state.filterInterviewsForRecruiter = [];
      state.filterInterviewsForCoordinator=[];
      state.filteredInterviewList = [];
      // Reset filter flags
      state.isFilteredDataRequested = false;
      state.isCoordinatorFilterActive=false;
      state.isRecruiterFilterActive = false;
      state.isTeamLeadFilterActive = false;
    },
    // Add action to clear specific filter type
    clearCoordinatorFilter:(state)=>{
      state.filterInterviewsForCoordinator = [];
      state.isCoordinatorFilterActive = false;
      state.isFilteredDataRequested = false;
    },
    clearRecruiterFilter: (state) => {
      state.filterInterviewsForRecruiter = [];
      state.isRecruiterFilterActive = false;
      state.isFilteredDataRequested = false;
    },
    clearTeamLeadFilter: (state) => {
      state.filterInterviewsForTeamLeadTeam = [];
      state.filterInterviewsForTeamLeadSelf = [];
      state.isTeamLeadFilterActive = false;
      state.isFilteredDataRequested = false;
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
      // Teamlead interviews
      .addCase(fetchInterviewsTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviewsTeamLead.fulfilled, (state, action) => {
        state.loading = false;
        state.selfInterviewsTL = action.payload?.selfInterviews || [];
        state.teamInterviewsTL = action.payload?.teamInterviews || [];
      })
      .addCase(fetchInterviewsTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch interviews";
      })

      // Filter Interviews List By date Range For Coordinator
      .addCase(filterInterviewsByCoordinator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByCoordinator.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array and object response formats
        state.filterInterviewsForCoordinator = Array.isArray(action.payload) 
          ? action.payload 
          : action.payload?.data || [];
        // Set the filter flag to indicate filtered data is active
        state.isCoordinatorFilterActive = true;
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByCoordinator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to filter interviews";
        // Reset filter flags on error
        state.isCoordinatorFilterActive = false;
        state.isFilteredDataRequested = false;
      })

      // Filter Interviews List By date Range For Recruiter
      .addCase(filterInterviewsByRecruiter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByRecruiter.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array and object response formats
        state.filterInterviewsForRecruiter = Array.isArray(action.payload) 
          ? action.payload 
          : action.payload?.data || [];
        // Set the filter flag to indicate filtered data is active
        state.isRecruiterFilterActive = true;
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByRecruiter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to filter interviews";
        // Reset filter flags on error
        state.isRecruiterFilterActive = false;
        state.isFilteredDataRequested = false;
      })

      // Filter Interviews List By date Range For TeamLead
      .addCase(filterInterviewsByTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByTeamLead.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response structures
        if (action.payload?.selfInterviews || action.payload?.teamInterviews) {
          state.filterInterviewsForTeamLeadSelf = action.payload.selfInterviews || [];
          state.filterInterviewsForTeamLeadTeam = action.payload.teamInterviews || [];
        } else {
          // Fallback for different API response structure
          state.filterInterviewsForTeamLeadSelf = Array.isArray(action.payload) ? action.payload : [];
          state.filterInterviewsForTeamLeadTeam = [];
        }
        // Set the filter flag to indicate filtered data is active
        state.isTeamLeadFilterActive = true;
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to filter team lead interviews";
        // Reset filter flags on error
        state.isTeamLeadFilterActive = false;
        state.isFilteredDataRequested = false;
      })

      // Filter Interviews List By date Range
      .addCase(filterInterviewsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInterviewsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array and object response formats
        state.filteredInterviewList = Array.isArray(action.payload) 
          ? action.payload 
          : action.payload?.data || [];
        // Set the filter flag to indicate filtered data is active
        state.isFilteredDataRequested = true;
      })
      .addCase(filterInterviewsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "An error occurred";
        // Reset filter flag on error
        state.isFilteredDataRequested = false;
      });
  },
});

export const { clearFilteredData, setFilterFlag, clearRecruiterFilter, clearTeamLeadFilter, clearCoordinatorFilter } = interviewSlice.actions;
export default interviewSlice.reducer;