import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';
import ToastService from '../Services/toastService';
import axios from 'axios';

// Helper function to extract error message
const extractErrorMessage = (error) => {
  const apiError = error.response?.data;
  let errorMessage = "Something went wrong";

  if (typeof apiError === "string") {
    errorMessage = apiError;
  } else if (apiError?.error?.errorMessage) {
    errorMessage = apiError.error.errorMessage;
  } else if (apiError?.message) {
    errorMessage = apiError.message;
  } else if (error.message) {
    errorMessage = error.message;
  }

  return errorMessage;
};

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
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      ToastService.success('Timesheet created successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTimesheet = createAsyncThunk(
  'timesheet/updateTimesheet',
  async ({ timesheetId, userId, timesheetData }, { rejectWithValue }) => {
    try {
      const response = await httpService.patch(
        `/timesheet/update-timesheet-entries/${timesheetId}?userId=${userId}`,
        timesheetData
      );
      ToastService.success('Timesheet updated successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      ToastService.success('Timesheet submitted successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);
export const submitMonthlyTimesheet = createAsyncThunk(
  'timesheet/submitMonthlyTimesheet',
  async ({ userId, monthStartDate }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/timesheet/submit-monthly?userId=${userId}&monthStartDate=${monthStartDate}`,
        {}
      );
      ToastService.success('Timesheet submitted successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      ToastService.success('Files uploaded successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTimesheetAttachments = createAsyncThunk(
  'timesheet/deleteTimesheetAttachments',
  async ({ attachmentId }, { rejectWithValue }) => {
    try {
      const response = await httpService.delete(
        `/timesheet/delete-attachments/${attachmentId}`
      );
      ToastService.success('Attachment deleted successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getTimesheetAttachmentsById = createAsyncThunk(
  'timesheet/getTimesheetAttachmentsById',
  async (timesheetId, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/${timesheetId}/attachments`
      );
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      ToastService.success('Timesheet approved successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      ToastService.success('Timesheet rejected successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      ToastService.success('Timesheet cancelled successfully');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
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
    clients: [],
    attachments: []
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
      // Fetch clients
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

      //submit monthly timesheet
      .addCase(submitMonthlyTimesheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitMonthlyTimesheet.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitMonthlyTimesheet.rejected, (state, action) => {
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

      // Delete attachments
      .addCase(deleteTimesheetAttachments.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteTimesheetAttachments.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteTimesheetAttachments.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
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
      })
      
      // Get timesheet attachments
      .addCase(getTimesheetAttachmentsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTimesheetAttachmentsById.fulfilled, (state, action) => {
        state.loading = false;
        state.attachments = action.payload.data || [];
      })
      .addCase(getTimesheetAttachmentsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.attachments = [];
      });
  }
});

export const { clearError, resetTimesheets } = timesheetSlice.actions;
export default timesheetSlice.reducer;