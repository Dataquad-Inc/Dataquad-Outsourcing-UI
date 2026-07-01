import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';

const getUserLastLoginTime = (user) => user?.last_login_time || user?.lastLoginTime || null;

const mapUsRequirementToInProgress = (item, recruiter, recruiterById = new Map()) => {
    const employee = recruiterById.get(recruiter?.userId) || recruiterById.get(recruiter?.employeeId);

    return {
        recruiterId: recruiter?.userId || recruiter?.employeeId || item.assignedById,
        recruiterName: recruiter?.userName || recruiter?.employeeName || item.assignedByName,
        jobId: item.jobId,
        clientName: item.clientName,
        bdm: item.assignedByName,
        teamlead: item.assignedByName,
        technology: item.jobTitle,
        postedDate: item.createdAt,
        updatedDateTime: item.updatedAt,
        numberOfSubmissions: Number(item.submissions) || 0,
        numberOfScreenReject: 0,
        jobTitle: item.jobTitle,
        jobMode: item.jobMode,
        jobType: item.jobType,
        experienceRequired: item.experienceRequired,
        relevantExperience: item.relevantExperience,
        last_login_time: getUserLastLoginTime(employee),
    };
};

const mapUsEmptyRecruiterRow = (user) => ({
    recruiterId: user.employeeId,
    recruiterName: user.userName,
    jobId: null,
    clientName: null,
    bdm: null,
    teamlead: null,
    technology: null,
    postedDate: null,
    updatedDateTime: null,
    numberOfSubmissions: 0,
    numberOfScreenReject: 0,
    jobTitle: null,
    jobMode: null,
    jobType: null,
    experienceRequired: null,
    relevantExperience: null,
    last_login_time: getUserLastLoginTime(user),
});

const rowMatchesSearch = (row, search) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return [
        row.recruiterId,
        row.recruiterName,
        row.jobId,
        row.clientName,
        row.bdm,
        row.teamlead,
        row.jobTitle,
        row.jobMode,
        row.jobType,
    ].some((value) => String(value || '').toLowerCase().includes(query));
};

const buildUsInProgressResponse = (requirementsData, recruitersData, page, size, search = '') => {
    const recruiters = Array.isArray(recruitersData) ? recruitersData : recruitersData?.value || [];
    const recruiterById = new Map(
        recruiters
            .filter((user) => user?.employeeId)
            .map((user) => [user.employeeId, user])
    );
    const recruiterRows = [];
    const recruitersWithRequirements = new Set();

    for (const item of requirementsData?.content || []) {
        const assignedRecruiters = Array.isArray(item.assignedUsers) ? item.assignedUsers : [];

        if (assignedRecruiters.length === 0) {
            recruiterRows.push(mapUsRequirementToInProgress(item, null, recruiterById));
            continue;
        }

        assignedRecruiters.forEach((recruiter) => {
            const recruiterId = recruiter?.userId || recruiter?.employeeId;
            if (recruiterId) recruitersWithRequirements.add(recruiterId);
            recruiterRows.push(mapUsRequirementToInProgress(item, recruiter, recruiterById));
        });
    }

    const emptyRecruiterRows = recruiters
        .filter((user) => user?.employeeId && !recruitersWithRequirements.has(user.employeeId))
        .map(mapUsEmptyRecruiterRow);

    const combined = [...recruiterRows, ...emptyRecruiterRows]
        .filter((row) => rowMatchesSearch(row, search))
        .sort((a, b) => String(a.recruiterName || '').localeCompare(String(b.recruiterName || ''), undefined, { sensitivity: 'base' }));

    const start = page * size;
    const pagedContent = combined.slice(start, start + size);

    return {
        content: pagedContent,
        totalElements: combined.length,
        totalPages: Math.ceil(combined.length / size),
        currentPage: page,
        pageSize: size,
    };
};

const formatUsDateParam = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const getYesterdayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

const fetchUsInProgressData = async ({ page, size, search, startDate, endDate }) => {
    const fromDate = formatUsDateParam(startDate);
    const toDate = formatUsDateParam(endDate);

    const [requirementsResponse, recruitersResponse] = await Promise.all([
        httpService.get(
            `/api/us/requirements/v2/get-all-requirements?page=0&size=1000&status=IN%20PROGRESS&fromDate=${fromDate}&toDate=${toDate}`
        ),
        httpService.get('/users/employee?entity=US&roleName=RECRUITER'),
    ]);

    return buildUsInProgressResponse(requirementsResponse.data, recruitersResponse.data, page, size, search);
};

export const fetchInProgressData = createAsyncThunk(
    'inProgress/fetchInProgressDate',
    async ({ page = 0, size = 20, search = '', entity = 'IN' } = {}, { rejectWithValue }) => {
        try {
            const trimmedSearch = search.trim();
            if (entity === 'US') {
                return fetchUsInProgressData({
                    page,
                    size,
                    search: trimmedSearch,
                    startDate: getYesterdayDate(),
                    endDate: new Date(),
                });
            }

            const searchParam = trimmedSearch ? `&search=${encodeURIComponent(trimmedSearch)}` : '';
            const response = await httpService.get(
                `/requirements/inprogress?page=${page}&size=${size}&entity=${encodeURIComponent(entity)}${searchParam}`
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
)

export const filterInProgressDataByDateRange = createAsyncThunk(
    'inProgress/filterInProgressDataByDateRange',
    async ({ startDate, endDate, page = 0, size = 20, search = '', entity = 'IN' }, { rejectWithValue }) => {
        try {
            const trimmedSearch = search.trim();
            if (entity === 'US') {
                return fetchUsInProgressData({
                    page,
                    size,
                    search: trimmedSearch,
                    startDate,
                    endDate,
                });
            }

            const searchParam = trimmedSearch ? `&search=${encodeURIComponent(trimmedSearch)}` : '';
            const response = await httpService.get(`/requirements/inprogress/filterByDate?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}&entity=${encodeURIComponent(entity)}${searchParam}`);
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
            const response = await httpService.post(`/requirements/sendInprogressEmail/${userId}`, data);
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
        isFiltered: false,
        searchQuery: '',
        pagination: {
            currentPage: 0,
            rowsPerPage: 20,
            totalCount: 0,
            activeDateRange: { startDate: null, endDate: null },
        }
    },
    reducers: {
        clearFilterData: (state) => {
            state.filterinProgressByDateRange = [];
            state.isFiltered = false;
            state.loading = false;
            state.pagination.activeDateRange = { startDate: null, endDate: null };
        },
        clearEmailStatus: (state) => {
            state.emailStatus = null;
        },
        setPage: (state, action) => {
            state.pagination.currentPage = action.payload;
        },
        setRowsPerPage: (state, action) => {
            state.pagination.rowsPerPage = action.payload;
            state.pagination.currentPage = 0;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setActiveDateRange: (state, action) => {
            state.pagination.activeDateRange = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetch inProgress data
            .addCase(fetchInProgressData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchInProgressData.fulfilled, (state, action) => {
                state.loading = false;

                const unique = [];
                const seen = new Set();

                for (const item of action?.payload?.content) {
                    const key = JSON.stringify(item);
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(item);
                    }
                }

                state.inProgress = unique;
                state.pagination.totalCount = action.payload.totalElements ?? unique.length;
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
                state.filterinProgressByDateRange = action.payload.content;
                state.isFiltered = true;
                state.pagination.totalCount = action.payload.totalElements;
                state.pagination.activeDateRange = {
                    startDate: action.meta.arg.startDate,
                    endDate: action.meta.arg.endDate,
                };
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

export const { clearFilterData, clearEmailStatus, setPage, setRowsPerPage, setSearchQuery, setActiveDateRange } = InProgressSlice.actions;

export default InProgressSlice.reducer;
