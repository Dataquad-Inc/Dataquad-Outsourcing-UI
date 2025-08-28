import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hotlistAPI, teamAPI } from "../utils/api";

export const fetchEmployeesUs = createAsyncThunk(
  "usEmployees/fetchUsEmployees",
  async (role, thunkAPI) => {
    try {
      const response = await hotlistAPI.getUsersByRole("TEAMLEAD");
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        `Error fetching US employees: ${error.message}` ||
          "failed to fetch US employees"
      );
    }
  }
);

export const fetchTeamMembers = createAsyncThunk(
  "usEmployees/fetchTeamMembers",
  async (teamLeadId, thunkAPI) => {
    try {
      const response = await teamAPI.getTeam(teamLeadId);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        `Error fetching team members: ${error.message}` ||
          "failed to fetch team members"
      );
    }
  }
);

const usEmployeesSlice = createSlice({
  name: "usEmployees",
  initialState: {
    employees: [],
    team: null, // full team object
    salesExecutives: [], // just sales
    recruiters: [], // just recruiters
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeesUs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesUs.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeesUs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // ✅ Handle team members
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.team = action.payload;

        // Correct fields based on API response
        state.salesExecutives = action.payload.salesExecutives || [];
        state.recruiters = action.payload.recruiters || [];
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default usEmployeesSlice.reducer;
