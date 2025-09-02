import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';

// Async thunks for API calls
export const fetchClientsForProjects = createAsyncThunk(
  'timesheet/fetchClientsForProjects',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;
      const response = await httpService.get(`/timesheet/vendors/${userId}`);
      
      console.log('API Response:', response); // Debug log
      
      // More robust data extraction
      if (response?.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response?.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.warn('Unexpected response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch clients');
    }
  }
);

export const fetchTimesheetsByUserId = createAsyncThunk(
  'timesheet/fetchTimesheetsByUserId',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/getTimesheetsByUserId?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createTimesheet = createAsyncThunk(
  'timesheet/createTimesheet',
  async ({ userId, timesheetData }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/timesheet/daily-entry?userId=${userId}`,
        timesheetData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTimesheet = createAsyncThunk(
  'timesheet/updateTimesheet',
  async ({ timesheetId, userId, timesheetData }, { rejectWithValue }) => {
    try {
      const response = await httpService.patch(
        `/timesheet/update-timesheet/${timesheetId}?userId=${userId}`,
        timesheetData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitWeeklyTimesheet = createAsyncThunk(
  'timesheet/submitWeeklyTimesheet',
  async ({ userId, weekStart }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/timesheet/submit-weekly?userId=${userId}&weekStart=${weekStart}`,
        {}
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadTimesheetAttachments = createAsyncThunk(
  'timesheet/uploadAttachments',
  async ({ timesheetId, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await httpService.post(
        `/timesheet/${timesheetId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveTimesheet = createAsyncThunk(
  'timesheet/approveTimesheet',
  async ({ timesheetId, userId }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/timesheet/approve?timesheetId=${timesheetId}&userId=${userId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectTimesheet = createAsyncThunk(
  'timesheet/rejectTimesheet',
  async ({ timesheetId, userId, reason }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/timesheet/reject?timesheetId=${timesheetId}&userId=${userId}&reason=${encodeURIComponent(reason.trim())}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelTimesheet = createAsyncThunk(
  'timesheet/cancelTimesheet',
  async ({ timesheetId, userId }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/timesheet/cancel/${timesheetId}`,
        { cancelledBy: userId }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState: {
    timesheets: [],
    loading: false,
    error: null,
    uploadLoading: false,
    uploadError: null,
    actionLoading: false,
    actionError: null,
    clients:[]
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.uploadError = null;
      state.actionError = null;
    },
    resetTimesheets: (state) => {
      state.timesheets = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      //fetch clients
      .addCase(fetchClientsForProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsForProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload || [];
      })
      .addCase(fetchClientsForProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.clients = [];
      })

      // Fetch timesheets
      .addCase(fetchTimesheetsByUserId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetsByUserId.fulfilled, (state, action) => {
        state.loading = false;
        state.timesheets = action.payload.data || [];
      })
      .addCase(fetchTimesheetsByUserId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create timesheet
      .addCase(createTimesheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimesheet.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createTimesheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update timesheet
      .addCase(updateTimesheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimesheet.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateTimesheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit weekly timesheet
      .addCase(submitWeeklyTimesheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitWeeklyTimesheet.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitWeeklyTimesheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload attachments
      .addCase(uploadTimesheetAttachments.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = null;
      })
      .addCase(uploadTimesheetAttachments.fulfilled, (state) => {
        state.uploadLoading = false;
      })
      .addCase(uploadTimesheetAttachments.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload;
      })
      // Approve timesheet
      .addCase(approveTimesheet.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveTimesheet.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(approveTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      // Reject timesheet
      .addCase(rejectTimesheet.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(rejectTimesheet.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(rejectTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      // Cancel timesheet
      .addCase(cancelTimesheet.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(cancelTimesheet.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(cancelTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  }
});

export const { clearError, resetTimesheets } = timesheetSlice.actions;
export default timesheetSlice.reducer;