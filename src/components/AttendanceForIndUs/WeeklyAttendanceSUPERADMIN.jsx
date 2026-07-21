// src/components/AttendanceForIndUs/WeeklyAttendanceSUPERADMIN.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Box,
    Paper,
    Typography,
    useTheme,
    Chip,
    Tooltip,
    Button,
    alpha,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Tabs,
    Tab,
} from "@mui/material";
import {
    RefreshCw,
    Loader2,
    Calendar,
    ThumbsUp,
    ThumbsDown,
    FileText,
    CheckCircle,
    XCircle,
} from "lucide-react";

import {
    fetchPendingAttendance,
    approveWeeklyAttendance,
    rejectWeeklyAttendance,
    approveMonthlyAttendance,
    rejectMonthlyAttendance,
    clearSnackbar,
    setSnackbar,
    selectPendingAttendanceData,
    selectPendingLoading,
    selectPendingError,
    selectSelectedMonth,
    selectSelectedYear,
    selectEntity,
    selectSnackbar,
    selectMonthlyLoading,
} from "../../redux/attendanceSlice";

// ============================================================
// CONSTANTS
// ============================================================

const ATTENDANCE_STATUS_COLORS = {
    P: "#4CAF50",
    WO: "#FFA726",
    L: "#EF5350",
    PH: "#42A5F5",
    HD: "#AB47BC",
    SP: "#26C6DA",
    LOP: "#EF5350",
    WFH: "#FF9800",
    "": "#E0E0E0",
};

const ATTENDANCE_STATUS_LABELS = {
    P: "Present",
    WO: "Weekend/Off",
    L: "Leave",
    PH: "Public Holiday",
    HD: "Half Day",
    SP: "Special Permission",
    LOP: "Loss of Pay",
    WFH: "Work From Home",
    "": "Not Marked",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getCycleInfo = (month, year) => {
    const nextMonth = month;
    const nextYear = year;
    const cycleMonth = month === 1 ? 12 : month - 1;
    const cycleYear = month === 1 ? year - 1 : year;
    return { cycleMonth, cycleYear, nextMonth, nextYear };
};

const getMondaySundayWeeks = (month, year) => {
    const { cycleMonth, cycleYear, nextMonth, nextYear } = getCycleInfo(month, year);
    const cycleStart = new Date(cycleYear, cycleMonth - 1, 26);
    const cycleEnd = new Date(nextYear, nextMonth - 1, 25);

    const weeks = [];
    let currentDate = new Date(cycleStart);
    while (currentDate.getDay() !== 1) {
        currentDate.setDate(currentDate.getDate() - 1);
    }

    let weekNumber = 1;
    while (currentDate <= cycleEnd) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekEnd >= cycleStart || weekStart <= cycleEnd) {
            const adjustedStart = weekStart < cycleStart ? new Date(cycleStart) : new Date(weekStart);
            const adjustedEnd = weekEnd > cycleEnd ? new Date(cycleEnd) : new Date(weekEnd);
            weeks.push({
                weekNumber: weekNumber,
                startDate: adjustedStart,
                endDate: adjustedEnd,
            });
        }
        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;
    }
    return weeks;
};

const getAllDaysInWeek = (weekStart, weekEnd) => {
    const allDays = [];
    const currentDate = new Date(weekStart);
    while (currentDate <= weekEnd) {
        const day = String(currentDate.getDate());
        const monthKey = currentDate.getMonth() + 1;
        const yearKey = currentDate.getFullYear();
        const dayOfWeek = currentDate.getDay();
        allDays.push({
            day,
            month: monthKey,
            year: yearKey,
            dayName: DAY_NAMES[dayOfWeek],
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            date: new Date(yearKey, monthKey - 1, parseInt(day, 10)),
            displayDate: `${day} ${MONTHS[monthKey - 1]}`,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return allDays;
};

const getWorkingDaysInWeek = (weekStart, weekEnd) => {
    return getAllDaysInWeek(weekStart, weekEnd).filter(d => !d.isWeekend);
};

const getWeekNumberForDay = (day, month, year, weeks) => {
    const date = new Date(year, month - 1, parseInt(day, 10));
    for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        if (date >= week.startDate && date <= week.endDate) {
            return i + 1;
        }
    }
    return null;
};

const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "—";
    const startMonth = MONTHS[startDate.getMonth()];
    const endMonth = MONTHS[endDate.getMonth()];
    if (startMonth === endMonth) {
        return `${startDate.getDate()} - ${endDate.getDate()} ${endMonth}`;
    }
    return `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth}`;
};

// ============================================================
// MAIN SUPERADMIN WEEKLY ATTENDANCE COMPONENT
// ============================================================

const WeeklyAttendanceSUPERADMIN = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    const attendanceData = useSelector(selectPendingAttendanceData);
    const loading = useSelector(selectPendingLoading);
    const error = useSelector(selectPendingError);
    const selectedMonth = useSelector(selectSelectedMonth);
    const selectedYear = useSelector(selectSelectedYear);
    const entity = useSelector(selectEntity);
    const snackbar = useSelector(selectSnackbar);
    const monthlyLoading = useSelector(selectMonthlyLoading);

    const [weeklyData, setWeeklyData] = useState([]);
    const [loadingWeeks, setLoadingWeeks] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [monthlyActionLoading, setMonthlyActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    const getAttendanceForWeek = useCallback((attendanceGrid, weekStart, weekEnd) => {
        const weekDays = {};
        const allDays = getAllDaysInWeek(weekStart, weekEnd);
        allDays.forEach(({ day }) => {
            const dayKey = String(day);
            weekDays[dayKey] = attendanceGrid[String(parseInt(day, 10))] || '';
        });
        return weekDays;
    }, []);

    // ============================================================
    // GENERATE WEEKS DATA FROM PENDING ENDPOINT
    // ============================================================

    const generateWeeksData = useCallback(() => {
        if (!attendanceData || attendanceData.length === 0) {
            setWeeklyData([]);
            return;
        }

        setLoadingWeeks(true);
        try {
            const weeks = getMondaySundayWeeks(selectedMonth, selectedYear);
            const { cycleMonth, cycleYear, nextMonth, nextYear } = getCycleInfo(selectedMonth, selectedYear);

            const weeksMap = new Map();
            weeks.forEach((week, index) => {
                const weekNumber = index + 1;
                const allDays = getAllDaysInWeek(week.startDate, week.endDate);
                const workingDays = getWorkingDaysInWeek(week.startDate, week.endDate);

                weeksMap.set(weekNumber, {
                    weekNumber,
                    employees: [],
                    startDate: week.startDate,
                    endDate: week.endDate,
                    allDays,
                    workingDays,
                    totalEmployees: 0,
                });
            });

            attendanceData.forEach(employee => {
                const attendanceGrid = employee.attendanceGrid || {};
                const days = Object.keys(attendanceGrid);

                days.forEach(day => {
                    const dayNumber = parseInt(day, 10);
                    const actualMonth = dayNumber >= 26 ? cycleMonth : nextMonth;
                    const actualYear = dayNumber >= 26 ? cycleYear : nextYear;
                    const weekNumber = getWeekNumberForDay(day, actualMonth, actualYear, weeks);

                    if (weekNumber && weeksMap.has(weekNumber)) {
                        const weekData = weeksMap.get(weekNumber);
                        const existingEmployee = weekData.employees.find(e => e.id === employee.employeeId);

                        if (!existingEmployee) {
                            const weekAttendance = getAttendanceForWeek(
                                attendanceGrid,
                                weekData.startDate,
                                weekData.endDate
                            );

                            weekData.employees.push({
                                id: employee.employeeId,
                                name: employee.employeeName,
                                designation: employee.designation,
                                attendance: weekAttendance,
                            });
                        }
                    }
                });
            });

            const processedWeeks = [];
            for (let week = 1; week <= weeksMap.size; week++) {
                const weekData = weeksMap.get(week);
                if (!weekData) continue;

                processedWeeks.push({
                    ...weekData,
                    totalEmployees: weekData.employees.length,
                });
            }

            setWeeklyData(processedWeeks);
        } catch (err) {
            console.error('Error generating weeks data:', err);
        } finally {
            setLoadingWeeks(false);
        }
    }, [attendanceData, selectedMonth, selectedYear, getAttendanceForWeek]);

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        dispatch(fetchPendingAttendance({ month: selectedMonth, year: selectedYear, entity }));
    }, [dispatch, selectedMonth, selectedYear, entity]);

    useEffect(() => {
        if (attendanceData && attendanceData.length > 0) {
            generateWeeksData();
        } else {
            setWeeklyData([]);
        }
    }, [attendanceData, generateWeeksData]);

    useEffect(() => {
        setActiveTab(0);
        setPage(0);
    }, [weeklyData]);

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleApproveWeek = async (weekNumber) => {
        setActionLoading({ type: 'approve', week: weekNumber });
        try {
            const payload = {
                month: selectedMonth,
                year: selectedYear,
                weekNumber: weekNumber,
                entity: entity,
            };

            const result = await dispatch(approveWeeklyAttendance(payload));
            
            if (result.payload?.success) {
                dispatch(setSnackbar({
                    open: true,
                    message: `Week ${weekNumber} approved successfully!`,
                    severity: 'success',
                }));
                dispatch(fetchPendingAttendance({ month: selectedMonth, year: selectedYear, entity }));
            } else {
                dispatch(setSnackbar({
                    open: true,
                    message: result.payload?.message || `Failed to approve week ${weekNumber}`,
                    severity: 'error',
                }));
            }
        } catch (error) {
            dispatch(setSnackbar({
                open: true,
                message: `Error approving week ${weekNumber}`,
                severity: 'error',
            }));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectWeek = async (weekNumber) => {
        setActionLoading({ type: 'reject', week: weekNumber });
        try {
            const payload = {
                month: selectedMonth,
                year: selectedYear,
                weekNumber: weekNumber,
                entity: entity,
            };

            const result = await dispatch(rejectWeeklyAttendance(payload));
            
            if (result.payload?.success) {
                dispatch(setSnackbar({
                    open: true,
                    message: `Week ${weekNumber} rejected successfully!`,
                    severity: 'success',
                }));
                dispatch(fetchPendingAttendance({ month: selectedMonth, year: selectedYear, entity }));
            } else {
                dispatch(setSnackbar({
                    open: true,
                    message: result.payload?.message || `Failed to reject week ${weekNumber}`,
                    severity: 'error',
                }));
            }
        } catch (error) {
            dispatch(setSnackbar({
                open: true,
                message: `Error rejecting week ${weekNumber}`,
                severity: 'error',
            }));
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveMonthly = async () => {
        setMonthlyActionLoading('approve');
        try {
            const payload = {
                month: selectedMonth,
                year: selectedYear,
                entity: entity,
            };

            const result = await dispatch(approveMonthlyAttendance(payload));
            
            if (result.payload?.success) {
                dispatch(setSnackbar({
                    open: true,
                    message: `Monthly attendance for ${MONTHS[selectedMonth - 1]} ${selectedYear} approved successfully!`,
                    severity: 'success',
                }));
                dispatch(fetchPendingAttendance({ month: selectedMonth, year: selectedYear, entity }));
            } else {
                dispatch(setSnackbar({
                    open: true,
                    message: result.payload?.message || `Failed to approve monthly attendance`,
                    severity: 'error',
                }));
            }
        } catch (error) {
            dispatch(setSnackbar({
                open: true,
                message: `Error approving monthly attendance`,
                severity: 'error',
            }));
        } finally {
            setMonthlyActionLoading(null);
        }
    };

    const handleRejectMonthly = async () => {
        setMonthlyActionLoading('reject');
        try {
            const payload = {
                month: selectedMonth,
                year: selectedYear,
                entity: entity,
            };

            const result = await dispatch(rejectMonthlyAttendance(payload));
            
            if (result.payload?.success) {
                dispatch(setSnackbar({
                    open: true,
                    message: `Monthly attendance for ${MONTHS[selectedMonth - 1]} ${selectedYear} rejected successfully!`,
                    severity: 'success',
                }));
                dispatch(fetchPendingAttendance({ month: selectedMonth, year: selectedYear, entity }));
            } else {
                dispatch(setSnackbar({
                    open: true,
                    message: result.payload?.message || `Failed to reject monthly attendance`,
                    severity: 'error',
                }));
            }
        } catch (error) {
            dispatch(setSnackbar({
                open: true,
                message: `Error rejecting monthly attendance`,
                severity: 'error',
            }));
        } finally {
            setMonthlyActionLoading(null);
        }
    };

    const handleRefresh = () => {
        dispatch(fetchPendingAttendance({ month: selectedMonth, year: selectedYear, entity }));
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // ============================================================
    // RENDER WEEK TAB CONTENT
    // ============================================================

    const renderWeekTable = (weekData) => {
        if (!weekData) return null;

        const isApproving = actionLoading?.type === 'approve' && actionLoading?.week === weekData.weekNumber;
        const isRejecting = actionLoading?.type === 'reject' && actionLoading?.week === weekData.weekNumber;

        // Pagination
        const paginatedEmployees = weekData.employees?.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        ) || [];

        return (
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateRange(weekData.startDate, weekData.endDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {weekData.workingDays?.length || 0} working days
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total: {weekData.employees?.length || 0} employees
                        </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={isApproving ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                            onClick={() => handleApproveWeek(weekData.weekNumber)}
                            disabled={!!actionLoading}
                            sx={{
                                borderRadius: 2,
                                backgroundColor: '#4CAF50',
                                '&:hover': { backgroundColor: '#388E3C' },
                                '&.Mui-disabled': {
                                    backgroundColor: alpha('#4CAF50', 0.3),
                                },
                            }}
                        >
                            {isApproving ? 'Approving...' : 'Approve Week'}
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={isRejecting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                            onClick={() => handleRejectWeek(weekData.weekNumber)}
                            disabled={!!actionLoading}
                            sx={{
                                borderRadius: 2,
                                backgroundColor: '#EF5350',
                                '&:hover': { backgroundColor: '#C62828' },
                                '&.Mui-disabled': {
                                    backgroundColor: alpha('#EF5350', 0.3),
                                },
                            }}
                        >
                            {isRejecting ? 'Rejecting...' : 'Reject Week'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshCw size={16} />}
                            onClick={handleRefresh}
                            disabled={loading || loadingWeeks}
                            sx={{ borderRadius: 2 }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha('#0F7C82', 0.04) }}>
                                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                                {weekData.allDays?.map(d => (
                                    <TableCell
                                        key={d.day}
                                        align="center"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            backgroundColor: d.isWeekend ? alpha('#9E9E9E', 0.08) : 'transparent',
                                        }}
                                    >
                                        {d.dayName.slice(0, 3)}
                                        <Typography component="div" variant="caption" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                                            {d.displayDate}
                                        </Typography>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={weekData.allDays?.length + 4} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No employees found for this week</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedEmployees.map((emp, idx) => (
                                    <TableRow key={emp.id} hover>
                                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                        <TableCell>{emp.id}</TableCell>
                                        <TableCell>
                                            <Typography fontWeight={500}>{emp.name}</Typography>
                                        </TableCell>
                                        <TableCell>{emp.designation || '—'}</TableCell>
                                        {weekData.allDays?.map(d => {
                                            const status = emp.attendance?.[d.day] || '';
                                            return (
                                                <TableCell
                                                    key={d.day}
                                                    align="center"
                                                    sx={{ backgroundColor: d.isWeekend ? alpha('#9E9E9E', 0.04) : 'transparent' }}
                                                >
                                                    <Tooltip title={`${emp.name} — ${d.displayDate} (${d.dayName}): ${ATTENDANCE_STATUS_LABELS[status] || 'Not Marked'}`}>
                                                        <Box
                                                            sx={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: '4px',
                                                                backgroundColor: status ? alpha(ATTENDANCE_STATUS_COLORS[status] || '#E0E0E0', 0.15) : 'transparent',
                                                                border: status ? `2px solid ${ATTENDANCE_STATUS_COLORS[status] || '#E0E0E0'}` : '1px solid #E8E8E8',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                margin: '0 auto',
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                color: status ? ATTENDANCE_STATUS_COLORS[status] || '#BDBDBD' : '#BDBDBD',
                                                            }}
                                                        >
                                                            {status || '—'}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Box />
                    <TablePagination
                        component="div"
                        count={weekData.employees?.length || 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25, 50,100]}
                        sx={{
                            borderBottom: 'none',
                            '& .MuiTablePagination-select': {
                                borderRadius: 1,
                            },
                        }}
                    />
                </Box>
            </Box>
        );
    };

    // ============================================================
    // RENDER
    // ============================================================

    const filteredWeeklyData = weeklyData.filter(w => w.totalEmployees > 0);
    const { cycleMonth, cycleYear, nextMonth, nextYear } = getCycleInfo(selectedMonth, selectedYear);

    if (loadingWeeks || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ ml: 2 }}>Loading pending attendance data...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography color="error">{error}</Typography>
                <Button onClick={handleRefresh} sx={{ mt: 2 }}>Retry</Button>
            </Paper>
        );
    }

    if (filteredWeeklyData.length === 0) {
        return (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                <Calendar size={64} style={{ color: '#BDBDBD', marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No Pending Attendance</Typography>
                <Typography variant="body2" color="text.secondary">
                    All weekly attendance has been reviewed or no submissions found for this cycle
                </Typography>
                <Box display="flex" gap={2} justifyContent="center" mt={2}>
                    <Button
                        variant="contained"
                        startIcon={<RefreshCw size={16} />}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                </Box>
            </Paper>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        Review Pending Weekly Attendance
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Cycle: 26th {MONTHS[cycleMonth - 1]} to 25th {MONTHS[nextMonth - 1]}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        Showing weeks with pending submissions that require review
                    </Typography>
                </Box>
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                    <Chip
                        icon={<Calendar size={16} />}
                        label={`${MONTHS[cycleMonth - 1]} ${cycleYear} - ${MONTHS[nextMonth - 1]} ${nextYear}`}
                        variant="outlined"
                    />
                    <Button
                        variant="contained"
                        size="medium"
                        startIcon={monthlyActionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        onClick={handleApproveMonthly}
                        disabled={!!monthlyActionLoading}
                        sx={{
                            borderRadius: 2,
                            backgroundColor: '#4CAF50',
                            '&:hover': { backgroundColor: '#388E3C' },
                            '&.Mui-disabled': {
                                backgroundColor: alpha('#4CAF50', 0.3),
                            },
                        }}
                    >
                        {monthlyActionLoading === 'approve' ? 'Approving...' : 'Approve Monthly'}
                    </Button>
                    <Button
                        variant="contained"
                        size="medium"
                        startIcon={monthlyActionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        onClick={handleRejectMonthly}
                        disabled={!!monthlyActionLoading}
                        sx={{
                            borderRadius: 2,
                            backgroundColor: '#EF5350',
                            '&:hover': { backgroundColor: '#C62828' },
                            '&.Mui-disabled': {
                                backgroundColor: alpha('#EF5350', 0.3),
                            },
                        }}
                    >
                        {monthlyActionLoading === 'reject' ? 'Rejecting...' : 'Reject Monthly'}
                    </Button>
                    <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<RefreshCw size={16} />}
                        onClick={handleRefresh}
                        disabled={loading || loadingWeeks}
                        sx={{ borderRadius: 2 }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: alpha('#0F7C82', 0.02),
                        '& .MuiTab-root': {
                            minHeight: 48,
                            px: 2,
                            fontWeight: 600,
                            '&.Mui-selected': {
                                color: '#0F7C82',
                            },
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#0F7C82',
                            height: 3,
                        },
                    }}
                >
                    {filteredWeeklyData.map((week) => (
                        <Tab
                            key={week.weekNumber}
                            label={
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <span>Week {week.weekNumber}</span>
                                </Box>
                            }
                        />
                    ))}
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {filteredWeeklyData[activeTab] && renderWeekTable(filteredWeeklyData[activeTab])}
                </Box>
            </Paper>
        </Box>
    );
};

export default WeeklyAttendanceSUPERADMIN;