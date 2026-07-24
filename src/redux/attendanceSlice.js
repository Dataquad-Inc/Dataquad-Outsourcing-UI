// src/redux/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mymulya.com';

// Fetch attendance dashboard data
export const fetchAttendanceData = createAsyncThunk(
  'attendance/fetchAttendanceData',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/attendance/dashboard`,
        {
          params: { month, year, entity },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Failed to fetch attendance data');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch attendance data'
      );
    }
  }
);

// Fetch pending attendance data for SUPERADMIN (GET)
export const fetchPendingAttendance = createAsyncThunk(
  'attendance/fetchPendingAttendance',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/attendance/pending`,
        {
          params: { month, year, entity },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Failed to fetch pending attendance data');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch pending attendance data'
      );
    }
  }
);

// Update single day attendance (PUT)
export const updateAttendanceDay = createAsyncThunk(
  'attendance/updateAttendanceDay',
  async ({ employeeId, day, selectedMonth, selectedYear, status, getAttendanceValue, getAttendanceRemarks, entity }, { rejectWithValue }) => {
    try {
      const getAttendanceDateInfo = (day, month, year) => {
        const dayNum = parseInt(day);
        let actualMonth;
        let actualYear = year;

        if (dayNum >= 1 && dayNum <= 25) {
          actualMonth = month;
        } else {
          actualMonth = month - 1;
          if (actualMonth < 1) {
            actualMonth = 12;
            actualYear = year - 1;
          }
        }

        const dateObj = new Date(actualYear, actualMonth - 1, dayNum);
        const formattedYear = dateObj.getFullYear();
        const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(dateObj.getDate()).padStart(2, '0');

        return {
          date: `${formattedYear}-${formattedMonth}-${formattedDay}`,
          month: month,
          year: year,
        };
      };

      const dateInfo = getAttendanceDateInfo(day, selectedMonth, selectedYear);

      const payload = {
        attendanceDate: dateInfo.date,
        attendanceMonth: dateInfo.month,
        attendanceYear: dateInfo.year,
        entity: entity,
        employees: [
          {
            employeeId: employeeId,
            attendanceStatus: status || '',
            attendanceValue: getAttendanceValue(status),
            remarks: getAttendanceRemarks(status),
          },
        ],
      };

      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/day/edit`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to update attendance');
      }

      return {
        ...response.data,
        employeeId,
        day,
        status,
        payload,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update attendance'
      );
    }
  }
);

// Fetch holidays for a specific month/year
export const fetchHolidays = createAsyncThunk(
  'attendance/fetchHolidays',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/attendance/month/holidays`,
        {
          params: { month, year, entity },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch holidays');
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: [], message: 'No holidays found' };
      }
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch holidays'
      );
    }
  }
);

// Setup attendance month with holidays (POST)
export const setupAttendanceMonth = createAsyncThunk(
  'attendance/setupAttendanceMonth',
  async ({ month, year, publicHolidays, entity }, { rejectWithValue }) => {
    try {
      const payload = {
        month,
        year,
        publicHolidays,
        entity,
      };

      const response = await axios.post(
        `${API_BASE_URL}/users/attendance/month/setup`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to configure attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to configure attendance'
      );
    }
  }
);

// Update attendance month configuration (PUT)
export const updateAttendanceMonth = createAsyncThunk(
  'attendance/updateAttendanceMonth',
  async ({ month, year, publicHolidays, entity }, { rejectWithValue }) => {
    try {
      const payload = {
        month,
        year,
        publicHolidays,
        entity,
      };

      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/month/edit`,
        payload,
        {
          params:{entity},
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to update attendance month');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update attendance month'
      );
    }
  }
);

// Delete attendance month configuration (DELETE)
export const deleteAttendanceMonth = createAsyncThunk(
  'attendance/deleteAttendanceMonth',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/users/attendance/monthconfig/delete`,
        {
          params: { month, year, entity },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to delete attendance configuration');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete attendance configuration'
      );
    }
  }
);

// Delete a specific holiday (DELETE)
export const deleteHoliday = createAsyncThunk(
  'attendance/deleteHoliday',
  async ({ month, year, entity, date }, { rejectWithValue }) => {
    try {
      // First get current holidays
      const holidaysResponse = await axios.get(
        `${API_BASE_URL}/users/attendance/month/holidays`,
        {
          params: { month, year, entity },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!holidaysResponse.data.success) {
        return rejectWithValue('Failed to fetch current holidays');
      }

      // Filter out the holiday to delete
      const currentHolidays = holidaysResponse.data.data || [];
      const updatedHolidays = currentHolidays.filter(h => h !== date);

      // Update the attendance month with the new holiday list
      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/month/edit`,
        {
          month,
          year,
          publicHolidays: updatedHolidays,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to delete holiday');
      }

      return {
        ...response.data,
        deletedDate: date,
        updatedHolidays,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete holiday'
      );
    }
  }
);

// Submit weekly attendance (POST)
export const submitWeeklyAttendance = createAsyncThunk(
  'attendance/submitWeeklyAttendance',
  async ({ month, year, weekNumber, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/attendance/submit`,
        {
          month,
          year,
          weekNumber,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to submit weekly attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to submit weekly attendance'
      );
    }
  }
);

// Submit monthly attendance (POST)
export const submitMonthlyAttendance = createAsyncThunk(
  'attendance/submitMonthlyAttendance',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/attendance/submit`,
        {
          month,
          year,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to submit monthly attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to submit monthly attendance'
      );
    }
  }
);

// Approve weekly attendance (POST)
export const approveWeeklyAttendance = createAsyncThunk(
  'attendance/approveWeeklyAttendance',
  async ({ month, year, weekNumber, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/approve`,
        {
          month,
          year,
          weekNumber,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to approve weekly attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to approve weekly attendance'
      );
    }
  }
);

// Approve monthly attendance (POST)
export const approveMonthlyAttendance = createAsyncThunk(
  'attendance/approveMonthlyAttendance',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/approve`,
        {
          month,
          year,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to approve monthly attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to approve monthly attendance'
      );
    }
  }
);

// Reject weekly attendance (POST)
export const rejectWeeklyAttendance = createAsyncThunk(
  'attendance/rejectWeeklyAttendance',
  async ({ month, year, weekNumber, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/reject`,
        {
          month,
          year,
          weekNumber,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to reject weekly attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to reject weekly attendance'
      );
    }
  }
);

// Reject monthly attendance (POST)
export const rejectMonthlyAttendance = createAsyncThunk(
  'attendance/rejectMonthlyAttendance',
  async ({ month, year, entity }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/attendance/reject`,
        {
          month,
          year,
          entity,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to reject monthly attendance');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to reject monthly attendance'
      );
    }
  }
);

const initialState = {
  // ===== Attendance Data =====
  attendanceData: [],
  loading: false,
  error: null,
  success: false,
  message: '',
  
  // ===== Pending Attendance Data (for SUPERADMIN) =====
  pendingAttendanceData: [],
  pendingLoading: false,
  pendingError: null,
  
  // ===== Pagination & Sorting =====
  page: 0,
  rowsPerPage: 20,
  search: '',
  orderBy: 'serialNo',
  order: 'asc',
  
  // ===== Filters =====
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  entity: 'IN',
  
  // ===== Attendance Update Status =====
  updateLoading: false,
  updateSuccess: false,
  updateError: null,
  
  // ===== Weekly Attendance Status =====
  weeklyLoading: false,
  weeklySuccess: false,
  weeklyError: null,
  weeklyActionType: null, // 'submit', 'approve', 'reject'
  
  // ===== Monthly Attendance Status =====
  monthlyLoading: false,
  monthlySuccess: false,
  monthlyError: null,
  monthlyActionType: null, // 'submit', 'approve', 'reject'
  
  // ===== Holidays =====
  holidays: [],
  isConfigured: false,
  configuring: false,
  deletingHoliday: false,
  
  // ===== Holiday Form =====
  holidayFormOpen: false,
  editingHoliday: null,
  holidayFormData: {
    name: '',
    date: '',
    type: 'NATIONAL',
    description: '',
  },
  
  // ===== Configuration Dialog =====
  configOpen: false,
  configData: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  
  // ===== Weekly Dialog =====
  weeklyDialogOpen: false,
  selectedWeekNumber: null,
  
  // ===== Snackbar =====
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    // ===== Attendance Filters =====
    setSelectedMonth: (state, action) => {
      state.selectedMonth = action.payload;
      state.configData.month = action.payload;
    },
    setSelectedYear: (state, action) => {
      state.selectedYear = action.payload;
      state.configData.year = action.payload;
    },
    setEntity: (state, action) => {
      state.entity = action.payload;
    },
    
    // ===== Pagination =====
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setRowsPerPage: (state, action) => {
      state.rowsPerPage = action.payload;
      state.page = 0;
    },
    
    // ===== Search =====
    setSearch: (state, action) => {
      state.search = action.payload;
      state.page = 0;
    },
    
    // ===== Sorting =====
    setOrderBy: (state, action) => {
      state.orderBy = action.payload;
    },
    setOrder: (state, action) => {
      state.order = action.payload;
    },
    
    // ===== Weekly Dialog =====
    openWeeklyDialog: (state, action) => {
      state.weeklyDialogOpen = true;
      state.selectedWeekNumber = action.payload;
    },
    closeWeeklyDialog: (state) => {
      state.weeklyDialogOpen = false;
      state.selectedWeekNumber = null;
    },
    
    // ===== Holiday Form =====
    openHolidayForm: (state) => {
      state.holidayFormOpen = true;
    },
    closeHolidayForm: (state) => {
      state.holidayFormOpen = false;
      state.editingHoliday = null;
      state.holidayFormData = {
        name: '',
        date: '',
        type: 'NATIONAL',
        description: '',
      };
    },
    setHolidayFormData: (state, action) => {
      state.holidayFormData = {
        ...state.holidayFormData,
        ...action.payload,
      };
    },
    setEditingHoliday: (state, action) => {
      state.editingHoliday = action.payload;
      if (action.payload) {
        state.holidayFormData = {
          name: action.payload.name,
          date: action.payload.date,
          type: action.payload.type,
          description: action.payload.description || '',
        };
      }
    },
    
    // ===== Holiday CRUD (Local - for optimistic updates) =====
    addHolidayLocal: (state, action) => {
      state.holidays.push(action.payload);
      state.isConfigured = true; // Once a holiday is added, it's configured
      state.snackbar = {
        open: true,
        message: 'Holiday added successfully',
        severity: 'success',
      };
    },
    deleteHolidayLocal: (state, action) => {
      state.holidays = state.holidays.filter(h => h.id !== action.payload);
      // Keep isConfigured as true even if holidays become empty
      // because the configuration still exists
    },
    
    // ===== Configuration Dialog =====
    openConfigDialog: (state) => {
      state.configOpen = true;
    },
    closeConfigDialog: (state) => {
      state.configOpen = false;
    },
    setConfigData: (state, action) => {
      state.configData = {
        ...state.configData,
        ...action.payload,
      };
    },
    
    // ===== Snackbar =====
    clearSnackbar: (state) => {
      state.snackbar.open = false;
      state.snackbar.message = '';
      state.snackbar.severity = 'info';
    },
    setSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        ...action.payload,
      };
    },
    
    // ===== Clear Errors =====
    clearErrors: (state) => {
      state.error = null;
      state.updateError = null;
      state.weeklyError = null;
      state.monthlyError = null;
      state.pendingError = null;
    },
    
    // ===== Reset Update Status =====
    resetUpdateStatus: (state) => {
      state.updateLoading = false;
      state.updateSuccess = false;
      state.updateError = null;
    },
    
    // ===== Reset Weekly Status =====
    resetWeeklyStatus: (state) => {
      state.weeklyLoading = false;
      state.weeklySuccess = false;
      state.weeklyError = null;
      state.weeklyActionType = null;
    },
    
    // ===== Reset Monthly Status =====
    resetMonthlyStatus: (state) => {
      state.monthlyLoading = false;
      state.monthlySuccess = false;
      state.monthlyError = null;
      state.monthlyActionType = null;
    },
    
    // ===== Reset Config Status =====
    resetConfigStatus: (state) => {
      state.configuring = false;
      state.isConfigured = false;
    },
    
    // ===== Clear Attendance Data =====
    clearAttendanceData: (state) => {
      state.attendanceData = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchAttendanceData.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Check if the response indicates no data or not configured
        const data = action.payload.data || [];
        const isConfigured = action.payload.isConfigured !== undefined 
          ? action.payload.isConfigured 
          : data.length > 0;
        
        // If not configured, clear the data
        if (!isConfigured) {
          state.attendanceData = [];
          state.isConfigured = false;
          state.message = 'Attendance month is not configured yet';
          state.snackbar = {
            open: true,
            message: state.message,
            severity: 'warning',
          };
        } else {
          state.attendanceData = data;
          state.isConfigured = true;
          state.message = action.payload.message || 'Attendance data loaded successfully';
          state.snackbar = {
            open: true,
            message: state.message,
            severity: 'success',
          };
        }
        state.error = null;
      })
      .addCase(fetchAttendanceData.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || 'Failed to fetch attendance data';
        state.message = state.error;
        // Clear attendance data on error to prevent stale data
        state.attendanceData = [];
        state.isConfigured = false;
        state.snackbar = {
          open: true,
          message: state.error,
          severity: 'error',
        };
      })

      // ===== Pending Attendance =====
      .addCase(fetchPendingAttendance.pending, (state) => {
        state.pendingLoading = true;
        state.pendingError = null;
      })
      .addCase(fetchPendingAttendance.fulfilled, (state, action) => {
        state.pendingLoading = false;
        state.pendingAttendanceData = action.payload.data || [];
        state.message = action.payload.message || 'Pending attendance data loaded successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(fetchPendingAttendance.rejected, (state, action) => {
        state.pendingLoading = false;
        state.pendingError = action.payload || 'Failed to fetch pending attendance data';
        state.message = state.pendingError;
        state.snackbar = {
          open: true,
          message: state.pendingError,
          severity: 'error',
        };
      })

      .addCase(updateAttendanceDay.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateAttendanceDay.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;
        state.updateError = null;
        state.message = action.payload.message || 'Attendance updated successfully';

        const { employeeId, day, status } = action.payload;
        const employee = state.attendanceData.find(emp => emp.employeeId === employeeId);
        
        if (employee) {
          employee.attendanceGrid = {
            ...employee.attendanceGrid,
            [day]: status || '',
          };

          const presentDays = Object.values(employee.attendanceGrid).filter(
            s => s === 'P' || s === 'SP' || s === 'HD'
          ).length;

          const leaveDays = Object.values(employee.attendanceGrid).filter(
            s => s === 'L' || s === 'LOP'
          ).length;

          employee.totalPresentDays = presentDays;
          employee.totalLeaves = leaveDays;
          employee.totalPaidDays = employee.totalWorkingDays - leaveDays;
        }

        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(updateAttendanceDay.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = false;
        state.updateError = action.payload || 'Failed to update attendance';
        state.message = state.updateError;
        state.snackbar = {
          open: true,
          message: state.updateError,
          severity: 'error',
        };
      })

      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        const holidayData = action.payload.data || [];
        
        state.holidays = holidayData.map((date, index) => ({
          id: `holiday_${index}_${date}`,
          date: date,
        }));
        
        // CRITICAL FIX: Set isConfigured to true when API returns success (even with empty data)
        // This indicates the month has been configured, just with no holidays
        state.isConfigured = true;
        state.message = action.payload.message || 'Holidays loaded successfully';

        if (state.holidays.length > 0) {
          state.snackbar = {
            open: true,
            message: `Loaded ${state.holidays.length} holidays`,
            severity: 'success',
          };
        } else {
          state.snackbar = {
            open: true,
            message: 'Month is configured with no holidays',
            severity: 'info',
          };
        }
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.holidays = [];
        // Only set isConfigured to false if it's a 404 (not found) error
        // This means the month hasn't been configured yet
        if (action.payload === 'No holidays found' || action.error?.message?.includes('404')) {
          state.isConfigured = false;
        } else {
          // For other errors, keep the existing configuration state
          state.isConfigured = state.isConfigured || false;
        }
        state.error = action.payload || 'Failed to fetch holidays';
        
        if (action.payload !== 'No holidays found') {
          state.snackbar = {
            open: true,
            message: state.error,
            severity: 'error',
          };
        }
      })

      .addCase(setupAttendanceMonth.pending, (state) => {
        state.configuring = true;
        state.error = null;
      })
      .addCase(setupAttendanceMonth.fulfilled, (state, action) => {
        state.configuring = false;
        state.isConfigured = true;
        state.success = true;
        state.message = action.payload.message || 'Attendance month configured successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(setupAttendanceMonth.rejected, (state, action) => {
        state.configuring = false;
        state.isConfigured = false;
        state.success = false;
        state.error = action.payload || 'Failed to configure attendance month';
        state.message = state.error;
        state.snackbar = {
          open: true,
          message: state.error,
          severity: 'error',
        };
      })

      .addCase(updateAttendanceMonth.pending, (state) => {
        state.configuring = true;
        state.error = null;
      })
      .addCase(updateAttendanceMonth.fulfilled, (state, action) => {
        state.configuring = false;
        state.isConfigured = true;
        state.success = true;
        state.message = action.payload.message || 'Attendance month updated successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(updateAttendanceMonth.rejected, (state, action) => {
        state.configuring = false;
        state.isConfigured = false;
        state.success = false;
        state.error = action.payload || 'Failed to update attendance month';
        state.message = state.error;
        state.snackbar = {
          open: true,
          message: state.error,
          severity: 'error',
        };
      })

      // Delete Attendance Month
      .addCase(deleteAttendanceMonth.pending, (state) => {
        state.configuring = true;
        state.error = null;
      })
      .addCase(deleteAttendanceMonth.fulfilled, (state, action) => {
        state.configuring = false;
        state.isConfigured = false;
        state.holidays = [];
        state.attendanceData = []; // Clear attendance data when configuration is deleted
        state.success = true;
        state.message = action.payload.message || 'Attendance configuration deleted successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(deleteAttendanceMonth.rejected, (state, action) => {
        state.configuring = false;
        state.isConfigured = false;
        state.success = false;
        state.error = action.payload || 'Failed to delete attendance configuration';
        state.message = state.error;
        state.snackbar = {
          open: true,
          message: state.error,
          severity: 'error',
        };
      })

      // Delete Holiday
      .addCase(deleteHoliday.pending, (state) => {
        state.deletingHoliday = true;
        state.error = null;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.deletingHoliday = false;
        state.success = true;
        state.message = action.payload.message || 'Holiday deleted successfully';
        
        const deletedDate = action.payload.deletedDate;
        state.holidays = state.holidays.filter(h => h.date !== deletedDate);
        // Keep isConfigured as true even if holidays become empty
        state.isConfigured = true;
        
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.deletingHoliday = false;
        state.success = false;
        state.error = action.payload || 'Failed to delete holiday';
        state.message = state.error;
        state.snackbar = {
          open: true,
          message: state.error,
          severity: 'error',
        };
      })

      // ===== Weekly Submit =====
      .addCase(submitWeeklyAttendance.pending, (state) => {
        state.weeklyLoading = true;
        state.weeklyError = null;
        state.weeklySuccess = false;
        state.weeklyActionType = 'submit';
      })
      .addCase(submitWeeklyAttendance.fulfilled, (state, action) => {
        state.weeklyLoading = false;
        state.weeklySuccess = true;
        state.weeklyError = null;
        state.message = action.payload.message || 'Weekly attendance submitted successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(submitWeeklyAttendance.rejected, (state, action) => {
        state.weeklyLoading = false;
        state.weeklySuccess = false;
        state.weeklyError = action.payload || 'Failed to submit weekly attendance';
        state.message = state.weeklyError;
        state.snackbar = {
          open: true,
          message: state.weeklyError,
          severity: 'error',
        };
      })

      // ===== Monthly Submit =====
      .addCase(submitMonthlyAttendance.pending, (state) => {
        state.monthlyLoading = true;
        state.monthlyError = null;
        state.monthlySuccess = false;
        state.monthlyActionType = 'submit';
      })
      .addCase(submitMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyLoading = false;
        state.monthlySuccess = true;
        state.monthlyError = null;
        state.message = action.payload.message || 'Monthly attendance submitted successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(submitMonthlyAttendance.rejected, (state, action) => {
        state.monthlyLoading = false;
        state.monthlySuccess = false;
        state.monthlyError = action.payload || 'Failed to submit monthly attendance';
        state.message = state.monthlyError;
        state.snackbar = {
          open: true,
          message: state.monthlyError,
          severity: 'error',
        };
      })

      // ===== Weekly Approve =====
      .addCase(approveWeeklyAttendance.pending, (state) => {
        state.weeklyLoading = true;
        state.weeklyError = null;
        state.weeklySuccess = false;
        state.weeklyActionType = 'approve';
      })
      .addCase(approveWeeklyAttendance.fulfilled, (state, action) => {
        state.weeklyLoading = false;
        state.weeklySuccess = true;
        state.weeklyError = null;
        state.message = action.payload.message || 'Weekly attendance approved successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(approveWeeklyAttendance.rejected, (state, action) => {
        state.weeklyLoading = false;
        state.weeklySuccess = false;
        state.weeklyError = action.payload || 'Failed to approve weekly attendance';
        state.message = state.weeklyError;
        state.snackbar = {
          open: true,
          message: state.weeklyError,
          severity: 'error',
        };
      })

      // ===== Monthly Approve =====
      .addCase(approveMonthlyAttendance.pending, (state) => {
        state.monthlyLoading = true;
        state.monthlyError = null;
        state.monthlySuccess = false;
        state.monthlyActionType = 'approve';
      })
      .addCase(approveMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyLoading = false;
        state.monthlySuccess = true;
        state.monthlyError = null;
        state.message = action.payload.message || 'Monthly attendance approved successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(approveMonthlyAttendance.rejected, (state, action) => {
        state.monthlyLoading = false;
        state.monthlySuccess = false;
        state.monthlyError = action.payload || 'Failed to approve monthly attendance';
        state.message = state.monthlyError;
        state.snackbar = {
          open: true,
          message: state.monthlyError,
          severity: 'error',
        };
      })

      // ===== Weekly Reject =====
      .addCase(rejectWeeklyAttendance.pending, (state) => {
        state.weeklyLoading = true;
        state.weeklyError = null;
        state.weeklySuccess = false;
        state.weeklyActionType = 'reject';
      })
      .addCase(rejectWeeklyAttendance.fulfilled, (state, action) => {
        state.weeklyLoading = false;
        state.weeklySuccess = true;
        state.weeklyError = null;
        state.message = action.payload.message || 'Weekly attendance rejected successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(rejectWeeklyAttendance.rejected, (state, action) => {
        state.weeklyLoading = false;
        state.weeklySuccess = false;
        state.weeklyError = action.payload || 'Failed to reject weekly attendance';
        state.message = state.weeklyError;
        state.snackbar = {
          open: true,
          message: state.weeklyError,
          severity: 'error',
        };
      })

      // ===== Monthly Reject =====
      .addCase(rejectMonthlyAttendance.pending, (state) => {
        state.monthlyLoading = true;
        state.monthlyError = null;
        state.monthlySuccess = false;
        state.monthlyActionType = 'reject';
      })
      .addCase(rejectMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyLoading = false;
        state.monthlySuccess = true;
        state.monthlyError = null;
        state.message = action.payload.message || 'Monthly attendance rejected successfully';
        state.snackbar = {
          open: true,
          message: state.message,
          severity: 'success',
        };
      })
      .addCase(rejectMonthlyAttendance.rejected, (state, action) => {
        state.monthlyLoading = false;
        state.monthlySuccess = false;
        state.monthlyError = action.payload || 'Failed to reject monthly attendance';
        state.message = state.monthlyError;
        state.snackbar = {
          open: true,
          message: state.monthlyError,
          severity: 'error',
        };
      });
  },
});

export const {
  // Attendance filters
  setSelectedMonth,
  setSelectedYear,
  setEntity,
  
  // Pagination
  setPage,
  setRowsPerPage,
  
  // Search
  setSearch,
  
  // Sorting
  setOrderBy,
  setOrder,
  
  // Weekly Dialog
  openWeeklyDialog,
  closeWeeklyDialog,
  
  // Holiday Form
  openHolidayForm,
  closeHolidayForm,
  setHolidayFormData,
  setEditingHoliday,
  
  // Holiday CRUD
  addHolidayLocal,
  deleteHolidayLocal,
  
  // Configuration Dialog
  openConfigDialog,
  closeConfigDialog,
  setConfigData,
  
  // Snackbar
  clearSnackbar,
  setSnackbar,
  
  // Utilities
  clearErrors,
  resetUpdateStatus,
  resetWeeklyStatus,
  resetMonthlyStatus,
  resetConfigStatus,
  clearAttendanceData,
} = attendanceSlice.actions;


// Attendance Data Selectors
export const selectAttendanceData = (state) => state.attendance.attendanceData;
export const selectLoading = (state) => state.attendance.loading;
export const selectError = (state) => state.attendance.error;
export const selectSuccess = (state) => state.attendance.success;
export const selectMessage = (state) => state.attendance.message;

// Pending Attendance Data Selectors
export const selectPendingAttendanceData = (state) => state.attendance.pendingAttendanceData;
export const selectPendingLoading = (state) => state.attendance.pendingLoading;
export const selectPendingError = (state) => state.attendance.pendingError;

// Filter Selectors
export const selectSelectedMonth = (state) => state.attendance.selectedMonth;
export const selectSelectedYear = (state) => state.attendance.selectedYear;
export const selectEntity = (state) => state.attendance.entity;

// Pagination Selectors
export const selectPage = (state) => state.attendance.page;
export const selectRowsPerPage = (state) => state.attendance.rowsPerPage;
export const selectSearch = (state) => state.attendance.search;
export const selectOrderBy = (state) => state.attendance.orderBy;
export const selectOrder = (state) => state.attendance.order;

// Update Status Selectors
export const selectUpdateLoading = (state) => state.attendance.updateLoading;
export const selectUpdateSuccess = (state) => state.attendance.updateSuccess;
export const selectUpdateError = (state) => state.attendance.updateError;

// Weekly Status Selectors
export const selectWeeklyLoading = (state) => state.attendance.weeklyLoading;
export const selectWeeklySuccess = (state) => state.attendance.weeklySuccess;
export const selectWeeklyError = (state) => state.attendance.weeklyError;
export const selectWeeklyActionType = (state) => state.attendance.weeklyActionType;

// Monthly Status Selectors
export const selectMonthlyLoading = (state) => state.attendance.monthlyLoading;
export const selectMonthlySuccess = (state) => state.attendance.monthlySuccess;
export const selectMonthlyError = (state) => state.attendance.monthlyError;
export const selectMonthlyActionType = (state) => state.attendance.monthlyActionType;

// Weekly Dialog Selectors
export const selectWeeklyDialogOpen = (state) => state.attendance.weeklyDialogOpen;
export const selectSelectedWeekNumber = (state) => state.attendance.selectedWeekNumber;

// Holiday Selectors
export const selectHolidays = (state) => state.attendance.holidays;
export const selectIsConfigured = (state) => state.attendance.isConfigured;
export const selectConfiguring = (state) => state.attendance.configuring;
export const selectDeletingHoliday = (state) => state.attendance.deletingHoliday;

// Holiday Form Selectors
export const selectHolidayFormOpen = (state) => state.attendance.holidayFormOpen;
export const selectEditingHoliday = (state) => state.attendance.editingHoliday;
export const selectHolidayFormData = (state) => state.attendance.holidayFormData;

// Configuration Dialog Selectors
export const selectConfigOpen = (state) => state.attendance.configOpen;
export const selectConfigData = (state) => state.attendance.configData;

// Snackbar Selector
export const selectSnackbar = (state) => state.attendance.snackbar;

export default attendanceSlice.reducer;