import React, { useEffect, useCallback, useState } from "react";
import { useTheme, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRTRListColumns from "./rtrListColumns";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { rightToRepresentAPI } from "../../utils/api";
import { useSelector } from "react-redux";

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
  const { userId, role } = useSelector((state) => state.auth);

  const [rtrList, setRtrList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [refreshKey, setRefreshKey] = useState(0);

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

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build filter parameters
      const filterParams = {};
      Object.entries(filters).forEach(([key, filter]) => {
        if (filter.value) {
          if (filter.type === "dateRange") {
            if (filter.value.from)
              filterParams[`${key}From`] = filter.value.from;
            if (filter.value.to) filterParams[`${key}To`] = filter.value.to;
          } else {
            filterParams[key] = filter.value;
          }
        }
      });

      const params = {
        page,
        size: rowsPerPage,
        ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
        ...filterParams,
      };

      const result = await rightToRepresentAPI.getAllRTR(params);

      setRtrList(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      // Extract filter options from the data if not already set
      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }
    } catch (err) {
      console.error("Error fetching RTR list:", err);
      showErrorToast("Failed to load RTR list");
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
      // Extract unique values for each filterable field
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

    // Sort options alphabetically
    Object.keys(options).forEach((field) => {
      options[field].sort((a, b) => a.label?.localeCompare(b.label || "") || 0);
    });

    setFilterOptions(options);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  /** ---------------- CRUD Handlers ---------------- */
  const handleEdit = useCallback(
    (row) => {
      // Navigate to RTR edit form with rtrId
      navigate(`/dashboard/rtr/rtr-form/${row.rtrId}`);
    },
    [navigate]
  );

  const handleView = useCallback(
    (row) => {
      // Navigate to RTR view details (you can create a separate view component)
      console.log("View RTR:", row);
      // For now, just navigate to edit
      navigate(`/dashboard/rtr/rtr-form/${row.rtrId}`);
    },
    [navigate]
  );

  /** ---------------- Delete ---------------- */
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
      // Navigate to RTR details/edit page
      navigate(`/dashboard/rtr/rtr-list`);
    },
    [navigate]
  );

  /** ---------------- Columns ---------------- */
  const columns = getRTRListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    handleView,
    loading,
    userRole: role,
    userId,
    filterOptions,
  });

  /** ---------------- Render ---------------- */
  return (
    <Box>
      <CustomDataTable
        title="RTR List"
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
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        onFiltersChange={handleFiltersChange}
      />
    </Box>
  );
});

export default RtrList;