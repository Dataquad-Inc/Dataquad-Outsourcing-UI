import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchInProgressData, 
    clearFilterData, 
    resetInProgressState,
    sendingUsersData, 
    setPage, 
    setRowsPerPage, 
    setSearchQuery, 
    setActiveDateRange, 
    filterInProgressDataByDateRange 
} from '../../redux/inProgressSlice';
import DataTablePaginated from '../muiComponents/DataTablePaginated';
import DateRangeFilter from '../muiComponents/DateRangeFilter';
import { Stack, Typography, Alert, Snackbar, Link, Chip, Tooltip, Box } from '@mui/material';
import { formatDateTime } from '../../utils/dateformate';
import { useNavigate } from 'react-router-dom';

const InProgress = ({
    entity = 'IN',
    detailsBasePath = '/dashboard/requirements/job-details',
    fromPath = '/dashboard/InProgress',
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { 
        inProgress = [], 
        loading, 
        filterinProgressByDateRange,
        isFiltered,
        searchQuery,
        pagination,
    } = useSelector((state) => state.inProgress);

    const { currentPage, rowsPerPage, totalCount, activeDateRange } = pagination;
    const { userName, userId } = useSelector((state) => state.auth);
    
    const [sortConfig, setSortConfig] = useState({
        key: 'bdm',
        direction: 'asc'
    });

    const [emailStatus, setEmailStatus] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // State to trigger DateRangeFilter reset
    const [resetFilterTrigger, setResetFilterTrigger] = useState(false);

    // Use refs to prevent multiple API calls
    const isInitialMount = useRef(true);
    const isFilteringRef = useRef(false);
    const isFetchingRef = useRef(false);
    const prevParamsRef = useRef({});
    const prevEntityRef = useRef(entity);
    const isEntityChangeRef = useRef(false);
    const isResetInProgressRef = useRef(false);

    // Memoize the fetch function
    const fetchData = useCallback((params) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        
        dispatch(fetchInProgressData(params)).finally(() => {
            setTimeout(() => {
                isFetchingRef.current = false;
            }, 100);
        });
    }, [dispatch]);

    // Memoize the filter function
    const filterData = useCallback((params) => {
        if (isFilteringRef.current) return;
        isFilteringRef.current = true;
        
        dispatch(filterInProgressDataByDateRange(params)).finally(() => {
            setTimeout(() => {
                isFilteringRef.current = false;
            }, 100);
        });
    }, [dispatch]);

    // Reset filter when entity changes
    useEffect(() => {
        // Check if entity has changed
        if (prevEntityRef.current !== entity) {
            prevEntityRef.current = entity;
            isEntityChangeRef.current = true;
            isResetInProgressRef.current = true;
            
            // Reset entire state
            dispatch(resetInProgressState());
            
            // Trigger DateRangeFilter reset
            setResetFilterTrigger(true);
            
            // Reset refs
            isFilteringRef.current = false;
            isFetchingRef.current = false;
            prevParamsRef.current = {};
            
            // Fetch fresh data for new entity
            fetchData({
                page: 0,
                size: rowsPerPage,
                search: '',
                entity
            });

            // Reset the trigger after a short delay
            setTimeout(() => {
                setResetFilterTrigger(false);
                isEntityChangeRef.current = false;
                isResetInProgressRef.current = false;
            }, 200);
        }
    }, [entity, dispatch, rowsPerPage, fetchData]);

    // Initial data fetch
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            isResetInProgressRef.current = true;
            
            // Reset state on initial mount
            dispatch(resetInProgressState());
            
            // Fetch initial data
            fetchData({
                page: 0,
                size: rowsPerPage,
                search: '',
                entity
            });

            setTimeout(() => {
                isResetInProgressRef.current = false;
            }, 200);
        }
    }, []); // Empty dependency array for initial mount only

    // Handle pagination and search changes
    useEffect(() => {
        // Skip initial mount and entity change
        if (isInitialMount.current || isEntityChangeRef.current || isResetInProgressRef.current) return;
        
        // Create params object to compare
        const params = {
            page: currentPage,
            size: rowsPerPage,
            search: searchQuery,
            entity
        };

        // Check if params actually changed
        const paramsKey = JSON.stringify(params);
        const prevKey = prevParamsRef.current.paramsKey;
        
        if (paramsKey === prevKey) return;
        
        prevParamsRef.current = { paramsKey };

        // If filtered, use filter API
        if (isFiltered && activeDateRange?.startDate && activeDateRange?.endDate) {
            filterData({
                startDate: activeDateRange.startDate,
                endDate: activeDateRange.endDate,
                page: currentPage,
                size: rowsPerPage,
                search: searchQuery,
                entity
            });
        } else if (!isFiltered) {
            // Otherwise fetch regular data
            fetchData(params);
        }
    }, [currentPage, rowsPerPage, searchQuery, entity, isFiltered, activeDateRange, fetchData, filterData]);

    // Handle filter changes separately
    useEffect(() => {
        if (isInitialMount.current || isEntityChangeRef.current || isResetInProgressRef.current) return;
        if (!isFiltered) return;
        if (!activeDateRange?.startDate || !activeDateRange?.endDate) return;

        // Create filter params
        const filterParams = {
            startDate: activeDateRange.startDate,
            endDate: activeDateRange.endDate,
            page: currentPage,
            size: rowsPerPage,
            search: searchQuery,
            entity
        };

        // Check if filter params actually changed
        const paramsKey = JSON.stringify(filterParams);
        const prevKey = prevParamsRef.current.filterKey;
        
        if (paramsKey === prevKey) return;
        
        prevParamsRef.current.filterKey = paramsKey;

        filterData(filterParams);
    }, [isFiltered, activeDateRange, currentPage, rowsPerPage, searchQuery, entity, filterData]);

    // Enhanced sorting function
    const customSort = useCallback((a, b, key) => {
        const valA = a[key];
        const valB = b[key];

        const isNullA = valA === null || valA === undefined;
        const isNullB = valB === null || valB === undefined;

        if (isNullA && !isNullB) return 1;
        if (!isNullA && isNullB) return -1;
        if (isNullA && isNullB) return 0;

        const stringA = valA.toString().trim().toLowerCase();
        const stringB = valB.toString().trim().toLowerCase();

        const isNameField = ['bdm', 'teamlead', 'recruiterName'].includes(key);

        if (isNameField) {
            const split = (name) => name.split(/(?=[A-Z])|\s+/).filter(Boolean);
            const partsA = split(stringA);
            const partsB = split(stringB);
            for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
                const cmp = partsA[i].localeCompare(partsB[i], undefined, { sensitivity: 'base' });
                if (cmp !== 0) return cmp;
            }
            return partsA.length - partsB.length;
        }

        return stringA.localeCompare(stringB, undefined, { sensitivity: 'base' });
    }, []);

    // Apply filtering and sorting to the data
    const processedData = useMemo(() => {
        const data = isFiltered ? filterinProgressByDateRange : inProgress;
        
        // Ensure data is an array
        if (!data || !Array.isArray(data)) {
            return [];
        }

        const unique = [];
        const seen = new Set();

        for (const item of data) {
            const key = JSON.stringify(item);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }

        // Apply sorting here
        const sortedData = [...unique].sort((a, b) => {
            const result = customSort(a, b, sortConfig.key);
            return sortConfig.direction === 'asc' ? result : -result;
        });

        return sortedData;
    }, [inProgress, filterinProgressByDateRange, isFiltered, sortConfig, customSort]);

    // Filter data by current user's userId matching with recruiterId
    const getUserFilteredData = useCallback(() => {
        if (!Array.isArray(processedData)) return [];
        return processedData.filter(item => {
            return item.recruiterId === userId || item.recruiterName === userName;
        });
    }, [processedData, userId, userName]);

    // Handle send email functionality
    const handleSendEmail = async () => {
        try {
            const userFilteredData = getUserFilteredData();
            
            if (userFilteredData.length === 0) {
                setEmailStatus({
                    open: true,
                    message: 'No data found for current user to send email.',
                    severity: 'warning'
                });
                return;
            }

            await dispatch(sendingUsersData({ 
                userId: userId,
                data: userFilteredData
            })).unwrap();

            setEmailStatus({
                open: true,
                message: `Email sent successfully! ${userFilteredData.length} records processed.`,
                severity: 'success'
            });

        } catch (error) {
            console.error('Error sending email:', error);
            setEmailStatus({
                open: true,
                message: 'Failed to send email. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleJobIdClick = useCallback((jobId) => {
        navigate(`${detailsBasePath}/${jobId}`, {
            state: { from: fromPath }
        });
    }, [navigate, detailsBasePath, fromPath]);

    // Check if last login is today
    const isLoggedInToday = useCallback((lastLoginTime) => {
        if (!lastLoginTime) return false;
        
        try {
            const lastLogin = new Date(lastLoginTime);
            const today = new Date();
            
            return (
                lastLogin.getFullYear() === today.getFullYear() &&
                lastLogin.getMonth() === today.getMonth() &&
                lastLogin.getDate() === today.getDate()
            );
        } catch (error) {
            console.error('Error checking login date:', error);
            return false;
        }
    }, []);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    }, []);

    const handleChangePage = useCallback((newPage) => {
        dispatch(setPage(newPage));
    }, [dispatch]);

    const handleChangeRowsPerPage = useCallback((newRowsPerPage) => {
        dispatch(setRowsPerPage(newRowsPerPage));
    }, [dispatch]);

    const handleSearchChange = useCallback((value) => {
        dispatch(setPage(0));
        dispatch(setSearchQuery(value));
    }, [dispatch]);

    const handleDateChange = useCallback((startDate, endDate) => {
        // Skip if this is a reset action during entity change
        if (isResetInProgressRef.current) return;
        
        if (!startDate || !endDate) {
            // Clear filter and reset to normal data
            dispatch(clearFilterData());
            dispatch(setPage(0));
            // Fetch normal data after clearing filter
            fetchData({
                page: 0,
                size: rowsPerPage,
                search: searchQuery,
                entity
            });
            return;
        }

        // Set page to 0 when applying date filter
        dispatch(setPage(0));
        dispatch(setActiveDateRange({ startDate, endDate }));
        
        // Apply date filter with page 0
        filterData({
            startDate,
            endDate,
            page: 0,
            size: rowsPerPage,
            search: searchQuery,
            entity,
        });
    }, [dispatch, rowsPerPage, searchQuery, entity, fetchData, filterData]);

    const columns = useMemo(() => [
        {
            key: "recruiterName",
            label: "Recruiter",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120,
            isSorted: sortConfig.key === 'recruiterName',
            isSortedDesc: sortConfig.key === 'recruiterName' && sortConfig.direction === 'desc',
            onSort: () => handleSort('recruiterName')
        },
        {
            key: "last_login_time",
            label: "Is Logged In",
            type: "text",
            render: (row) => {
                const loggedIn = isLoggedInToday(row.last_login_time);
                return (
                    <Chip
                        label={loggedIn ? "Logged In" : "Leave"}
                        color={loggedIn ? "success" : "error"}
                        variant="filled"
                        size="small"
                    />
                );
            },
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            key: "teamlead",
            label: "Team Lead",
            type: "text",
            render: (row) => {
                const teamlead = row.teamlead || '';
                return (
                    <Tooltip title={teamlead} arrow disableHoverListener={!teamlead}>
                        <Box
                            component="span"
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                                lineHeight: 1.35,
                                maxWidth: 220,
                            }}
                        >
                            {teamlead || '-'}
                        </Box>
                    </Tooltip>
                );
            },
            sortable: true,
            filterable: true,
            width: 220,
            isSorted: sortConfig.key === 'teamlead',
            isSortedDesc: sortConfig.key === 'teamlead' && sortConfig.direction === 'desc',
            onSort: () => handleSort('teamlead')
        },
        {
            key: "bdm",
            label: entity === 'US' ? "Sales Executive" : "BDM",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120,
            isSorted: sortConfig.key === 'bdm',
            isSortedDesc: sortConfig.key === 'bdm' && sortConfig.direction === 'desc',
            onSort: () => handleSort('bdm')
        },
        {
            key: "jobId",
            label: "JOB ID",
            type: "text",
            render: (row) => (
                <Link
                    component="button"
                    variant="body2"
                    onClick={() => handleJobIdClick(row.jobId)}
                    sx={{
                        textDecoration: "none",
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                    }}
                >
                    {row.jobId}
                </Link>
            ),
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            key: "jobTitle",
            label: "Job Title",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            key: "jobMode",
            label: "Job Mode",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            key: "jobType",
            label: "Job Type",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            key: "experienceRequired",
            label: "Required Exp",
            type: "text",
            sortable: true,
            filterable: true,
            align: 'center',
            width: 50
        },
        {
            key: "relevantExperience",
            label: "Relevant Exp",
            type: "text",
            render: (row) => row.relevantExperience || '-',
            sortable: true,
            filterable: true,
            align: 'center',
            width: 50
        },
        {
            key: "clientName",
            label: "Client",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            key: "technology",
            label: "Technologies",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120 
        },
        {
            key: "updatedDateTime",
            label: "Posted Date",
            type: "text",
            render: (row) => formatDateTime(row.updatedDateTime),
            sortable: true,
            filterable: true,
            width: 120,
        },
        {
            key: "numberOfSubmissions",
            label: "Submissions",
            type: "text",
            sortable: true,
            filterable: true,
            width: 120,
        }
    ], [sortConfig, entity, handleSort, handleJobIdClick, isLoggedInToday]);

    const handleRefresh = useCallback(() => {
        dispatch(clearFilterData());
        dispatch(setPage(0));
        dispatch(setSearchQuery(''));
        
        // Reset refs
        isFilteringRef.current = false;
        isFetchingRef.current = false;
        prevParamsRef.current = {};
        
        // Fetch fresh data
        fetchData({
            page: 0,
            size: rowsPerPage,
            search: '',
            entity
        });
    }, [dispatch, rowsPerPage, entity, fetchData]);

    const handleCloseSnackbar = useCallback(() => {
        setEmailStatus((prev) => ({ ...prev, open: false }));
    }, []);

    return (
        <>
            <Stack direction="row" alignItems="center" spacing={2}
                sx={{
                    flexWrap: 'wrap',
                    mb: 3,
                    justifyContent: 'space-between',
                    p: 2,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 2,
                    boxShadow: 1,
                }}>

                <Typography variant='h6' color='primary'>In-Progress Management</Typography>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 'auto' }}>
                    <DateRangeFilter 
                        component="InProgress" 
                        onDateChange={handleDateChange} 
                        onClearFilter={handleRefresh}
                        resetFilter={resetFilterTrigger}
                    />
                </Stack>
            </Stack>

            <DataTablePaginated
                data={processedData || []}
                columns={columns}
                title="In Progress"
                loading={loading}
                enableSelection={false}
                defaultSortColumn="bdm"
                defaultSortDirection="asc"
                defaultRowsPerPage={rowsPerPage}
                primaryColor="#00796b"
                secondaryColor="#e0f2f1"
                customStyles={{
                    headerBackground: "#1976d2",
                    rowHover: "#e0f2f1",
                    selectedRow: "#b2dfdb",
                }}
                uniqueId={(row) => `${row.jobId}-${row.recruiterName}-${row.teamlead}`}
                refreshData={handleRefresh}
                orderBy={sortConfig.key}
                order={sortConfig.direction}
                enableSendEmail={true}
                onSendEmail={handleSendEmail}
                userFilteredDataCount={getUserFilteredData().length}
                serverSide={true}
                page={currentPage}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                onSearchChange={handleSearchChange}
                searchValue={searchQuery}
            />

            <Snackbar
                open={emailStatus.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={emailStatus.severity}
                    sx={{ width: '100%' }}
                >
                    {emailStatus.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default InProgress;