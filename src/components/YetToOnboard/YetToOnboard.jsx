import React, { useEffect, useCallback, useState } from "react";
import { Box, Button } from "@mui/material";
import { useSelector } from "react-redux";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns from "../Hotlist/hotListColumns";
import CreateConsultant from "../Hotlist/CreateConsultant";
import { hotlistAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";

import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";

// Debounce hook (for search)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const YetToOnboard = React.memo(() => {
  const { userId, role } = useSelector((state) => state.auth);

  const [consultants, setConsultants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  // Advanced Filters (similar to MasterHotlist)
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  // State for edit form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      // You can either call a dedicated API endpoint for filter options
      // or extract them from the existing data
      const result = await hotlistAPI.getFilterOptions();
      
      if (result?.data) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // Set default empty options if API fails
      setFilterOptions({
        technology: [],
        teamleadName: [],
        salesExecutive: [],
        recruiterName: [],
        reference: [],
        payroll: [],
        marketingVisa: [],
        actualVisa: [],
      });
    }
  }, []);

  // Extract filter options from consultants data
  const extractFilterOptionsFromData = useCallback((data) => {
    const options = {
      technology: [],
      teamleadName: [],
      salesExecutive: [],
      recruiterName: [],
      reference: [],
      payroll: [],
      marketingVisa: [],
      actualVisa: [],
    };

    data.forEach((consultant) => {
      // Extract unique values for each filterable field
      Object.keys(options).forEach((field) => {
        const value = consultant[field];
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

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build filter parameters (similar to MasterHotlist)
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
        ...filterParams, // include filter parameters
      };

      const result = await hotlistAPI.getYetToOnboardConsultants(params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      // Extract filter options from the data if not already set
      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }

      showInfoToast("Yet-to-onboard consultants loaded successfully");
    } catch (err) {
      console.error("Error fetching consultants:", err);
      showErrorToast("Failed to load consultants");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, filters, filterOptions, extractFilterOptionsFromData]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  /** ---------------- Edit Handlers ---------------- */
  const handleEdit = useCallback((row) => {
    const editData = { ...row, consultantId: row.consultantId };

    const {
      teamleadName,
      recruiterName,
      consultantAddedTimeStamp,
      updatedTimeStamp,
      ...cleanEditData
    } = editData;

    console.log("Setting edit data (YetToOnboard):", cleanEditData);
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    console.log("Cancel button clicked (YetToOnboard)");
    setShowCreateForm(false);
    setEditingConsultant(null);
  }, []);

  const handleFormSuccess = useCallback((data, action) => {
    showSuccessToast(
      action === "create"
        ? "Consultant created successfully "
        : "Consultant updated successfully "
    );
    setShowCreateForm(false);
    setEditingConsultant(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  /** ---------------- Actions ---------------- */
  const handleMoveToHotlist = useCallback(async (row) => {
    try {
      const result = await hotlistAPI.moveToHotlist(row.consultantId);
      showSuccessToast(result.message || "Consultant moved to hotlist");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Move error:", error);
      showErrorToast("Failed to move consultant to hotlist");
    }
  }, []);

  const handleDelete = useCallback(
    (row) => {
      const deleteConsultantAction = async () => {
        try {
          const result = await hotlistAPI.deleteConsultant(
            row.consultantId,
            userId
          );
          showSuccessToast(result.message || "Consultant deleted ");
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("Delete error:", error);
          showErrorToast("Failed to delete consultant ");
        }
      };
      showDeleteConfirm(deleteConsultantAction, row.name || "this consultant");
    },
    [userId]
  );

  const handleNavigate = useCallback(
    (consultantId) => {
      navigate(`/dashboard/hotlist/consultants/${consultantId}`);
    },
    [navigate]
  );

  /** ---------------- Columns ---------------- */
  const columns = [
    ...getHotListColumns({
      handleNavigate,
      handleEdit,
      handleDelete,
      loading,
      userRole: role,
      userId,
      filterOptions, // Pass filter options to columns (same as MasterHotlist)
    }),
    {
      id: "moveToHotlist",
      label: "Move To Hotlist",
      width: 180,
      render: (_, row) => (
        <Button
          variant="outlined"
          color="primary"
          disabled={loading}
          onClick={() => handleMoveToHotlist(row)}
          sx={{
            textTransform: "none",
            minWidth: 180,
          }}
        >
          Move to Hotlist
        </Button>
      ),
    },
  ];

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <CustomDataTable
          title="Yet To Onboard"
          columns={columns}
          rows={consultants}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          search={search}
          loading={loading}
          filters={filters}
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
          onCreateNew={handleCreateNew}
        />
      ) : (
        <CreateConsultant
          onClose={handleFormCancel}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
          initialValues={editingConsultant}
        />
      )}
    </Box>
  );
});

export default YetToOnboard;