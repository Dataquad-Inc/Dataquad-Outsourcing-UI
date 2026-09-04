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

// Helper function to trigger file download
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const triggerDownload = (blob, filename) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
    
    ToastService.info('File downloaded successfully');
  } catch (error) {
    console.error('Error triggering download:', error);
    ToastService.error('Failed to download file');
  }
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

export const fetchTimesheetsByUserIdWithDateRange = createAsyncThunk(
  'timesheet/fetchTimesheetsByUserIdWithDateRange',
  async ({ userId, monthStart, monthEnd }, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/getTimesheetsByUserId?userId=${userId}&monthStart=${monthStart}&monthEnd=${monthEnd}`
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
  async ({ 
    timesheetId, 
    files, 
    attachmentStartDate, 
    attachmentEndDate 
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add date parameters as query string
      const queryParams = new URLSearchParams({
        attachmentStartDate,
        attachmentEndDate
      }).toString();

      const response = await httpService.post(
        `/timesheet/${timesheetId}/attachments?${queryParams}`,
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

export const viewTimesheetAttachment = createAsyncThunk(
  'timesheet/viewTimesheetAttachment',
  async ({ attachmentId }, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/attachments/${attachmentId}/download?view=true`,
        { responseType: 'blob' } // Ensure this is set
      );
      
      // Ensure we have a proper Blob object
      let blobData;
      if (response.data instanceof Blob) {
        blobData = response.data;
      } else {
        // If it's not a Blob, create one from the response data
        blobData = new Blob([response.data]);
      }
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `attachment_${attachmentId}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Get content type from headers or blob type
      const contentType = response.headers['content-type'] || blobData.type || '';
      
      return { 
        attachmentId, 
        blob: blobData,
        filename,
        contentType
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);


// New thunk for downloading attachments
export const downloadTimesheetAttachment = createAsyncThunk(
  'timesheet/downloadTimesheetAttachment',
  async ({ attachmentId, filename }, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/attachments/${attachmentId}/download`,
        { responseType: 'blob' } // THIS IS CRITICAL - was missing!
      );
      
      // Get filename from Content-Disposition header if not provided
      let downloadFilename = filename;
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition && !downloadFilename) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Fallback filename if none found
      if (!downloadFilename) {
        downloadFilename = `attachment_${attachmentId}`;
      }
      
      // Ensure we have a proper Blob
      let blobData;
      if (response.data instanceof Blob) {
        blobData = response.data;
      } else {
        blobData = new Blob([response.data]);
      }
      
      // Trigger download
      triggerDownload(blobData, downloadFilename);
      
      return { attachmentId, filename: downloadFilename };
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

export const approveTimesheetMonthly = createAsyncThunk(
  'timesheet/approveTimesheetMonthly',
  async ({ userId, start, end }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const managerUserId = state.auth.userId;
      
      const response = await httpService.post(
        `/timesheet/approve-monthly?userId=${userId}&monthStart=${start}&monthEnd=${end}&managerUserId=${managerUserId}`
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

export const rejectTimesheetMonthly = createAsyncThunk(
  'timesheet/rejectTimesheetMonthly',
  async ({ userId, start, end, reason }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const managerUserId = state.auth.userId;
      
      const response = await httpService.post(
        `/timesheet/reject-monthly?userId=${userId}&monthStart=${start}&monthEnd=${end}&managerUserId=${managerUserId}&reason=${encodeURIComponent(reason.trim())}`
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
    attachments: [],
    downloadLoading: false,
    downloadError: null,
    viewLoading: false,
    viewError: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.uploadError = null;
      state.actionError = null;
      state.downloadError = null;
      state.viewError = null;
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

      //fetch timesheets with date range
      .addCase(fetchTimesheetsByUserIdWithDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetsByUserIdWithDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.timesheets = action.payload?.data?.timesheets || [];
      })
      .addCase(fetchTimesheetsByUserIdWithDateRange.rejected, (state, action) => {
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

      // View attachment
      // View attachment
.addCase(viewTimesheetAttachment.pending, (state) => {
  state.viewLoading = true;
  state.viewError = null;
})
.addCase(viewTimesheetAttachment.fulfilled, (state, action) => {
  state.viewLoading = false;
  // Don't store the blob in state, just handle it in the component
})
.addCase(viewTimesheetAttachment.rejected, (state, action) => {
  state.viewLoading = false;
  state.viewError = action.payload;
})

      // Download attachment
      .addCase(downloadTimesheetAttachment.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = null;
      })
      .addCase(downloadTimesheetAttachment.fulfilled, (state) => {
        state.downloadLoading = false;
      })
      .addCase(downloadTimesheetAttachment.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload;
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

      // Approve timesheet monthly
      .addCase(approveTimesheetMonthly.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveTimesheetMonthly.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(approveTimesheetMonthly.rejected, (state, action) => {
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
      // Reject timesheet monthly
      .addCase(rejectTimesheetMonthly.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(rejectTimesheetMonthly.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(rejectTimesheetMonthly.rejected, (state, action) => {
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

