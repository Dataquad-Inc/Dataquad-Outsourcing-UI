import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { usClientsAPI } from "../utils/api";

// Async thunk for fetching US clients
export const fetchUSClients = createAsyncThunk(
  "usClients/fetchUSClients",
  async (_, { rejectWithValue }) => {
    try {
      const response = await usClientsAPI.getAllClients();

      if (response.data && response.data.success) {
        console.log("Fetched Clients:", response.data.data); // ✅ Move before return
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message || "Failed to fetch US clients");
      }
    } catch (error) {
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

// Slice
const usClientsSlice = createSlice({
  name: "usClients",
  initialState: {
    clients: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUSClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUSClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchUSClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default usClientsSlice.reducer;
