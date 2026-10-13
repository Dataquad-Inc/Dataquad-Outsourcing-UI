import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Month toggle buttons use value 1..12, OverAll uses "all"
const INVOICE_TABS = [
  ...MONTH_LABELS.map((label, index) => ({ label, value: index + 1 })),
  { label: "OverAll", value: "all" },
];

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : value;
};

const Invoice = ({ apiBase = "/timesheet", entity = "us" }) => {
  const theme = useTheme();
  const currentYear = dayjs().year();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState(dayjs().month() + 1); // 1..12 or "all"
  // OverAll sub-view: "candidate" | "vendor"
  const [overAllView, setOverAllView] = useState("candidate");
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch invoice data (same endpoint, month param optional) ─────────
  const fetchInvoiceData = useCallback(
    async (year, tab, view) => {
      setLoading(true);
      try {
        const params = { year };
        if (tab !== "all") params.month = tab; // omit month for Overall
        if (entity) params.entity = entity;
        // Pass view only when OverAll is active so backend can differentiate
        if (tab === "all") params.view = view;

        const response = await httpService.get(
          `${apiBase}/us-yearly-dashboard/invoice`,
          params
        );
        const payload = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setInvoiceRows(payload);
      } catch (err) {
        console.error("Failed to load invoice data:", err);
        ToastService.error("Failed to load invoice data");
        setInvoiceRows([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase, entity]
  );

  useEffect(() => {
    fetchInvoiceData(selectedYear, activeTab, overAllView);
  }, [selectedYear, activeTab, overAllView, fetchInvoiceData]);

  // ── Normalize rows so DataTablePaginated gets stable unique ids ──────
  const invoiceTableRows = useMemo(
    () =>
      invoiceRows.map((row, index) => {
        const baseId =
          row.employeeId || row.candidateId || row.id || "invoice-row";

        return {
          ...row,
          id: `${baseId}-${index}`,
          employeeId: row.employeeId ?? null,
          vendor: row.vendor || "—",
          client: row.client || "—",
          employmentType: row.employmentType || "—",
          candidateId: row.candidateId || "—",
          candidateName: row.candidateName || "—",
        };
      }),
    [invoiceRows]
  );

  // ── Candidate view columns (default) ─────────────────────────────────
  const candidateColumns = useMemo(
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
        render: (row) => (
          <Chip
            label={row.employmentType || "—"}
            size="small"
            variant="outlined"
          />
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
      {
        key: "existingValue",
        label: "Existing Value",
        width: 140,
        filterable: true,
        sortable: true,
        searchable: true,
        align: "right",
        render: (row) => row.existingValue ?? "—",
      },
      {
        key: "newValue",
        label: "New Value",
        width: 140,
        filterable: true,
        sortable: true,
        searchable: true,
        align: "right",
        render: (row) => row.newValue ?? "—",
      },
    ],
    []
  );

  // ── Vendor view columns ──────────────────────────────────────────────
  const vendorColumns = useMemo(
    () => [
      {
        key: "vendor",
        label: "Vendor",
        width: 180,
        filterable: true,
        sortable: true,
        searchable: true,
      },
      {
        key: "client",
        label: "Client",
        width: 160,
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
        render: (row) => (
          <Chip
            label={row.employmentType || "—"}
            size="small"
            variant="outlined"
          />
        ),
      },
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
      {
        key: "existingValue",
        label: "Existing Value",
        width: 140,
        filterable: true,
        sortable: true,
        searchable: true,
        align: "right",
        render: (row) => row.existingValue ?? "—",
      },
      {
        key: "newValue",
        label: "New Value",
        width: 140,
        filterable: true,
        sortable: true,
        searchable: true,
        align: "right",
        render: (row) => row.newValue ?? "—",
      },
    ],
    []
  );

  const isOverAll = activeTab === "all";
  const invoiceColumns =
    isOverAll && overAllView === "vendor" ? vendorColumns : candidateColumns;

  const handleTabChange = (event, nextValue) => {
    // Prevent deselection — MUI passes null when clicking the active button
    if (nextValue !== null) setActiveTab(nextValue);
  };

  const handleOverAllViewChange = (event, nextView) => {
    if (nextView !== null) setOverAllView(nextView);
  };

  const activeTabLabel =
    activeTab === "all" ? "OverAll" : MONTH_LABELS[activeTab - 1];

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Year selector — left aligned */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          justifyContent: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="invoice-year-label">Year</InputLabel>
          <Select
            labelId="invoice-year-label"
            value={selectedYear}
            label="Year"
            onChange={(event) => setSelectedYear(event.target.value)}
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

      {/* Month + OverAll toggle buttons */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "4px",
          flexWrap: "wrap",
        }}
      >
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={handleTabChange}
          aria-label="invoice month"
          size="medium"
          sx={{ flexWrap: "wrap" }}
        >
          {INVOICE_TABS.map((tab) => (
            <ToggleButton
              key={tab.value}
              value={tab.value}
              aria-label={tab.label}
              sx={{
                px: 3,
                fontWeight: activeTab === tab.value ? "bold" : "normal",
                backgroundColor:
                  activeTab === tab.value
                    ? theme.palette.primary.main
                    : "inherit",
                color:
                  activeTab === tab.value
                    ? theme.palette.primary.contrastText
                    : theme.palette.primary.main,
                "&:hover": {
                  backgroundColor:
                    activeTab === tab.value
                      ? theme.palette.primary.dark
                      : theme.palette.action.hover,
                },
              }}
            >
              {tab.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/*
        ── Table wrapper ────────────────────────────────────────────────
        Wrapped in position:relative so we can absolutely position the
        Candidate/Vendor toggle over the table's own header (which already
        renders the title). This keeps DataTablePaginated untouched.
      */}
      <Box sx={{ position: "relative", overflow: "auto" }}>
        {isOverAll && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 64, // matches typical table header height
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
              pointerEvents: "none", // let clicks pass through empty area
            }}
          >
            <ToggleButtonGroup
              value={overAllView}
              exclusive
              onChange={handleOverAllViewChange}
              aria-label="invoice overall view"
              size="small"
              sx={{
                pointerEvents: "auto", // re-enable clicks on the buttons
                backgroundColor: "#fff",
                borderRadius: 2,
                boxShadow: 1,
                "& .MuiToggleButton-root": {
                  px: 2.5,
                  py: 0.5,
                  textTransform: "none",
                  fontWeight: 600,
                  border: `1px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="candidate" aria-label="candidate view">
                Candidate
              </ToggleButton>
              <ToggleButton value="vendor" aria-label="vendor view">
                Vendor
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        <DataTablePaginated
          title={`Invoice ${activeTabLabel} ${selectedYear}`}
          data={invoiceTableRows}
          columns={invoiceColumns}
          loading={loading}
          enableSelection={false}
          uniqueId="id"
          refreshData={() =>
            fetchInvoiceData(selectedYear, activeTab, overAllView)
          }
          enableExport
          defaultRowsPerPage={10}
        />
      </Box>
    </Box>
  );
};

export default Invoice;