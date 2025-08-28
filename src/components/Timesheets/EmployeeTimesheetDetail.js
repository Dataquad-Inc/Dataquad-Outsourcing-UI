// components/Timesheets/EmployeeTimesheetDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    IconButton,
    Tabs,
    Tab
} from '@mui/material';
import {
    ArrowBack,
    Person,
    CalendarToday,
    Work,
    Assignment,
    Schedule
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import ToastService from '../../Services/toastService';
import {
    handleBackNavigation,
    getStatusColor,
    formatDate,
    calculateTotalHours
} from './navigationHelpers';
import httpService from '../../Services/httpService';

const EmployeeTimesheetDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [timesheets, setTimesheets] = useState([]);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0);

    // Get employee data from navigation state
    const navigationData = location?.state?.employeeData || {};

    const fetchEmployeeTimesheet = async () => {
        setLoading(true);
        setError(null);

        try {
            const url = `/timesheet/getTimesheetsByUserId?userId=${userId}`;
            const response = await httpService.get(url);

            if (response.data && Array.isArray(response.data.data)) {
                // Sort timesheets by date to ensure chronological order
                const sortedTimesheets = response.data.data.sort((a, b) => {
                    return new Date(a.weekStartDate) - new Date(b.weekStartDate);
                });
                setTimesheets(sortedTimesheets);
            } else {
                setError('Invalid data format received from server');
            }
        } catch (err) {
            console.error('Error fetching employee timesheet:', err);
            setError('Failed to fetch employee timesheet details');
            ToastService.error('Failed to fetch employee timesheet details', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchEmployeeTimesheet();
        }
    }, [userId]);

    const handleBackClick = () => {
        handleBackNavigation(navigate, location);
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Loading timesheet details...</Typography>
                </Box>
            </Box>
        );
    }

    // if (error) {
    //     return (
    //         <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
    //             <Card sx={{ mb: 3, borderRadius: 2 }}>
    //                 <CardContent>
    //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
    //                         <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
    //                             <ArrowBack />
    //                         </IconButton>
    //                         <Typography variant="h6">Back to Timesheets</Typography>
    //                     </Box>
    //                 </CardContent>
    //             </Card>
    //             <Alert severity="error" sx={{ borderRadius: 2 }}>
    //                 {error}
    //             </Alert>
    //         </Box>
    //     );
    // }

    if (!timesheets || timesheets.length === 0) {
        return (
            <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No timesheet data found for this employee.
                </Alert>
            </Box>
        );
    }

    const currentTimesheet = timesheets[selectedTab];

    return (
        <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section with Back Button */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            onClick={handleBackClick}
                            sx={{
                                mr: 1,
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'primary.dark'
                                }
                            }}
                        >
                            <ArrowBack />
                        </IconButton>
                        <Person sx={{ color: 'primary.main', fontSize: 28 }} />
                        <Box>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                                Timesheet Details - {navigationData.employeeName || currentTimesheet.employeeName || 'Unknown Employee'}
                            </Typography>
                            {/* <Typography variant="body2" color="text.secondary">
                                User ID: {userId} | {timesheets.length} timesheet(s) found
                            </Typography> */}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Timesheet Selection Tabs */}
            {timesheets.length > 1 && (
                <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Select Timesheet Period
                        </Typography>
                        <Tabs 
                            value={selectedTab} 
                            onChange={handleTabChange} 
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {timesheets.map((timesheet, index) => (
                                <Tab
                                    key={timesheet.timesheetId}
                                    label={`Week ${index + 1} `}
                                />
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Timesheet Details */}
            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Timesheet Header Info */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person />
                                    Basic Information
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Employee Name</Typography>
                                        <Typography variant="body1" fontWeight={500}>
                                            {navigationData.employeeName || currentTimesheet.employeeName || 'Unknown'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Employee Type</Typography>
                                        <Chip
                                            label={navigationData.employeeType || currentTimesheet.employeeType || 'Unknown'}
                                            size="small"
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Timesheet Type</Typography>
                                        <Typography variant="body1">{currentTimesheet.timesheetType}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Status</Typography>
                                        <Chip
                                            label={currentTimesheet.status}
                                            color={getStatusColor(currentTimesheet.status)}
                                            size="small"
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarToday />
                                    Period & Performance
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Week Period</Typography>
                                        <Typography variant="body1">
                                            {formatDate(currentTimesheet.weekStartDate, 'MMM DD')} - {formatDate(currentTimesheet.weekEndDate, 'MMM DD, YYYY')}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Target Percentage</Typography>
                                        <Typography variant="body1" fontWeight={500} color="success.main">
                                            {currentTimesheet.percentageOfTarget}%
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Approver</Typography>
                                        <Typography variant="body1">{currentTimesheet.approver || 'Not assigned'}</Typography>
                                    </Box>
                                    {currentTimesheet.approvedBy && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Approved By</Typography>
                                            <Typography variant="body1">{currentTimesheet.approvedBy}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    {/* Working Entries Table */}
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work sx={{ color: 'primary.main' }} />
                        Working Entries
                    </Typography>

                    {currentTimesheet.workingEntries && currentTimesheet.workingEntries.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentTimesheet.workingEntries.map((entry, index) => (
                                        <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">
                                                        {formatDate(entry.date)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={entry.project}
                                                    variant="outlined"
                                                    size="small"
                                                    icon={<Assignment />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                    {entry.hours}h
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{entry.description}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                            No working entries found for this timesheet.
                        </Alert>
                    )}

                    {/* Non-Working Entries */}
                    {currentTimesheet.nonWorkingEntries && currentTimesheet.nonWorkingEntries.length > 0 && (
                        <>
                            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Work sx={{ color: 'warning.main' }} />
                                Non-Working Entries (Leaves/Absences)
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentTimesheet.nonWorkingEntries.map((entry, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="body2">
                                                            {formatDate(entry.date)}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={entry.project}
                                                        variant="outlined"
                                                        size="small"
                                                        color="warning"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 600, color: 'warning.main' }}>
                                                        {entry.hours}h
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{entry.description}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    {/* Notes Section */}
                    {currentTimesheet.notes && (
                        <Card variant="outlined" sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Notes
                            </Typography>
                            <Typography variant="body1">
                                {currentTimesheet.notes}
                            </Typography>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default EmployeeTimesheetDetail;