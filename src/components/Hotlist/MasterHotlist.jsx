import React, { useEffect, useCallback, useState } from "react";
import { useTheme, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns from "./hotListColumns";
import CreateConsultant from "./CreateConsultant";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { hotlistAPI } from "../../utils/api";
import { useSelector } from "react-redux";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const MasterHotlist = React.memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userId, role } = useSelector((state) => state.auth);

  const [consultants, setConsultants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

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

      const result = await hotlistAPI.getAllConsultants(params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      // Extract filter options from the data if not already set
      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }

      showInfoToast("Consultants loaded successfully ");
    } catch (err) {
      console.error("Error fetching consultants:", err);
      showErrorToast("Failed to load consultants ");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    filters,
    filterOptions,
    extractFilterOptionsFromData,
  ]);

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

  /** ---------------- CRUD Handlers ---------------- */
  const handleEdit = useCallback((row) => {
    const editData = {
      ...row,
      consultantId: row.consultantId,
    };

    const {
      teamleadName,
      recruiterName,
      consultantAddedTimeStamp,
      updatedTimeStamp,
      ...cleanEditData
    } = editData;

    console.log("Setting edit data (MasterHotlist):", cleanEditData);
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    console.log("Cancel button clicked (MasterHotlist)");
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

  /** ---------------- Delete ---------------- */
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

  const handleNavigate = (consultantId) => {
    navigate(`/dashboard/hotlist/master/${consultantId}`);
  };

  const handleMoveToYetToOnboard = useCallback(async (row) => {
    try {
      const result = await hotlistAPI.moveToYetToOnboard(row.consultantId);
      showSuccessToast(result.message || "Consultant moved to hotlist");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Move error:", error);
      showErrorToast("Failed to move consultant to hotlist");
    }
  }, []);

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
      id: "Yet-To-OnBoard",
      label: "Move Yet-To-OnBoard",
      width: 180,
      render: (_, row) => (
        <Button
          variant="text"
          color="primary"
          disabled={loading}
          onClick={() => handleMoveToYetToOnboard(row)}
          sx={{
            textTransform: "none",
            minWidth: 180,
          }}
        >
          Move Yet-To-OnBoard
        </Button>
      ),
    },
  ];

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <CustomDataTable
          title="Grand Hotlist"
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

export default MasterHotlist;
