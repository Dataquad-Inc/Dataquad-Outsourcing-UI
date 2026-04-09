import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';

export const fetchInProgressData = createAsyncThunk(
    'inProgress/fetchInProgressDate',
    async (_, { rejectWithValue }) => {
        try {
            const response = await httpService.get("/requirements/inprogress");
            return response.data
        }
        catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const filterInProgressDataByDateRange = createAsyncThunk(
    'inProgress/filterInProgressDataByDateRange',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const response = await httpService.get(`/requirements/inprogress/filterByDate?startDate=${startDate}&endDate=${endDate}`);
            return response.data
        }
        catch (error) {
            return rejectWithValue(error)
        }
    }
)

// Enhanced sendingUsersData to accept both userId and filtered data
export const sendingUsersData = createAsyncThunk(
    'inProgress/sendUsersData',
    async ({ userId, data }, { rejectWithValue }) => {
        try {
            // Send both userId and the filtered data in the request body
            const response = await httpService.post(`/requirements/sendInprogressEmail/${userId}`,data);
            return response.data
        }
        catch (error) {
            return rejectWithValue(error);
        }
    }
)

const InProgressSlice = createSlice({
    name: 'inProgress',
    initialState: {
        inProgress: [],
        filterinProgressByDateRange: [],
        sendUsersData: [],
        emailStatus: null, // Add email status tracking
        error: null,
        loading: false,
        emailLoading: false, // Separate loading state for email
        isFiltered: false
    },
    reducers: {
        clearFilterData: (state) => {
            state.filterinProgressByDateRange = [];
            state.isFiltered = false;
            state.loading = false;
        },
        clearEmailStatus: (state) => {
            state.emailStatus = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // fetch inProgress data
            .addCase(fetchInProgressData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchInProgressData.fulfilled, (state, action) => {
                state.loading = false;

                // Remove exact duplicates (based on deep equality)
                const unique = [];
                const seen = new Set();

                for (const item of action.payload) {
                    const key = JSON.stringify(item);
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(item);
                    }
                }

                state.inProgress = unique;
            })
            .addCase(fetchInProgressData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // filter inProgress data by date range
            .addCase(filterInProgressDataByDateRange.pending, (state) => {
                state.loading = true;
            })
            .addCase(filterInProgressDataByDateRange.fulfilled, (state, action) => {
                state.loading = false;
                state.filterinProgressByDateRange = action.payload;
                state.isFiltered = true;
            })
            .addCase(filterInProgressDataByDateRange.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // send users data - enhanced
            .addCase(sendingUsersData.pending, (state) => {
                state.emailLoading = true;
                state.emailStatus = null;
            })
            .addCase(sendingUsersData.fulfilled, (state, action) => {
                state.sendUsersData = action.payload;
                state.emailLoading = false;
                state.emailStatus = {
                    success: true,
                    message: 'Email sent successfully'
                };
            })
            .addCase(sendingUsersData.rejected, (state, action) => {
                state.emailLoading = false;
                state.emailStatus = {
                    success: false,
                    message: action.payload?.message || 'Failed to send email'
                };
                state.error = action.payload;
            })
    }
});

export const { clearFilterData, clearEmailStatus } = InProgressSlice.actions;

export default InProgressSlice.reducer;