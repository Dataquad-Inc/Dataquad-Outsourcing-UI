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
  Tab,
  Tabs,
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

const STATUS_TABS = [
  { label: "OverAll", value: "all" },
  { label: "Active", value: "active" },
  { label: "In-Active", value: "inactive" },
];

/**
 * Resolve the dashboard endpoint prefix based on the entity AND status tab.
 *
 * - OverAll tab ("all")   -> "yearly-dashboard"      (for both US & IN)
 * - Active/In-Active tab:
 *     - US entity          -> "us-yearly-dashboard"
 *     - everything else    -> "in-yearly-dashboard"
 *
 * @param {string} entity    - "us" | "in" | anything else
 * @param {string} statusTab - "all" | "active" | "inactive"
 */
const getEntityEndpointPrefix = (entity, statusTab) => {
  // OverAll tab always uses the generic yearly-dashboard for both entities.
  if (statusTab === "all") return "yearly-dashboard";

  // For Active / In-Active tabs, only "us" maps to US; everything else maps to IN.
  const normalized = String(entity || "").trim().toLowerCase();
  if (normalized === "us") return "us-yearly-dashboard";
  return "in-yearly-dashboard";
};

const TimesheetDashboard = ({
  apiBase = "/timesheet",
  entity,
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
  const [statusTab, setStatusTab] = useState("all");

  const currentYear = dayjs().year();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);
  const yearSuffix = String(selectedYear).slice(-2);

  const fetchDashboard = async (year, tab = statusTab) => {
    setLoading(true);
    setError(null);
    try {
      const params = { year };
      if (entity) params.entity = entity;

      const endpointPrefix = getEntityEndpointPrefix(entity, tab);
      const endpoint =
        tab === "all"
          ? `${apiBase}/${endpointPrefix}`
          : `${apiBase}/${endpointPrefix}/${tab}`;

      const response = await httpService.get(endpoint, params);
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
    fetchDashboard(selectedYear, statusTab);
  }, [selectedYear, entity, apiBase, statusTab]);

  const tableRows = useMemo(
    () =>
      rows.map((row, index) => {
        const monthlyHours = Array.isArray(row.monthlyHours) ? row.monthlyHours : [];
        const flattened = {};
        MONTH_LABELS.forEach((_, monthIndex) => {
          flattened[`month${monthIndex}`] = Number(monthlyHours[monthIndex] || 0);
        });

        // Guaranteed-unique id: business id + index prevents collisions
        // when multiple rows share employeeId/candidateId (or both are missing),
        // which was causing duplicate rows during search.
        const baseId =
          row.employeeId ||
          row.candidateId ||
          row.id ||
          "timesheet-row";

        return {
          ...row,
          id: `${baseId}-${index}`,
          employeeId: row.employeeId ?? null,
          vendor: row.vendor || "—",
          client: row.client || "—",
          employmentType: row.employmentType || "—",
          candidateId: row.candidateId || "—",
          candidateName: row.candidateName || "—",
          ...flattened,
        };
      }),
    [rows]
  );

  // Server already filters by status via the endpoint,
  // so no client-side re-filtering is needed.
  const filteredTableRows = tableRows;

  const employmentTypeOptions = useMemo(
    () =>
      [
        ...new Set(
          tableRows
            .map((row) => row.employmentType)
            .filter((v) => v && v !== "—")
        ),
      ],
    [tableRows]
  );

  const minEditableMonthIndex = useMemo(() => {
    if (!editingRow?.startDate) return 0;
    const start = dayjs(editingRow.startDate);
    if (!start.isValid()) return 0;

    const startYear = start.year();
    if (startYear < selectedYear) return 0;
    if (startYear > selectedYear) return 12;
    return start.month();
  }, [editingRow, selectedYear]);

  const maxEditableMonthIndex = useMemo(() => {
    if (!editingRow?.endDate) return 11;
    const end = dayjs(editingRow.endDate);
    if (!end.isValid()) return 11;

    const endYear = end.year();
    if (endYear < selectedYear) return -1;
    if (endYear > selectedYear) return 11;
    return end.month();
  }, [editingRow, selectedYear]);

  const openEditDialog = (row, event) => {
    event?.stopPropagation();
    setEditingRow(row);

    let minMonth = 0;
    const start = row?.startDate ? dayjs(row.startDate) : null;
    if (start && start.isValid()) {
      if (start.year() < selectedYear) minMonth = 0;
      else if (start.year() > selectedYear) minMonth = 12;
      else minMonth = start.month();
    }

    let maxMonth = 11;
    const end = row?.endDate ? dayjs(row.endDate) : null;
    if (end && end.isValid()) {
      if (end.year() < selectedYear) maxMonth = -1;
      else if (end.year() > selectedYear) maxMonth = 11;
      else maxMonth = end.month();
    }

    setEditHours(
      MONTH_LABELS.map((_, monthIndex) => {
        if (monthIndex < minMonth || monthIndex > maxMonth) return "";
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

    const monthlyHours = editHours.map((value, monthIndex) => {
      if (monthIndex < minEditableMonthIndex || monthIndex > maxEditableMonthIndex) return 0;
      const hours = Number(value);
      return Number.isFinite(hours) && hours > 0 ? Math.round(hours) : 0;
    });

    setSaving(true);
    try {
      // OverAll tab     -> /yearly-dashboard/hours
      // Active/In-Active:
      //   US entity     -> /us-yearly-dashboard/hours
      //   everything else -> /in-yearly-dashboard/hours
      const endpointPrefix = getEntityEndpointPrefix(entity, statusTab);
      await httpService.put(`${apiBase}/${endpointPrefix}/hours`, {
        candidateId: editingRow.candidateId,
        employeeId: editingRow.employeeId,
        year: selectedYear,
        monthlyHours,
        ...(entity ? { entity } : {}),
      });
      ToastService.success("Monthly hours updated");
      closeEditDialog();
      await fetchDashboard(selectedYear, statusTab);
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
        searchable: true,
      },
      {
        key: "candidateName",
        label: "Candidate Name",
        width: 180,
        filterable: true,
        sortable: true,
        searchable: true,
      },
      {
        key: "employmentType",
        label: "Employment Type",
        width: 150,
        type: "select",
        filterable: true,
        sortable: true,
        searchable: true,
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
        searchable: true,
      },
      {
        key: "client",
        label: "Client",
        width: 140,
        filterable: true,
        sortable: true,
        searchable: true,
      },
      {
        key: "startDate",
        label: "Start Date",
        width: 130,
        filterable: true,
        sortable: true,
        searchable: true,
        render: (row) => formatDisplayDate(row.startDate),
      },
      {
        key: "endDate",
        label: "End Date",
        width: 130,
        filterable: true,
        sortable: true,
        searchable: true,
        render: (row) => formatDisplayDate(row.endDate),
      },
      ...MONTH_LABELS.map((label, monthIndex) => ({
        key: `month${monthIndex}`,
        label: `${label}-${yearSuffix}`,
        width: 90,
        type: "number",
        filterable: true,
        sortable: true,
        searchable: true,
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
        searchable: true,
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
        searchable: false,
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
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs
            value={statusTab}
            onChange={(event, nextValue) => setStatusTab(nextValue)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {STATUS_TABS.map((tab) => (
              <Tab
                key={tab.value}
                label={tab.label}
                value={tab.value}
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
            ))}
          </Tabs>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflow: "auto" }}>
            <DataTable
              title={`Timesheet Dashboard ${selectedYear}`}
              data={filteredTableRows}
              columns={columns}
              enableSelection={false}
              uniqueId="id"
              loading={loading}
              refreshData={() => fetchDashboard(selectedYear, statusTab)}
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
            Months before the candidate's start date and after the end date are disabled.
          </Typography>
          <Grid container spacing={2}>
            {MONTH_LABELS.map((label, monthIndex) => {
              const isDisabled =
                monthIndex < minEditableMonthIndex || monthIndex > maxEditableMonthIndex;
              let helperText = " ";
              if (monthIndex < minEditableMonthIndex) helperText = "Before start date";
              else if (monthIndex > maxEditableMonthIndex) helperText = "After end date";
              return (
                <Grid item xs={6} sm={4} md={3} key={label}>
                  <TextField
                    label={`${label}-${yearSuffix}`}
                    type="number"
                    size="small"
                    fullWidth
                    disabled={isDisabled}
                    value={isDisabled ? "" : editHours[monthIndex]}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setEditHours((current) => {
                        const next = [...current];
                        next[monthIndex] = nextValue;
                        return next;
                      });
                    }}
                    inputProps={{ min: 0, step: 1 }}
                    helperText={helperText}
                  />
                </Grid>
              );
            })}
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