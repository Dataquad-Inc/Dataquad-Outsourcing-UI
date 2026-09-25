import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';
import ToastService from '../Services/toastService';

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------
const extractErrorMessage = (error) => {
  const apiError = error.response?.data;
  let errorMessage = 'Something went wrong';
  if (typeof apiError === 'string') errorMessage = apiError;
  else if (apiError?.error?.errorMessage) errorMessage = apiError.error.errorMessage;
  else if (apiError?.message) errorMessage = apiError.message;
  else if (error.message) errorMessage = error.message;
  return errorMessage;
};

// ---------------------------------------------------------------------------
// Bulletproof paged-response normalizer.
//
// Your API response is:
//   { success, message, data: { content:[...], page, size, totalElements:250, totalPages:13 }, error, timestamp }
//
// httpService.get may return any of:
//   A) axios response        → response.data = body        → body.data = paged
//   B) body only             → response.data = paged
//   C) inner data only       → response = paged
//   D) double-wrapped        → response.data.data.data
//
// The algorithm:
//   1. Walk every level and look for a candidate that has BOTH an array
//      (`content`/`timesheets`) AND a numeric `totalElements` AT THE SAME LEVEL.
//   2. If not found, look for a candidate with `content`, and read
//      `totalElements` from `candidate.data`.
//   3. If still not found, fall back to rows only.
// ---------------------------------------------------------------------------
const pickRows = (c) => {
  if (!c || typeof c !== 'object') return null;
  if (Array.isArray(c)) return c;
  if (Array.isArray(c.content)) return c.content;
  if (Array.isArray(c.timesheets)) return c.timesheets;
  if (Array.isArray(c.data?.content)) return c.data.content;
  if (Array.isArray(c.data?.timesheets)) return c.data.timesheets;
  return null;
};

const normalizePagedResponse = (response) => {
  const candidates = [];
  const seen = new Set();
  const push = (obj) => {
    if (obj && typeof obj === 'object' && !seen.has(obj)) {
      seen.add(obj);
      candidates.push(obj);
    }
  };

  push(response);
  push(response?.data);
  push(response?.data?.data);
  push(response?.data?.data?.data);
  push(response?.data?.data?.data?.data);

  // Pass 1: same-level content + totalElements
  for (const c of candidates) {
    const rows = pickRows(c);
    if (rows && typeof c.totalElements === 'number') {
      return {
        content: rows,
        page: typeof c.page === 'number' ? c.page : 0,
        size: typeof c.size === 'number' ? c.size : rows.length,
        totalElements: c.totalElements,
        totalPages:
          typeof c.totalPages === 'number' && c.totalPages > 0
            ? c.totalPages
            : Math.max(1, Math.ceil(c.totalElements / (c.size || rows.length || 20)))
      };
    }
  }

  // Pass 2: content here, pagination in c.data
  for (const c of candidates) {
    const rows = pickRows(c);
    if (rows && c.data && typeof c.data.totalElements === 'number') {
      const d = c.data;
      return {
        content: rows,
        page: typeof d.page === 'number' ? d.page : 0,
        size: typeof d.size === 'number' ? d.size : rows.length,
        totalElements: d.totalElements,
        totalPages:
          typeof d.totalPages === 'number' && d.totalPages > 0
            ? d.totalPages
            : Math.max(1, Math.ceil(d.totalElements / (d.size || rows.length || 20)))
      };
    }
  }

  // Pass 3: rows only, no pagination
  for (const c of candidates) {
    const rows = pickRows(c);
    if (rows) {
      return {
        content: rows,
        page: 0,
        size: rows.length,
        totalElements: rows.length,
        totalPages: 1
      };
    }
  }

  return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 };
};

// ---------------------------------------------------------------------------
// ASYNC THUNKS
// ---------------------------------------------------------------------------

export const fetchMonthlyTimesheets = createAsyncThunk(
  'timesheet/fetchMonthlyTimesheets',
  async ({ monthStart, monthEnd, page = 0, size = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/monthly-timesheets?monthStart=${monthStart}&monthEnd=${monthEnd}&page=${page}&size=${size}`
      );

      // Debug — remove after verifying
      // eslint-disable-next-line no-console
      console.log('[timesheet] RAW response:', response);
      // eslint-disable-next-line no-console
      console.log('[timesheet] response?.data:', response?.data);

      const paged = normalizePagedResponse(response);
      // eslint-disable-next-line no-console
      console.log('[timesheet] NORMALIZED →', {
        rows: paged.content.length,
        totalElements: paged.totalElements,
        totalPages: paged.totalPages,
        page: paged.page,
        size: paged.size
      });

      return paged;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchClientsForProjects = createAsyncThunk(
  'timesheet/fetchClientsForProjects',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.userId;
      const response = await httpService.get(`/timesheet/vendors/${userId}`);
      if (response?.data?.success && Array.isArray(response.data.data)) return response.data.data;
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
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
      const response = await httpService.get(`/timesheet/getTimesheetsByUserId?userId=${userId}`);
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
      const response = await httpService.post(`/timesheet/daily-entry?userId=${userId}`, timesheetData);
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
  async ({ timesheetId, files, attachmentStartDate, attachmentEndDate }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const queryParams = new URLSearchParams({ attachmentStartDate, attachmentEndDate }).toString();
      const response = await httpService.post(
        `/timesheet/${timesheetId}/attachments?${queryParams}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
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
      const response = await httpService.delete(`/timesheet/delete-attachments/${attachmentId}`);
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
      const response = await httpService.get(`/timesheet/${timesheetId}/attachments`);
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
        { responseType: 'blob' }
      );
      const blobData = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const contentDisposition = response.headers['content-disposition'];
      let filename = `attachment_${attachmentId}`;
      if (contentDisposition) {
        const m = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (m && m[1]) filename = m[1].replace(/['"]/g, '');
      }
      const contentType = response.headers['content-type'] || blobData.type || '';
      return { attachmentId, blob: blobData, filename, contentType };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadTimesheetAttachment = createAsyncThunk(
  'timesheet/downloadTimesheetAttachment',
  async ({ attachmentId, filename }, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        `/timesheet/attachments/${attachmentId}/download`,
        { responseType: 'blob' }
      );
      const blobData = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `attachment_${attachmentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      ToastService.info('File downloaded successfully');
      return { attachmentId, filename: filename || `attachment_${attachmentId}` };
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
      const response = await httpService.post(`/timesheet/approve?timesheetId=${timesheetId}&userId=${userId}`);
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

// ---------------------------------------------------------------------------
// SLICE
// ---------------------------------------------------------------------------
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
    viewError: null,

    // ---- Admin monthly list state ----
    monthlyTimesheets: [],
    monthlyLoading: false,
    monthlyError: null,
    pagination: {
      currentPage: 0,
      rowsPerPage: 20,
      totalCount: 0,
      totalPages: 0,
      monthStart: null,
      monthEnd: null
    }
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
    },
    resetMonthlyTimesheets: (state) => {
      state.monthlyTimesheets = [];
      state.monthlyError = null;
      state.pagination.currentPage = 0;
      state.pagination.totalCount = 0;
      state.pagination.totalPages = 0;
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setRowsPerPage: (state, action) => {
      state.pagination.rowsPerPage = action.payload;
      state.pagination.currentPage = 0;
    },
    setMonthRange: (state, action) => {
      state.pagination.monthStart = action.payload.monthStart;
      state.pagination.monthEnd = action.payload.monthEnd;
      state.pagination.currentPage = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // ---------- monthly list ----------
      .addCase(fetchMonthlyTimesheets.pending, (state) => {
        state.monthlyLoading = true;
        state.monthlyError = null;
      })
      .addCase(fetchMonthlyTimesheets.fulfilled, (state, action) => {
        state.monthlyLoading = false;

        const unique = [];
        const seen = new Set();
        for (const item of action?.payload?.content || []) {
          const key = JSON.stringify(item);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }

        state.monthlyTimesheets = unique;
        state.pagination.totalCount = action.payload.totalElements ?? unique.length;
        state.pagination.totalPages = action.payload.totalPages ?? 1;
        state.pagination.currentPage = action.payload.page ?? state.pagination.currentPage;
      })
      .addCase(fetchMonthlyTimesheets.rejected, (state, action) => {
        state.monthlyLoading = false;
        state.monthlyError = action.payload;
        state.monthlyTimesheets = [];
        state.pagination.totalCount = 0;
        state.pagination.totalPages = 0;
      })

      // ---------- clients ----------
      .addCase(fetchClientsForProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientsForProjects.fulfilled, (state, action) => { state.loading = false; state.clients = action.payload || []; })
      .addCase(fetchClientsForProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.clients = []; })

      // ---------- existing thunks (unchanged behaviour) ----------
      .addCase(fetchTimesheetsByUserId.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTimesheetsByUserId.fulfilled, (state, action) => { state.loading = false; state.timesheets = action.payload.data || []; })
      .addCase(fetchTimesheetsByUserId.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchTimesheetsByUserIdWithDateRange.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTimesheetsByUserIdWithDateRange.fulfilled, (state, action) => { state.loading = false; state.timesheets = action.payload?.data?.timesheets || []; })
      .addCase(fetchTimesheetsByUserIdWithDateRange.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createTimesheet.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createTimesheet.fulfilled, (state) => { state.loading = false; })
      .addCase(createTimesheet.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateTimesheet.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateTimesheet.fulfilled, (state) => { state.loading = false; })
      .addCase(updateTimesheet.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(submitWeeklyTimesheet.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitWeeklyTimesheet.fulfilled, (state) => { state.loading = false; })
      .addCase(submitWeeklyTimesheet.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(submitMonthlyTimesheet.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitMonthlyTimesheet.fulfilled, (state) => { state.loading = false; })
      .addCase(submitMonthlyTimesheet.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(uploadTimesheetAttachments.pending, (state) => { state.uploadLoading = true; state.uploadError = null; })
      .addCase(uploadTimesheetAttachments.fulfilled, (state) => { state.uploadLoading = false; })
      .addCase(uploadTimesheetAttachments.rejected, (state, action) => { state.uploadLoading = false; state.uploadError = action.payload; })

      .addCase(deleteTimesheetAttachments.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(deleteTimesheetAttachments.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(deleteTimesheetAttachments.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(viewTimesheetAttachment.pending, (state) => { state.viewLoading = true; state.viewError = null; })
      .addCase(viewTimesheetAttachment.fulfilled, (state) => { state.viewLoading = false; })
      .addCase(viewTimesheetAttachment.rejected, (state, action) => { state.viewLoading = false; state.viewError = action.payload; })

      .addCase(downloadTimesheetAttachment.pending, (state) => { state.downloadLoading = true; state.downloadError = null; })
      .addCase(downloadTimesheetAttachment.fulfilled, (state) => { state.downloadLoading = false; })
      .addCase(downloadTimesheetAttachment.rejected, (state, action) => { state.downloadLoading = false; state.downloadError = action.payload; })

      .addCase(approveTimesheet.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(approveTimesheet.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(approveTimesheet.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(approveTimesheetMonthly.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(approveTimesheetMonthly.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(approveTimesheetMonthly.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(rejectTimesheet.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(rejectTimesheet.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(rejectTimesheet.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(rejectTimesheetMonthly.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(rejectTimesheetMonthly.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(rejectTimesheetMonthly.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(getTimesheetAttachmentsById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getTimesheetAttachmentsById.fulfilled, (state, action) => { state.loading = false; state.attachments = action.payload.data || []; })
      .addCase(getTimesheetAttachmentsById.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.attachments = []; });
  }
});

export const {
  clearError,
  resetTimesheets,
  resetMonthlyTimesheets,
  setPage,
  setRowsPerPage,
  setMonthRange
} = timesheetSlice.actions;

export default timesheetSlice.reducer;