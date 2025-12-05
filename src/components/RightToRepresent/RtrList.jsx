import React, { useEffect, useCallback, useState } from "react";
import { useTheme, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRTRListColumns from "./rtrListColumns";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { rightToRepresentAPI } from "../../utils/api";
import { useSelector } from "react-redux";
import ScheduleInterviewForm from "./ScheduleInterviewForm";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const RtrList = React.memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userId, role ,userName} = useSelector((state) => state.auth);

  const [rtrList, setRtrList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState("default");

  // Schedule Interview Dialog State
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [selectedRtr, setSelectedRtr] = useState(null);

  // Initialize filters from localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem("rtr_list_filters");
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading filters:", error);
      return {};
    }
  });

  const [filterOptions, setFilterOptions] = useState({});

  const formatLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build filter parameters - FIXED: Proper date range handling
      const filterParams = {};
      Object.entries(filters).forEach(([key, filter]) => {

        // ✅ FIXED createdAt date range handling
        if (key === "createdAt" && filter.type === "dateRange") {
          const fromDate = filter?.value?.from
            ? formatLocalDate(filter.value.from)
            : null;

          const toDate = filter?.value?.to
            ? formatLocalDate(filter.value.to)
            : null;

          if (fromDate) filterParams["fromDate"] = fromDate;
          if (toDate) filterParams["toDate"] = toDate;

          return; // prevent normal flow
        }

        // normal filters
        if (filter.value) {
          filterParams[key] = filter.value;
        }
      });


      const params = {
        page,
        size: rowsPerPage,
        ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
        ...filterParams,
      };

      console.log("🔍 FILTER DEBUG ================");
      console.log("Active Filters:", filters);
      console.log("Filter Params:", filterParams);
      console.log("Final API Params:", params);

      let result;
      if (role === "SUPERADMIN" || role === "ADMIN") {
        result = await rightToRepresentAPI.getAllRTR(params);
      } else if (role === "SALESEXECUTIVE" || role === "GRANDSALES") {
        result = await rightToRepresentAPI.getSalesRtr(userId, params);
      } else if (role === "TEAMLEAD") {
        result = await rightToRepresentAPI.getTeamLeadRtr(userId, params);
      }

      console.log("📊 RESPONSE DEBUG ==============");
      console.log("API Response:", result?.data);
      console.log("Total Elements:", result?.data?.totalElements);
      console.log("Content Length:", result?.data?.content?.length);

      // FIXED: Always update state with response data
      if (result?.data) {
        const newContent = result.data.content || [];
        const newTotal = result.data.totalElements || 0;

        setRtrList(newContent);
        setTotal(newTotal);

        console.log("✅ STATE UPDATED:", {
          contentCount: newContent.length,
          totalElements: newTotal
        });
      } else {
        setRtrList([]);
        setTotal(0);
      }

    } catch (err) {
      console.error("❌ Error fetching RTR list:", err);
      showErrorToast("Failed to load RTR list");
      // FIXED: Clear data on error
      setRtrList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, filters, role, userId]);

  // Add this useEffect to monitor state changes
  useEffect(() => {
    console.log("🔄 STATE UPDATE:", {
      rtrListCount: rtrList.length,
      total,
      page,
      rowsPerPage,
      filtersCount: Object.keys(filters).length,
      filters
    });
  }, [rtrList, total, page, rowsPerPage, filters]);

  const fetchTodayRtr = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams = {};
      Object.entries(filters).forEach(([key, filter]) => {
        if (filter.value) {
          if (filter.type === "dateRange") {
            if (filter.value.from)
              filterParams[`${key}From`] = filter.value.from;
            if (filter.value.to)
              filterParams[`${key}To`] = filter.value.to;
          } else {
            filterParams[key] = filter.value;
          }
        }
      });

      const date = new Date().toISOString().split("T")[0];

      const params = {
        page,
        size: rowsPerPage,
        date: date,
        ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
        ...filterParams,
      };

      let result;
      if (role === "SUPERADMIN" ) {
        result = await rightToRepresentAPI.getTodaysRtr(params);
      } else if (role === "TEAMLEAD") {
        result = await rightToRepresentAPI.getTodaysTeamRtr(userId, params);
      }
      else if (role === "SALESEXECUTIVE") {
        result = await rightToRepresentAPI.getTodaysSalesRtr(userId, params);
      }

      // FIXED: Always update state
      setRtrList(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }

    } catch (err) {
      console.error("Error fetching today's RTR list:", err);
      showErrorToast("Failed to load today's RTR list");
      // FIXED: Clear data on error
      setRtrList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, filters, filterOptions]);

  // Extract filter options from RTR data
  const extractFilterOptionsFromData = useCallback((data) => {
    const options = {
      technology: [],
      rtrStatus: [],
      salesExecutive: [],
      vendorName: [],
      implementationPartner: [],
      clientName: [],
    };

    data.forEach((item) => {
      Object.keys(options).forEach((field) => {
        const value = item[field];
        if (value && !options[field].find((opt) => opt.value === value)) {
          options[field].push({
            value: value,
            label: value,
          });
        }
      });
    });

    Object.keys(options).forEach((field) => {
      options[field].sort((a, b) => a.label?.localeCompare(b.label || "") || 0);
    });

    setFilterOptions(options);
  }, []);

  // FIXED: Proper dependency array to trigger re-fetch on filter changes
  useEffect(() => {
    if (viewMode === "today") {
      fetchTodayRtr();
    } else {
      fetchData();
    }
  }, [viewMode, page, rowsPerPage, debouncedSearch, filters, refreshKey]);

  const handleTodayRtrClick = useCallback(() => {
    setViewMode("today");
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    console.log("🎯 FILTERS CHANGED:", newFilters);
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  /** ---------------- Schedule Interview Handlers ---------------- */
  const handleScheduleInterview = useCallback((row) => {
    setSelectedRtr(row);
    setScheduleInterviewOpen(true);
  }, []);

  const handleInterviewScheduled = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    showSuccessToast("Interview scheduled successfully!");
  }, []);

  const handleCloseScheduleInterview = useCallback(() => {
    setScheduleInterviewOpen(false);
    setSelectedRtr(null);
  }, []);

  /** ---------------- CRUD Handlers ---------------- */
  const handleEdit = useCallback(
    (row) => {
      navigate(`/dashboard/rtr/rtr-form/${row.rtrId}`);
    },
    [navigate]
  );

  const handleView = useCallback(
    (row) => {
      console.log("View RTR:", row);
      navigate(`/dashboard/rtr/rtr-form/${row.rtrId}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (row) => {
      const deleteRTRAction = async () => {
        try {
          const result = await rightToRepresentAPI.deleteRTR(row.rtrId, userId);
          showSuccessToast(result.message || "RTR record deleted successfully");
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("Delete error:", error);
          showErrorToast("Failed to delete RTR record");
        }
      };
      showDeleteConfirm(
        deleteRTRAction,
        `RTR record for ${row.consultantName || "this consultant"}`
      );
    },
    [userId]
  );

  const handleNavigate = useCallback(
    (rtrId) => {
      navigate(`/dashboard/rtr/rtr-list`);
    },
    [navigate]
  );

  const handleInterviewSuccess = () => {
    navigate("/dashboard/us-interviews");
  };

  /** ---------------- Columns ---------------- */
  const columns = getRTRListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    handleView,
    handleScheduleInterview,
    loading,
    userRole: role,
    userId,
    filterOptions,
  });

  const UserName=rtrList.map((item)=>item.createdBy)

  console.log("-----createdby-----",UserName)

  /** ---------------- Render ---------------- */
  return (
    <Box>
      <ToggleButtonGroup
        color="primary"
        exclusive
        size="small"
        sx={{ margin: '10px' }}
        value={viewMode}
      >
        <ToggleButton
          value="default"
          onClick={() => setViewMode("default")}
          sx={{
            px: 3,
            fontWeight: 'bold',
            backgroundColor: viewMode === "default" ? theme.palette.primary.main : 'inherit',
            color: viewMode === "default" ? theme.palette.primary.contrastText : theme.palette.primary.main,
          }}
          size="medium"
        >
          All RTR
        </ToggleButton>
        <ToggleButton
          value="today"
          onClick={handleTodayRtrClick}
          sx={{
            px: 3,
            fontWeight: 'bold',
            backgroundColor: viewMode === "today" ? theme.palette.primary.main : 'inherit',
            color: viewMode === "today" ? theme.palette.primary.contrastText : theme.palette.primary.main,
          }}
          size="medium"
        >
          Today's RTR
        </ToggleButton>

      </ToggleButtonGroup>

      <CustomDataTable
        title={viewMode === "today" ? "Today's RTR List" : "RTR List"}
        columns={columns}
        rows={rtrList}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={loading}
        filters={filters}
        filterStorageKey="rtr_list_filters"
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onSearchChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        onSearchClear={() => {
          setSearch("");
          setPage(0);
        }}
        onRefresh={handleRefresh}
        onFiltersChange={handleFiltersChange}
      />

      <ScheduleInterviewForm
        open={scheduleInterviewOpen}
        onClose={handleCloseScheduleInterview}
        rtrId={selectedRtr?.rtrId}
        consultantName={selectedRtr?.consultantName}
        onSuccess={handleInterviewSuccess}
      />
    </Box>
  );
});

export default RtrList;