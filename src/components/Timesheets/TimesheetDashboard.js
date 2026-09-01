import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  ArrowBack,
  CalendarToday,
  Dashboard as DashboardIcon,
  Edit,
} from "@mui/icons-material";
import dayjs from "dayjs";
import DataTable from "../muiComponents/DataTabel";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : value;
};

const emptyMonthValues = () => Array.from({ length: 12 }, () => "");

const TimesheetDashboard = ({
  apiBase = "/timesheet",
  hideBackButton = false,
  title = "Timesheet Dashboard",
  subtitlePrefix = "Yearly hours by candidate for",
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearFromQuery = parseInt(searchParams.get("year"), 10);
  const [selectedYear, setSelectedYear] = useState(
    Number.isFinite(yearFromQuery) ? yearFromQuery : dayjs().year()
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editHours, setEditHours] = useState(emptyMonthValues());
  const [saving, setSaving] = useState(false);

  const currentYear = dayjs().year();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);
  const yearSuffix = String(selectedYear).slice(-2);

  const fetchDashboard = async (year) => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpService.get(`${apiBase}/yearly-dashboard`, { year });
      const payload = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setRows(payload);
    } catch (err) {
      console.error("Failed to load timesheet dashboard:", err);
      setError("Failed to load timesheet dashboard");
      ToastService.error("Failed to load timesheet dashboard");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear]);

  const tableRows = useMemo(
    () =>
      rows.map((row, index) => {
        const monthlyHours = Array.isArray(row.monthlyHours) ? row.monthlyHours : [];
        const flattened = {};
        MONTH_LABELS.forEach((_, monthIndex) => {
          flattened[`month${monthIndex}`] = Number(monthlyHours[monthIndex] || 0);
        });
        return {
          ...row,
          id: row.employeeId || row.candidateId || `row-${index}`,
          vendor: row.vendor || "—",
          client: row.client || "—",
          employmentType: row.employmentType || "—",
          candidateId: row.candidateId || "—",
          ...flattened,
        };
      }),
    [rows]
  );

  const employmentTypeOptions = useMemo(
    () => [...new Set(tableRows.map((row) => row.employmentType).filter(Boolean))],
    [tableRows]
  );

  const openEditDialog = (row, event) => {
    event?.stopPropagation();
    setEditingRow(row);
    setEditHours(
      MONTH_LABELS.map((_, monthIndex) => {
        const hours = Number(row[`month${monthIndex}`] || 0);
        return hours > 0 ? String(hours) : "";
      })
    );
  };

  const closeEditDialog = () => {
    setEditingRow(null);
    setEditHours(emptyMonthValues());
  };

  const editTotal = useMemo(
    () =>
      editHours.reduce((sum, value) => {
        const hours = Number(value);
        return sum + (Number.isFinite(hours) ? hours : 0);
      }, 0),
    [editHours]
  );

  const handleSaveHours = async () => {
    if (!editingRow?.employeeId) {
      ToastService.error("Unable to save hours for this candidate");
      return;
    }

    const monthlyHours = editHours.map((value) => {
      const hours = Number(value);
      return Number.isFinite(hours) && hours > 0 ? Math.round(hours) : 0;
    });

    setSaving(true);
    try {
      await httpService.put(`${apiBase}/yearly-dashboard/hours`, {
        employeeId: editingRow.employeeId,
        year: selectedYear,
        monthlyHours,
      });
      ToastService.success("Monthly hours updated");
      closeEditDialog();
      await fetchDashboard(selectedYear);
    } catch (err) {
      console.error("Failed to save monthly hours:", err);
      ToastService.error(err.response?.data?.message || "Failed to save monthly hours");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "candidateId",
        label: "Cand ID",
        width: 120,
        filterable: true,
        sortable: true,
      },
      {
        key: "candidateName",
        label: "Candidate Name",
        width: 180,
        filterable: true,
        sortable: true,
      },
      {
        key: "employmentType",
        label: "Employment Type",
        width: 150,
        type: "select",
        filterable: true,
        sortable: true,
        options: employmentTypeOptions,
        render: (row) => (
          <Chip label={row.employmentType || "—"} size="small" variant="outlined" />
        ),
      },
      {
        key: "vendor",
        label: "Vendor",
        width: 140,
        filterable: true,
        sortable: true,
      },
      {
        key: "client",
        label: "Client",
        width: 140,
        filterable: true,
        sortable: true,
      },
      {
        key: "startDate",
        label: "Start Date",
        width: 130,
        filterable: true,
        sortable: true,
        render: (row) => formatDisplayDate(row.startDate),
      },
      {
        key: "endDate",
        label: "End Date",
        width: 130,
        filterable: true,
        sortable: true,
        render: (row) => formatDisplayDate(row.endDate),
      },
      ...MONTH_LABELS.map((label, monthIndex) => ({
        key: `month${monthIndex}`,
        label: `${label}-${yearSuffix}`,
        width: 90,
        type: "number",
        filterable: true,
        sortable: true,
        total: true,
        align: "right",
        render: (row) => {
          const hours = Number(row[`month${monthIndex}`] || 0);
          return hours > 0 ? hours : "";
        },
      })),
      {
        key: "totalHours",
        label: "Total Hours",
        width: 120,
        type: "number",
        filterable: true,
        sortable: true,
        total: true,
        align: "right",
        render: (row) => (
          <Chip
            icon={<AccessTime />}
            label={row.totalHours || 0}
            size="small"
            color="primary"
          />
        ),
      },
      {
        key: "actions",
        label: "Action",
        width: 90,
        filterable: false,
        sortable: false,
        render: (row) => (
          <Tooltip title="Edit monthly hours">
            <IconButton
              color="primary"
              size="small"
              onClick={(event) => openEditDialog(row, event)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [yearSuffix, employmentTypeOptions]
  );

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <DashboardIcon sx={{ color: "primary.main", fontSize: 32 }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: "primary.dark" }}>
            {title}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitlePrefix} {selectedYear}
          </Typography>
        </Box>
      </Box>

      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday sx={{ color: "primary.main", fontSize: 24 }} />
                  <Typography variant="h6" color="primary.main">
                    {selectedYear}
                  </Typography>
                </Box>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="dashboard-year-label">Year</InputLabel>
                  <Select
                    labelId="dashboard-year-label"
                    value={selectedYear}
                    label="Year"
                    onChange={(event) => {
                      const nextYear = event.target.value;
                      setSelectedYear(nextYear);
                      setSearchParams({ year: String(nextYear) });
                    }}
                    sx={{ borderRadius: 2, backgroundColor: "white" }}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            {!hideBackButton && (
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate("/dashboard/timesheetsForAdmins")}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                >
                  Back to Timesheets
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} variant="filled">
          {error}
        </Alert>
      )}

      <Card elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflow: "auto" }}>
            <DataTable
              title={`Timesheet Dashboard ${selectedYear}`}
              data={tableRows}
              columns={columns}
              enableSelection={false}
              uniqueId="id"
              loading={loading}
              refreshData={() => fetchDashboard(selectedYear)}
              enableColumnTotals
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingRow)} onClose={saving ? undefined : closeEditDialog} fullWidth maxWidth="md">
        <DialogTitle>
          Edit monthly hours
          {editingRow?.candidateName ? ` — ${editingRow.candidateName}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter hours for each month in {selectedYear}. Leave a month blank to keep it at 0.
          </Typography>
          <Grid container spacing={2}>
            {MONTH_LABELS.map((label, monthIndex) => (
              <Grid item xs={6} sm={4} md={3} key={label}>
                <TextField
                  label={`${label}-${yearSuffix}`}
                  type="number"
                  size="small"
                  fullWidth
                  value={editHours[monthIndex]}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setEditHours((current) => {
                      const next = [...current];
                      next[monthIndex] = nextValue;
                      return next;
                    });
                  }}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Chip icon={<AccessTime />} color="primary" label={`Total: ${editTotal}h`} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveHours} disabled={saving}>
            {saving ? "Saving..." : "Save Hours"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimesheetDashboard;
