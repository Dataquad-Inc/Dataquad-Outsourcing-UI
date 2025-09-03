import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";
import ToastService from "../Services/toastService";

const formatDateForAPI = (dateStr) => {
  if (!dateStr) return null;

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  try {
    // Handle MM/DD/YYYY format from UI
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // For other formats, use UTC to avoid timezone issues
    const date = new Date(dateStr + "T00:00:00");
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date for API:", e, dateStr);
    return null;
  }
};

const formatDateForUI = (isoDate) => {
  if (!isoDate) return "";

  try {
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split("-");
      return `${month}/${day}/${year}`;
    }

    // Handle MM/DD/YYYY format (already formatted)
    if (isoDate.includes("/")) {
      return isoDate;
    }

    // For ISO datetime strings, extract date part and avoid timezone conversion
    const dateStr = isoDate.split("T")[0];
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error("Error formatting date for UI:", error, isoDate);
    return "";
  }
};

const formatDateForFormInput = (dateStr) => {
  if (!dateStr) return "";

  try {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Handle MM/DD/YYYY format from display
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // For other formats, extract date components without timezone conversion
    const date = new Date(dateStr + "T00:00:00");
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date for form input:", error, dateStr);
    return "";
  }
};

// Async thunk to fetch placements list
export const fetchPlacements = createAsyncThunk(
  "placement/fetchPlacements",
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpService.get(
        "/candidate/placement/placements-list"
      );
      const rawData = response.data.data;

      const formattedData = rawData.map((item) => ({
        ...item,
        startDate: item.startDate ? formatDateForUI(item.startDate) : "",
        endDate: item.endDate ? formatDateForUI(item.endDate) : "",
      }));

      return formattedData;
    } catch (error) {
      ToastService.error("Failed to load placement data. Please try again.");
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch placements"
      );
    }
  }
);

// Async thunk to create a new placement
export const createPlacement = createAsyncThunk(
  "placement/createPlacement",
  async (placementData, { rejectWithValue, dispatch }) => {
    try {
      const submissionValues = {
        ...placementData,
        startDate: placementData.startDate
          ? formatDateForAPI(placementData.startDate)
          : null,
        endDate: placementData.endDate
          ? formatDateForAPI(placementData.endDate)
          : null,
      };

      const response = await httpService.post(
        "/candidate/placement/create-placement",
        submissionValues
      );

      if (response.data.success) {
        ToastService.success("New placement created successfully!");
        // Refetch placements after creating a new one
        dispatch(fetchPlacements());
        return response.data;
      } else {
        throw new Error(response.data.error || "Failed to create placement");
      }
    } catch (error) {
      ToastService.error(
        error.response?.data?.message ||
          "Failed to create placement. Please try again."
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to create placement"
      );
    }
  }
);

// Async thunk to update a placement
export const updatePlacement = createAsyncThunk(
  "placement/updatePlacement",
  async ({ id, placementData }, { rejectWithValue, dispatch }) => {
    try {
      const submissionValues = {
        ...placementData,
        startDate: placementData.startDate
          ? formatDateForAPI(placementData.startDate)
          : null,
        endDate: placementData.endDate
          ? formatDateForAPI(placementData.endDate)
          : null,
      };

      const response = await httpService.put(
        `/candidate/placement/update-placement/${id}`,
        submissionValues
      );

      if (response.data.success) {
        const { message, data } = response.data;
        ToastService.success(
          `${message}! Candidate ID: ${data.id}, Name: ${data.candidateFullName}`
        );
        // Refetch placements after updating
        dispatch(fetchPlacements());
        return response.data;
      } else {
        throw new Error(response.data.error || "Failed to update placement");
      }
    } catch (error) {
      ToastService.error(
        error.response?.data?.message ||
          "Failed to update placement. Please try again."
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update placement"
      );
    }
  }
);

// Async thunk to delete a placement
export const deletePlacement = createAsyncThunk(
  "placement/deletePlacement",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await httpService.delete(
        `/candidate/placement/delete-placement/${id}`
      );

      if (response.data.success) {
        ToastService.success("Placement deleted successfully!");
        // Refetch placements after deleting
        dispatch(fetchPlacements());
        return response.data;
      } else {
        throw new Error(response.data.error || "Failed to delete placement");
      }
    } catch (error) {
      ToastService.error(
        error.response?.data?.message ||
          "Failed to delete placement. Please try again."
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete placement"
      );
    }
  }
);

// Fixed async thunk for date range filtering
export const filterPlacementByDateRange = createAsyncThunk(
  "placement/filterByDateRange",
  async ({ startDate, endDate }, thunkAPI) => {
    try {
      const response = await httpService.get(
        `/candidate/placement/filterByDate?startDate=${startDate}&endDate=${endDate}`
      );

      // Format the filtered data for UI display
      const rawData = response.data.data || response.data;
      const formattedData = rawData.map((item) => ({
        ...item,
        startDate: item.startDate ? formatDateForUI(item.startDate) : "",
        endDate: item.endDate ? formatDateForUI(item.endDate) : "",
      }));

      return formattedData;
    } catch (error) {
      ToastService.error("Failed to filter placements by date range.");
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch placements"
      );
    }
  }
);

const initialState = {
  placements: [],
  loading: false,
  error: null,
  success: false,
  actionType: null, // To track what action is in progress (create, update, delete)
  selectedPlacement: null, // To store the currently selected placement
  isFiltered: false, // Track if data is currently filtered
};

const placementSlice = createSlice({
  name: "placement",
  initialState,
  reducers: {
    resetPlacementState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.actionType = null;
    },
    // FIXED: setSelectedPlacement - properly formats dates for form input
    setSelectedPlacement: (state, action) => {
      if (action.payload) {
        const placement = action.payload;
        console.log("Original placement dates:", {
          startDate: placement.startDate,
          endDate: placement.endDate,
        });

        state.selectedPlacement = {
          ...placement,
          // Use formatDateForFormInput instead of formatDateForAPI
          // This ensures dates are in YYYY-MM-DD format for HTML date inputs
          startDate: placement.startDate
            ? formatDateForFormInput(placement.startDate)
            : "",
          endDate: placement.endDate
            ? formatDateForFormInput(placement.endDate)
            : "",
        };

        console.log("Formatted placement dates:", {
          startDate: state.selectedPlacement.startDate,
          endDate: state.selectedPlacement.endDate,
        });
      } else {
        state.selectedPlacement = null;
      }
    },
    // Clear filter state
    clearPlacementFilter: (state) => {
      state.isFiltered = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch placements
      .addCase(fetchPlacements.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionType = "fetch";
      })
      .addCase(fetchPlacements.fulfilled, (state, action) => {
        state.loading = false;
        state.placements = action.payload;
        state.actionType = null;
        state.isFiltered = false; // Reset filter state when fetching all data
      })
      .addCase(fetchPlacements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.actionType = null;
      })

      // Create placement
      .addCase(createPlacement.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.actionType = "create";
      })
      .addCase(createPlacement.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.actionType = null;
      })
      .addCase(createPlacement.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.actionType = null;
      })

      // Update placement
      .addCase(updatePlacement.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.actionType = "update";
      })
      .addCase(updatePlacement.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.actionType = null;
        state.selectedPlacement = null;
      })
      .addCase(updatePlacement.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.actionType = null;
      })

      // Delete placement
      .addCase(deletePlacement.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.actionType = "delete";
      })
      .addCase(deletePlacement.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.actionType = null;
      })
      .addCase(deletePlacement.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.actionType = null;
      })

      // Handle date range filter
      .addCase(filterPlacementByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.actionType = "fetchDateRange";
      })
      .addCase(filterPlacementByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.placements = action.payload;
        state.success = true;
        state.actionType = null;
        state.isFiltered = true; // Mark as filtered
      })
      .addCase(filterPlacementByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.actionType = null;
        state.isFiltered = false;
      });
  },
});

export const {
  resetPlacementState,
  setSelectedPlacement,
  clearPlacementFilter,
} = placementSlice.actions;

export default placementSlice.reducer;
