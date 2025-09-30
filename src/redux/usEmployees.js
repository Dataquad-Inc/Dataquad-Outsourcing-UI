import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hotlistAPI, teamAPI } from "../utils/api";

// 🔹 Fetch only TEAMLEAD users
export const fetchEmployeesUs = createAsyncThunk(
  "usEmployees/fetchEmployeesUs",
  async (_, thunkAPI) => {
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

// 🔹 Fetch all employees by role recruiter
export const fetchRecruiters = createAsyncThunk(
  "usEmployees/fetchRecruiters",
  async (_, thunkAPI) => {
    try {
      const response = await hotlistAPI.getUsersByRole("RECRUITER");
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        `Error fetching recruiters: ${error.message}` ||
          "failed to fetch recruiters"
      );
    }
  }
);

// 🔹 Fetch all employees by role
export const fetchAllEmployeesUs = createAsyncThunk(
  "usEmployees/fetchAllEmployeesUs",
  async (role, thunkAPI) => {
    try {
      const response = await hotlistAPI.getUsersByRole(role);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        `Error fetching US employees: ${error.message}` ||
          "failed to fetch US employees"
      );
    }
  }
);

// 🔹 Fetch team by Team Lead ID
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
    team: null,
    salesExecutives: [],
    recruiters: [],
    loadingEmployees: false,
    loadingRecruiters: false,
    loadingTeam: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      // 🔹 Employees
      .addCase(fetchEmployeesUs.pending, (state) => {
        state.loadingEmployees = true;
        state.error = null;
      })
      .addCase(fetchEmployeesUs.fulfilled, (state, action) => {
        state.loadingEmployees = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeesUs.rejected, (state, action) => {
        state.loadingEmployees = false;
        state.error = action.payload || action.error.message;
      })

      // 🔹 All employees by role
      .addCase(fetchAllEmployeesUs.pending, (state) => {
        state.loadingEmployees = true;
        state.error = null;
      })
      .addCase(fetchAllEmployeesUs.fulfilled, (state, action) => {
        state.loadingEmployees = false;
        state.employees = action.payload;
      })
      .addCase(fetchAllEmployeesUs.rejected, (state, action) => {
        state.loadingEmployees = false;
        state.error = action.payload || action.error.message;
      })

      // 🔹 Recruiters
      .addCase(fetchRecruiters.pending, (state) => {
        state.loadingRecruiters = true;
        state.error = null;
      })
      .addCase(fetchRecruiters.fulfilled, (state, action) => {
        state.loadingRecruiters = false;
        state.recruiters = action.payload;
      })
      .addCase(fetchRecruiters.rejected, (state, action) => {
        state.loadingRecruiters = false;
        state.error = action.payload || action.error.message;
      })


      // 🔹 Team members
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loadingTeam = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loadingTeam = false;
        state.team = action.payload;
        state.salesExecutives = action.payload.salesExecutives || [];
        state.recruiters = action.payload.recruiters || [];
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loadingTeam = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default usEmployeesSlice.reducer;
