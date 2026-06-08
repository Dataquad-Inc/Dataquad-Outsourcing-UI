import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Card, CardContent, Typography, Grid, Divider,
    Chip, Button, Tabs, Tab, Paper, Avatar, Alert, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { People, Group, Business, ManageAccounts, SupportAgent } from '@mui/icons-material';
import DataTable from '../muiComponents/DataTabel';
import httpService from '../../Services/httpService';

// Role configuration
const ROLE_CONFIG = {
    TEAMLEAD: { label: 'Team Lead', color: 'success', icon: ManageAccounts },
    BDM: { label: 'BDM', color: 'primary', icon: Business },
    EMPLOYEE: { label: 'Employee', color: 'info', icon: People },
    COORDINATOR: { label: 'Coordinator', color: 'warning', icon: SupportAgent },
};

const getMemberColumns = (roleType) => {
    const baseColumns = [
        {
            key: 'userId',
            label: 'Employee ID',
            type: 'text',
            sortable: true,
            filterable: true,
            width: 150,
            render: (row) => (
                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                    {row.userId}
                </Typography>
            ),
        },
        {
            key: 'userName',
            label: 'Name',
            type: 'text',
            sortable: true,
            filterable: true,
            width: 200,
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: '#1976d2' }}>
                        {row.userName?.trim()?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    {row.userName || 'N/A'}
                </Box>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text',
            sortable: true,
            filterable: true,
            width: 250,
            render: (row) => row.email || 'N/A',
        },
    ];

    const statisticsColumns = [
        {
            key: 'numberOfClients',
            label: 'Clients',
            type: 'number',
            sortable: true,
            filterable: true,
            width: 100,
            render: (row) => <Chip label={row.numberOfClients || 0} size="small" variant="outlined" />,
        },
        {
            key: 'numberOfRequirements',
            label: 'Requirements',
            type: 'number',
            sortable: true,
            filterable: true,
            width: 120,
            render: (row) => <Chip label={row.numberOfRequirements || 0} size="small" variant="outlined" color="primary" />,
        },
        {
            key: 'numberOfSubmissions',
            label: 'Submissions',
            type: 'number',
            sortable: true,
            filterable: true,
            width: 120,
            render: (row) => <Chip label={row.numberOfSubmissions || 0} size="small" variant="outlined" color="info" />,
        },
        {
            key: 'numberOfScreenRejects',
            label: 'Screen Reject',
            type: 'number',
            sortable: true,
            filterable: true,
            width: 120,
            render: (row) => <Chip label={row.numberOfScreenRejects || 0} size="small" variant="outlined" color="error" />,
        },
        {
            key: 'numberOfInterviews',
            label: 'Interviews',
            type: 'number',
            sortable: true,
            filterable: true,
            width: 110,
            render: (row) => (
                <Chip
                    label={row.numberOfInterviews || 0}
                    size="small"
                    sx={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}
                />
            ),
        },
        {
            key: 'numberOfPlacements',
            label: 'Placements',
            type: 'number',
            sortable: true,
            filterable: true,
            width: 110,
            render: (row) => (
                <Chip
                    label={row.numberOfPlacements || 0}
                    size="small"
                    sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                />
            ),
        },
    ];

    return [...baseColumns, ...statisticsColumns];
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: bg, mr: 1.5, display: 'flex' }}>
                    <Icon sx={{ color, fontSize: 22 }} />
                </Box>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
        </CardContent>
    </Card>
);

const TeamStatus = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);

    // ── NEW: stats fetched from /users/team-dashboard/:teamId ──────────────
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState(null);

    useEffect(() => {
        if (!teamId) return;
        const fetchDashboard = async () => {
            try {
                setDashboardLoading(true);
                setDashboardError(null);
                const response = await httpService.get(`/users/team-dashboard/${teamId}`);
                setDashboardData(response.data);
            } catch (err) {
                console.error('Error fetching team dashboard:', err);
                setDashboardError('Failed to load team statistics.');
            } finally {
                setDashboardLoading(false);
            }
        };
        fetchDashboard();
    }, [teamId]);
    // ───────────────────────────────────────────────────────────────────────

    // Fallback: basic team info still comes from location state (for header/name display)
    const teamData = location.state?.teamData;

    const handleBackClick = () => {
        navigate('/dashboard/team-metrics?activeTab=teams');
    };

    if (dashboardLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (dashboardError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{dashboardError}</Alert>
                <Button variant="contained" onClick={handleBackClick} startIcon={<ArrowBackIcon />}>
                    Back to Teams
                </Button>
            </Box>
        );
    }

    if (!dashboardData) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>No data available for this team.</Alert>
                <Button variant="contained" onClick={handleBackClick} startIcon={<ArrowBackIcon />}>
                    Back to Teams
                </Button>
            </Box>
        );
    }

    // ── Build member arrays from dashboardData (has full stats) ────────────
    const teamLeadRow = dashboardData.teamLead
        ? [{ ...dashboardData.teamLead, role: 'TEAMLEAD' }]
        : [];

    const bdmRows = (dashboardData.bdms || []).map((m) => ({ ...m, role: 'BDM' }));
    const employeeRows = (dashboardData.employees || []).map((m) => ({ ...m, role: 'EMPLOYEE' }));
    const coordinatorRows = (dashboardData.coordinators || []).map((m) => ({ ...m, role: 'COORDINATOR' }));
    const allMembers = [...teamLeadRow, ...bdmRows, ...employeeRows, ...coordinatorRows];

    const counts = {
        teamLeads: teamLeadRow.length,
        bdms: bdmRows.length,
        employees: employeeRows.length,
        coordinators: coordinatorRows.length,
        total: allMembers.length,
    };

    // Display name: prefer location state (already loaded), fallback to dashboardData
    const displayTeamName = teamData?.teamName || dashboardData.teamName || `Team ${teamId}`;
    const displayTeamLeadName = teamData?.teamLeadName || dashboardData.teamLead?.userName || teamId;
    const displayTeamLeadId = teamId;
    // ───────────────────────────────────────────────────────────────────────

    const statCards = [
        { icon: Group, label: 'Total Members', value: counts.total, color: '#1565c0', bg: '#e3f2fd' },
        { icon: People, label: 'Employees', value: counts.employees, color: '#2e7d32', bg: '#e8f5e9' },
        { icon: Business, label: 'BDMs', value: counts.bdms, color: '#6a1b9a', bg: '#f3e5f5' },
        { icon: ManageAccounts, label: 'Team Leads', value: counts.teamLeads, color: '#e65100', bg: '#fff3e0' },
        { icon: SupportAgent, label: 'Coordinators', value: counts.coordinators, color: '#00695c', bg: '#e0f2f1' },
    ];

    const commonTableProps = {
        loading: false,
        enableSelection: false,
        defaultSortColumn: 'userName',
        defaultSortDirection: 'asc',
        defaultRowsPerPage: 10,
        primaryColor: '#1976d2',
        secondaryColor: '#e0f2f1',
        customStyles: {
            headerBackground: '#1976d2',
            rowHover: '#e0f2f1',
            selectedRow: '#b2dfdb',
        },
    };

    const renderTable = (data, title, roleType) =>
        data.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>No {title.toLowerCase()} in this team.</Typography>
        ) : (
            <DataTable
                {...commonTableProps}
                data={data}
                columns={getMemberColumns(roleType)}
                title={title}
                uniqueId="userId"
            />
        );

    return (
        <Box sx={{ minHeight: '100vh', overflow: 'hidden', p: 2 }}>
            <Button variant="outlined" onClick={handleBackClick} sx={{ mb: 2 }} startIcon={<ArrowBackIcon />}>
                Back to Teams
            </Button>

            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {displayTeamName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Team Lead: <strong>{displayTeamLeadName}</strong> ({displayTeamLeadId})
                    {' · '}{counts.total} member{counts.total !== 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Stat Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statCards.map(({ icon, label, value, color, bg }) => (
                    <Grid item xs={6} sm={4} md={2.4} key={label}>
                        <StatCard icon={icon} label={label} value={value} color={color} bg={bg} />
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
                    <Tab label={`All Members (${counts.total})`} />
                    <Tab label={`Team Leads (${counts.teamLeads})`} />
                    <Tab label={`BDMs (${counts.bdms})`} />
                    <Tab label={`Employees (${counts.employees})`} />
                    <Tab label={`Coordinators (${counts.coordinators})`} />
                    <Tab label="Team Info" />
                </Tabs>
            </Paper>

            {tabValue === 0 && renderTable(allMembers, 'All Members', 'ALL')}
            {tabValue === 1 && renderTable(teamLeadRow, 'Team Leads', 'TEAMLEAD')}
            {tabValue === 2 && renderTable(bdmRows, 'BDMs', 'BDM')}
            {tabValue === 3 && renderTable(employeeRows, 'Employees', 'EMPLOYEE')}
            {tabValue === 4 && renderTable(coordinatorRows, 'Coordinators', 'COORDINATOR')}

            {/* Team Info Tab */}
            {tabValue === 5 && (
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Team Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {[
                                        ['Team Name', displayTeamName],
                                        ['Team Lead ID', displayTeamLeadId],
                                        ['Team Lead Name', displayTeamLeadName],
                                        ['Total Employees', counts.employees],
                                        ['Total BDMs', counts.bdms],
                                        ['Total Team Leads', counts.teamLeads],
                                        ['Total Coordinators', counts.coordinators],
                                        ['Total Members', counts.total],
                                    ].map(([label, value]) => (
                                        <React.Fragment key={label}>
                                            <Grid item xs={5}>
                                                <Typography variant="subtitle2" color="text.secondary">{label}:</Typography>
                                            </Grid>
                                            <Grid item xs={7}>
                                                <Typography>{value}</Typography>
                                            </Grid>
                                        </React.Fragment>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default TeamStatus;