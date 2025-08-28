import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { hotlistAPI } from "../utils/api";

// Async thunks
export const fetchConsultants = createAsyncThunk(
  "hotlist/fetchConsultants",
  async (
    { userId, page, size, filters = {}, sort = {} },
    { rejectWithValue }
  ) => {
    try {
      // Prepare query parameters
      const queryParams = {
        page,
        size,
        ...filters,
        ...sort,
      };

      const response = await hotlistAPI.getConsultantsByUserId(userId, queryParams);

      const { content = [], totalElements = 0 } = response.data || {};
      return {
        data: content,
        total: totalElements,
        page: page + 1,
        size,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch consultants"
      );
    }
  }
);

export const fetchTeamConsultants = createAsyncThunk(
  "hotlist/fetchTeamConsultants",
  async (
    { userId, page, size, filters = {}, sort = {} },
    { rejectWithValue }
  ) => {
    try {
      // Prepare query parameters
      const queryParams = {
        page,
        size,
        ...filters,
        ...sort,
      };

      const response = await hotlistAPI.getTeamConsultants(userId, queryParams);

      const { content = [], totalElements = 0 } = response.data;
      return {
        data: content,
        total: totalElements,
        page: page + 1,
        size,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch team consultants"
      );
    }
  }
);

// Get all consultants
export const fetchAllConsultants = createAsyncThunk(
  "hotlist/fetchAllConsultants",
  async (
    { page, size, filters = {}, sort = {} },
    { rejectWithValue }
  ) => {
    try {
      // Prepare query parameters
      const queryParams = {
        page,
        size,
        ...filters,
        ...sort,
      };

      const response = await hotlistAPI.getAllConsultants(queryParams);

      const { content = [], totalElements = 0 } = response.data;
      return {
        data: content,
        total: totalElements,
        page: page + 1,
        size,
      };
    } catch (error) {
      console.log(error);
      const errorMessage =
        error.response?.data?.errorMessage || error.message || "Fetch failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createConsultant = createAsyncThunk(
  "hotlist/createConsultant",
  async ({ formData, candidateName, source }, { rejectWithValue }) => {
    try {
      const queryParams = {};
      if (candidateName) queryParams.candidateName = candidateName;
      if (source) queryParams.source = source;

      const response = await hotlistAPI.createConsultant(formData, queryParams);

      if (!response.success)
        throw new Error(response.message || "Creation failed");
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create consultant"
      );
    }
  }
);

export const updateConsultant = createAsyncThunk(
  "hotlist/updateConsultant",
  async ({ consultantId, consultantDto ,isAssignAll}, { rejectWithValue }) => {
    try {
      const response = await hotlistAPI.updateConsultant(
        consultantId,
        consultantDto,
        isAssignAll
      );
      if (!response.success)
        throw new Error(response.message || "Update failed");
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update consultant"
      );
    }
  }
);

export const deleteConsultant = createAsyncThunk(
  "hotlist/deleteConsultant",
  async (consultantId, { rejectWithValue }) => {
    try {
      const response = await hotlistAPI.deleteConsultant(consultantId);
      return {
        consultantId,
        message: response.data?.message || "Consultant deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete consultant"
      );
    }
  }
);

// Initial state
const initialState = {
  // Personal consultants data
  consultants: [],
  consultantsTotal: 0,
  consultantsCurrentPage: 1,
  consultantsPageSize: 10,
  consultantsLoading: false,
  consultantsError: null,

  // Team consultants data
  teamConsultants: [],
  teamConsultantsTotal: 0,
  teamConsultantsCurrentPage: 1,
  teamConsultantsPageSize: 10,
  teamConsultantsLoading: false,
  teamConsultantsError: null,

  // All consultants data for superadmin
  allConsultants: [],
  allConsultantsTotal: 0,
  allConsultantsCurrentPage: 1,
  allConsultantsPageSize: 10,
  allConsultantsLoading: false,
  allConsultantsError: null,

  // Form states
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,
  isDeleting: false,
  deleteError: null,

  // UI states
  showCreateForm: false,
  editingConsultant: null,
  currentView: "personal", // 'personal' or 'team'
};

// Slice
const hotlist = createSlice({
  name: "hotlist",
  initialState,
  reducers: {
    // View management
    setCurrentView: (state, action) => {
      state.currentView = action.payload; // 'personal' or 'team'
    },

    // UI actions
    setShowCreateForm: (state, action) => {
      state.showCreateForm = action.payload;
      if (!action.payload) {
        state.editingConsultant = null;
      }
    },

    setEditingConsultant: (state, action) => {
      state.editingConsultant = action.payload;
      state.showCreateForm = !!action.payload;
    },

    clearEditingConsultant: (state) => {
      state.editingConsultant = null;
      state.showCreateForm = false;
    },

    // Error clearing actions
    clearErrors: (state) => {
      state.consultantsError = null;
      state.teamConsultantsError = null;
      state.allConsultantsError = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },

    clearCreateError: (state) => {
      state.createError = null;
    },

    clearUpdateError: (state) => {
      state.updateError = null;
    },

    clearDeleteError: (state) => {
      state.deleteError = null;
    },

    // Reset state
    resetHotlist: (state) => {
      return { ...initialState };
    },
  },

  extraReducers: (builder) => {
    // Fetch personal consultants
    builder
      .addCase(fetchConsultants.pending, (state) => {
        state.consultantsLoading = true;
        state.consultantsError = null;
      })
      .addCase(fetchConsultants.fulfilled, (state, action) => {
        state.consultantsLoading = false;
        state.consultants = action.payload.data;
        state.consultantsTotal = action.payload.total;
        state.consultantsCurrentPage = action.payload.page;
        state.consultantsPageSize = action.payload.size;
        state.consultantsError = null;
      })
      .addCase(fetchConsultants.rejected, (state, action) => {
        state.consultantsLoading = false;
        state.consultantsError = action.payload;
        state.consultants = [];
        state.consultantsTotal = 0;
      });

    // Fetch team consultants
    builder
      .addCase(fetchTeamConsultants.pending, (state) => {
        state.teamConsultantsLoading = true;
        state.teamConsultantsError = null;
      })
      .addCase(fetchTeamConsultants.fulfilled, (state, action) => {
        state.teamConsultantsLoading = false;
        state.teamConsultants = action.payload.data;
        state.teamConsultantsTotal = action.payload.total;
        state.teamConsultantsCurrentPage = action.payload.page;
        state.teamConsultantsPageSize = action.payload.size;
        state.teamConsultantsError = null;
      })
      .addCase(fetchTeamConsultants.rejected, (state, action) => {
        state.teamConsultantsLoading = false;
        state.teamConsultantsError = action.payload;
        state.teamConsultants = [];
        state.teamConsultantsTotal = 0;
      });

    // Fetch All SuperAdmin consultants
    builder
      .addCase(fetchAllConsultants.pending, (state) => {
        state.allConsultantsLoading = true;
        state.allConsultantsError = null;
      })
      .addCase(fetchAllConsultants.fulfilled, (state, action) => {
        state.allConsultantsLoading = false;
        state.allConsultants = action.payload.data;
        state.allConsultantsTotal = action.payload.total;
        state.allConsultantsCurrentPage = action.payload.page;
        state.allConsultantsPageSize = action.payload.size;
        state.allConsultantsError = null;
      })
      .addCase(fetchAllConsultants.rejected, (state, action) => {
        state.allConsultantsLoading = false;
        state.allConsultantsError = action.payload; // This will be your message string
        state.allConsultants = [];
        state.allConsultantsTotal = 0;
      });

    // Create consultant
    builder
      .addCase(createConsultant.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createConsultant.fulfilled, (state, action) => {
        state.isCreating = false;
        state.createError = null;
        // Add to personal consultants only
        if (action.payload.data) {
          state.consultants.unshift(action.payload.data);
          state.consultantsTotal += 1;
        }
      })
      .addCase(createConsultant.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload;
      });

    // Update consultant
    builder
      .addCase(updateConsultant.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateConsultant.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateError = null;
        // Update in both lists if found
        if (action.payload.data) {
          const consultantId = action.payload.data.consultantId;

          // Update in personal consultants
          const personalIndex = state.consultants.findIndex(
            (c) => c.consultantId === consultantId
          );
          if (personalIndex !== -1) {
            state.consultants[personalIndex] = action.payload.data;
          }

          // Update in team consultants
          const teamIndex = state.teamConsultants.findIndex(
            (c) => c.consultantId === consultantId
          );
          if (teamIndex !== -1) {
            state.teamConsultants[teamIndex] = action.payload.data;
          }
        }
      })
      .addCase(updateConsultant.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      });

    // Delete consultant
    builder
      .addCase(deleteConsultant.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(deleteConsultant.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.deleteError = null;
        const consultantId = action.payload.consultantId;

        // Remove from personal consultants
        const personalCount = state.consultants.length;
        state.consultants = state.consultants.filter(
          (c) => c.consultantId !== consultantId
        );
        if (state.consultants.length < personalCount) {
          state.consultantsTotal = Math.max(0, state.consultantsTotal - 1);
        }

        // Remove from team consultants
        const teamCount = state.teamConsultants.length;
        state.teamConsultants = state.teamConsultants.filter(
          (c) => c.consultantId !== consultantId
        );
        if (state.teamConsultants.length < teamCount) {
          state.teamConsultantsTotal = Math.max(
            0,
            state.teamConsultantsTotal - 1
          );
        }
      })
      .addCase(deleteConsultant.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload;
      });
  },
});

// Export actions
export const {
  setCurrentView,
  setShowCreateForm,
  setEditingConsultant,
  clearEditingConsultant,
  clearErrors,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
  resetHotlist,
} = hotlist.actions;

// Selectors - Personal consultants
export const selectConsultants = (state) => state.hotlist.consultants;
export const selectConsultantsTotal = (state) => state.hotlist.consultantsTotal;
export const selectConsultantsCurrentPage = (state) =>
  state.hotlist.consultantsCurrentPage;
export const selectConsultantsPageSize = (state) =>
  state.hotlist.consultantsPageSize;
export const selectConsultantsLoading = (state) =>
  state.hotlist.consultantsLoading;
export const selectConsultantsError = (state) => state.hotlist.consultantsError;

// Selectors - Team consultants
export const selectTeamConsultants = (state) => state.hotlist.teamConsultants;
export const selectTeamConsultantsTotal = (state) =>
  state.hotlist.teamConsultantsTotal;
export const selectTeamConsultantsCurrentPage = (state) =>
  state.hotlist.teamConsultantsCurrentPage;
export const selectTeamConsultantsPageSize = (state) =>
  state.hotlist.teamConsultantsPageSize;
export const selectTeamConsultantsLoading = (state) =>
  state.hotlist.teamConsultantsLoading;
export const selectTeamConsultantsError = (state) =>
  state.hotlist.teamConsultantsError;

//all consultants

// Selectors - Team consultants
export const selectAllConsultants = (state) => state.hotlist.allConsultants;
export const selectAllConsultantsTotal = (state) =>
  state.hotlist.allConsultantsTotal;
export const selectAllConsultantsCurrentPage = (state) =>
  state.hotlist.allConsultantsCurrentPage;
export const selectAllConsultantsPageSize = (state) =>
  state.hotlist.allConsultantsPageSize;
export const selectAllConsultantsLoading = (state) =>
  state.hotlist.allConsultantsLoading;
export const selectAllConsultantsError = (state) =>
  state.hotlist.allConsultantsError;

// Selectors - Combined/Dynamic based on current view
export const selectCurrentView = (state) => state.hotlist.currentView;

// Dynamic selectors that return data based on current view
export const selectCurrentData = (state) => {
  const isTeamView = state.hotlist.currentView === "team";
  return isTeamView ? state.hotlist.teamConsultants : state.hotlist.consultants;
};

export const selectCurrentTotal = (state) => {
  const isTeamView = state.hotlist.currentView === "team";
  return isTeamView
    ? state.hotlist.teamConsultantsTotal
    : state.hotlist.consultantsTotal;
};

export const selectCurrentLoading = (state) => {
  const isTeamView = state.hotlist.currentView === "team";
  return isTeamView
    ? state.hotlist.teamConsultantsLoading
    : state.hotlist.consultantsLoading;
};

export const selectCurrentError = (state) => {
  const isTeamView = state.hotlist.currentView === "team";
  return isTeamView
    ? state.hotlist.teamConsultantsError
    : state.hotlist.consultantsError;
};

// Legacy selectors for backward compatibility
export const selectTotal = (state) => selectCurrentTotal(state);
export const selectLoading = (state) => selectCurrentLoading(state);
export const selectError = (state) => selectCurrentError(state);

// Form selectors
export const selectIsCreating = (state) => state.hotlist.isCreating;
export const selectCreateError = (state) => state.hotlist.createError;
export const selectIsUpdating = (state) => state.hotlist.isUpdating;
export const selectUpdateError = (state) => state.hotlist.updateError;
export const selectIsDeleting = (state) => state.hotlist.isDeleting;
export const selectDeleteError = (state) => state.hotlist.deleteError;

export const selectShowCreateForm = (state) => state.hotlist.showCreateForm;
export const selectEditingConsultant = (state) =>
  state.hotlist.editingConsultant;

// Export reducer
export default hotlist.reducer;
