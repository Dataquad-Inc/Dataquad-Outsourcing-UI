import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';

const initialState = {
    bdmUsers: [],
    teamLeadUsers: [],
    employeeUsers: [],
    coordinators:[],
    filteredBdmUsers: [],
    filteredTeamLeadUsers: [],
    filteredEmployeeUsers: [],
    filteredCoordinators:[],
    employeeDetails: null,
    isLoading: false,
    error: null,
    isFiltered: false
};

export const fetchEmployeeDetails = createAsyncThunk(
    'teamMetrics/fetchEmployeeDetails',
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await httpService.get(
                `/requirements/bdm/details/${employeeId}`
            );
            return { employeeDetails: response.data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const filterTeamMetricsByDateRange = createAsyncThunk(
    'teamMetrics/filterByDateRange',
    async ({ startDate, endDate, employeeId }, { rejectWithValue }) => {
        try {
            if (employeeId) {
                const response = await httpService.get(
                    `/requirements/bdm/details/${employeeId}/filterByDate?startDate=${startDate}&endDate=${endDate}`
                );
                return { employeeDetails: response.data };
            } else {
                const [bdmResponse, statsResponse] = await Promise.all([
                    httpService.get(`/users/bdmlist/filterByDate?startDate=${startDate}&endDate=${endDate}`),
                    httpService.get(`/requirements/stats/filterByDate?startDate=${startDate}&endDate=${endDate}`)
                ]);
                
                return {
                    bdmUsers: bdmResponse.data || [],
                    teamLeadUsers: statsResponse.data?.userStats?.filter(
                        user => user.role && user.role.toUpperCase() === 'TEAMLEAD'
                    ) || [],
                    employeeUsers: statsResponse.data?.userStats?.filter(
                        user => user.role && user.role.toUpperCase() === 'EMPLOYEE'
                    ) || []
                };
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchBdmUsers = createAsyncThunk(
    'teamMetrics/fetchBdmUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await httpService.get('/requirements/bdmlist');
            return { bdmUsers: response.data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTeamLeadUsers = createAsyncThunk(
    'teamMetrics/fetchTeamLeadUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await httpService.get('/requirements/stats');
            const teamLeadUsers = response.data.userStats ? 
                response.data.userStats.filter(user => user.role && user.role.toUpperCase() === 'TEAMLEAD') : 
                [];
            return { teamLeadUsers };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchEmployeeUsers = createAsyncThunk(
    'teamMetrics/fetchEmployeeUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await httpService.get('/requirements/stats');
            const employeeUsers = response.data.userStats ? 
                response.data.userStats.filter(user => user.role && user.role.toUpperCase() === 'EMPLOYEE') : 
                [];
            return { employeeUsers };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


export const fetchCoordinators = createAsyncThunk(
    'teamMetrics/fetchCoordinators',
    async (_, { rejectWithValue }) => {
        try {
            const response = await httpService.get('/requirements/coordinatorstats');
            // const coordinators = response.data? 
            //     response.data.filter(user => user.role && user.role.toUpperCase() === 'COORDINATOR') : 
            //     [];
              const coordinators=response.data
                console.log("coordinators",response.data)
            return {coordinators};
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const teamMetricsSlice = createSlice({
    name: 'teamMetrics',
    initialState,
    reducers: {
        clearEmployeeDetails: (state) => {
            state.employeeDetails = null;
        },
        clearFilters: (state) => {
            state.filteredBdmUsers = state.bdmUsers;
            state.filteredTeamLeadUsers = state.teamLeadUsers;
            state.filteredEmployeeUsers = state.employeeUsers;
            state.filteredCoordinators = state.coordinators;
            state.isFiltered = false;
            state.employeeDetails = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Employee Details
            .addCase(fetchEmployeeDetails.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchEmployeeDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.employeeDetails = action.payload.employeeDetails;
            })
            .addCase(fetchEmployeeDetails.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            
            // Filter by Date Range
            .addCase(filterTeamMetricsByDateRange.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(filterTeamMetricsByDateRange.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.employeeDetails) {
                    state.employeeDetails = action.payload.employeeDetails;
                } else {
                    state.filteredBdmUsers = action.payload.bdmUsers;
                    state.filteredTeamLeadUsers = action.payload.teamLeadUsers;
                    state.filteredEmployeeUsers = action.payload.employeeUsers;
                    state.isFiltered = true;
                }
            })
            .addCase(filterTeamMetricsByDateRange.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            
            // Fetch BDM Users
            .addCase(fetchBdmUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBdmUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.bdmUsers = action.payload.bdmUsers;
                if (!state.isFiltered) {
                    state.filteredBdmUsers = action.payload.bdmUsers;
                }
            })
            .addCase(fetchBdmUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            
            // Fetch Team Lead Users
            .addCase(fetchTeamLeadUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTeamLeadUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teamLeadUsers = action.payload.teamLeadUsers;
                if (!state.isFiltered) {
                    state.filteredTeamLeadUsers = action.payload.teamLeadUsers;
                }
            })
            .addCase(fetchTeamLeadUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            
            // Fetch Employee Users
            .addCase(fetchEmployeeUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchEmployeeUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.employeeUsers = action.payload.employeeUsers;
                if (!state.isFiltered) {
                    state.filteredEmployeeUsers = action.payload.employeeUsers;
                }
            })
            .addCase(fetchEmployeeUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

             //Fetch Coordinators
             .addCase(fetchCoordinators.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCoordinators.fulfilled, (state, action) => {
                state.isLoading = false;
                state.coordinators = action.payload.coordinators;
                if (!state.isFiltered) {
                    state.filteredCoordinators = action.payload.coordinators;
                }
            })
            .addCase(fetchCoordinators.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const {
    clearEmployeeDetails,
    clearFilters
} = teamMetricsSlice.actions;

export const selectEmployeeDetails = (state) => state.teamMetrics.employeeDetails;
export const selectFilteredEmployees = (state) => state.teamMetrics.filteredEmployeeUsers;
export const selectFilteredTeamLeads = (state) => state.teamMetrics.filteredTeamLeadUsers;
export const selectFilteredBdms = (state) => state.teamMetrics.filteredBdmUsers;
export const selectFilteredCoordinators = (state) => state.teamMetrics.filteredCoordinators;
export const selectIsLoading = (state) => state.teamMetrics.isLoading;

export default teamMetricsSlice.reducer;