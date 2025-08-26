import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hotlistAPI } from "../utils/api";

export const fetchEmployeesUs = createAsyncThunk(
  "usEmployees/fetchUsEmployees",
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

const usEmployeesSlice = createSlice({
  name: "usEmployees",
  initialState: {
    employees: [],
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
      });
  },
});

export default usEmployeesSlice.reducer;
