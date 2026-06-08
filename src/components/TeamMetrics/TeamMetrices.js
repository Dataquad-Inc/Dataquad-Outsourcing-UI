import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Tab, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserTable from './UserTable';
import TeamList from './TeamList';
import DateRangeFilter from '../muiComponents/DateRangeFilter';
import { 
    fetchBdmUsers,
    fetchTeamLeadUsers, 
    fetchEmployeeUsers,
    fetchCoordinators,
    filterTeamMetricsByDateRange,
    selectFilteredBdms,
    selectFilteredTeamLeads,
    selectFilteredEmployees,
    selectIsLoading
} from '../../redux/teamMetricsSlice';

const TeamMetrics = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [activeTab, setActiveTab] = useState(0);
    
    const filteredBdmUsers = useSelector(selectFilteredBdms);
    const filteredTeamLeadUsers = useSelector(selectFilteredTeamLeads);
    const filteredEmployeeUsers = useSelector(selectFilteredEmployees);
    const coordinators = useSelector((state) => state.teamMetrics.coordinators || []);
    const isLoading = useSelector(selectIsLoading);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tabFromUrl = searchParams.get('activeTab');

    const tabsConfig = useMemo(() => [
        { role: 'BDM',         title: 'BDM Users',         key: 'bdm',         hasNavigation: true  },
        { role: 'TEAMLEAD',    title: 'Team Lead Users',   key: 'teamlead',    hasNavigation: true  },
        { role: 'EMPLOYEE',    title: 'Employee Users',    key: 'employee',    hasNavigation: true  },
        { role: 'COORDINATOR', title: 'Coordinators',      key: 'coordinator', hasNavigation: false },
        { role: 'TEAMS',       title: 'Teams',             key: 'teams',       hasNavigation: true  },
    ], []);

    // Set initial tab from URL
    useEffect(() => {
        if (tabFromUrl) {
            const newTabIndex = tabsConfig.findIndex(tab => tab.key === tabFromUrl);
            if (newTabIndex !== -1) {
                setActiveTab(newTabIndex);
            }
        }
    }, [tabFromUrl, tabsConfig]);

    // Navigation handlers
    const navigationHandlers = useMemo(() => ({
        BDM: (employeeId) => {
            const params = new URLSearchParams(searchParams);
            navigate(`/dashboard/team-metrics/bdmstatus/${employeeId}?${params.toString()}`);
        },
        TEAMLEAD: (employeeId) => {
            const params = new URLSearchParams(searchParams);
            params.set('source', 'teamlead');
            navigate(`/dashboard/team-metrics/employeestatus/${employeeId}?${params.toString()}`);
        },
        EMPLOYEE: (employeeId) => {
            const params = new URLSearchParams(searchParams);
            params.set('source', 'employee');
            navigate(`/dashboard/team-metrics/employeestatus/${employeeId}?${params.toString()}`);
        },
        TEAMS: (teamId) => {
            const params = new URLSearchParams(searchParams);
            navigate(`/dashboard/team-metrics/teamstatus/${teamId}?${params.toString()}`);
        },
    }), [navigate, searchParams]);

    const getNavigationHandler = useCallback(() => {
        const currentTabConfig = tabsConfig[activeTab];
        return currentTabConfig.hasNavigation
            ? navigationHandlers[currentTabConfig.role]
            : undefined;
    }, [activeTab, navigationHandlers, tabsConfig]);

    // Data fetching — Teams tab fetches nothing from Redux (handled inside TeamList)
    const fetchDataForActiveTab = useCallback(async () => {
        const currentRole = tabsConfig[activeTab].role;
        if (currentRole === 'TEAMS') return;

        try {
            if (startDate && endDate) {
                await dispatch(filterTeamMetricsByDateRange({ startDate, endDate })).unwrap();
            } else {
                switch (currentRole) {
                    case 'BDM':
                        await dispatch(fetchBdmUsers()).unwrap();
                        break;
                    case 'TEAMLEAD':
                        await dispatch(fetchTeamLeadUsers()).unwrap();
                        break;
                    case 'EMPLOYEE':
                        await dispatch(fetchEmployeeUsers()).unwrap();
                        break;
                    case 'COORDINATOR':
                        await dispatch(fetchCoordinators()).unwrap();
                        break;
                    default:
                        console.warn(`Unknown role: ${currentRole}`);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [activeTab, dispatch, startDate, endDate, tabsConfig]);

    useEffect(() => {
        fetchDataForActiveTab();
    }, [fetchDataForActiveTab]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        const tabKey = tabsConfig[newValue].key;
        const params = new URLSearchParams(searchParams);
        params.set('activeTab', tabKey);
        navigate(`/dashboard/team-metrics?${params.toString()}`, { replace: true });
    };

    const handleRefresh = useCallback(() => {
        fetchDataForActiveTab();
    }, [fetchDataForActiveTab]);

    const getCurrentRoleData = useCallback(() => {
        const currentRole = tabsConfig[activeTab].role;
        switch (currentRole) {
            case 'BDM':         return filteredBdmUsers;
            case 'TEAMLEAD':    return filteredTeamLeadUsers;
            case 'EMPLOYEE':    return filteredEmployeeUsers;
            case 'COORDINATOR': return coordinators;
            default:            return [];
        }
    }, [activeTab, filteredBdmUsers, filteredTeamLeadUsers, filteredEmployeeUsers, coordinators, tabsConfig]);

    const renderTabContent = () => {
        const currentTabConfig = tabsConfig[activeTab];

        // Teams tab renders its own component with its own data fetching and navigation
        if (currentTabConfig.role === 'TEAMS') {
            return (
                <TeamList
                    startDate={startDate}
                    endDate={endDate}
                />
            );
        }

        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            );
        }

        return (
            <UserTable
                role={currentTabConfig.role}
                title={currentTabConfig.title}
                employeesList={getCurrentRoleData()}
                loading={isLoading}
                onEmployeeClick={currentTabConfig.hasNavigation ? getNavigationHandler() : undefined}
            />
        );
    };

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                    flexWrap: 'wrap',
                    mb: 3,
                    justifyContent: 'space-between',
                    p: 2,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 2,
                    boxShadow: 1,
                }}
            >
                <Typography variant="h6" color="primary">Team Metrics</Typography>
                <DateRangeFilter
                    component="TeamMetrics"
                    onDateChange={handleRefresh}
                />
            </Stack>

            <Box sx={{ width: '100%', height: '100vh', mt: -1.5 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="team metrics tabs"
                    sx={{
                        borderBottom: '2px solid #e0e0e0',
                        px: 2,
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px 8px 0 0',
                    }}
                    TabIndicatorProps={{
                        style: {
                            backgroundColor: '#2A4DBD',
                            height: 4,
                            borderRadius: 4,
                        },
                    }}
                >
                    {tabsConfig.map((tab, index) => (
                        <Tab
                            key={tab.key}
                            label={tab.title}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: 15,
                                color: activeTab === index ? '#2A4DBD' : '#555',
                                mx: 1,
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                backgroundColor: activeTab === index ? '#e6ecfc' : 'transparent',
                                transition: 'all 0.3s ease',
                                '&:hover': { backgroundColor: '#f0f4ff' },
                            }}
                        />
                    ))}
                </Tabs>

                <Box sx={{ mt: 2, px: 2 }}>
                    {renderTabContent()}
                </Box>
            </Box>
        </>
    );
};

export default TeamMetrics;