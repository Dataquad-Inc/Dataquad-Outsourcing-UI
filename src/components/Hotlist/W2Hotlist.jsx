import React, { useEffect, useCallback, useState } from "react";
import { useTheme, Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
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

const W2Hotlist = React.memo(() => {
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

  // Status filter state
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Initialize filters from localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem("w2_hotlist_filters");
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading filters:", error);
      return {};
    }
  });

  const [filterOptions, setFilterOptions] = useState({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
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

      // Add status filter to params if selected
      if (statusFilter) {
        filterParams["statusFilter"] = statusFilter;
      }

      const params = {
        page,
        size: rowsPerPage,
        ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
        ...filterParams,
      };

      const result = await hotlistAPI.getW2Hotlist(params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      // Extract filter options from the data if not already set
      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }
    } catch (err) {
      console.error("Error fetching W2 consultants:", err);
      showErrorToast("Failed to load W2 consultants ");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    filters,
    statusFilter,
    filterOptions,
    extractFilterOptionsFromData,
  ]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- Status Filter Handler ---------------- */
  const handleStatusFilterChange = useCallback((event, newStatus) => {
    setStatusFilter(newStatus);
    setPage(0); // Reset to first page when status filter changes
  }, []);

  /** ---------------- Clear Status Filter ---------------- */
  const handleClearStatusFilter = useCallback(() => {
    setStatusFilter("");
    setPage(0);
  }, []);

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

    console.log("Setting edit data (W2Hotlist):", cleanEditData);
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    console.log("Cancel button clicked (W2Hotlist)");
    setShowCreateForm(false);
    setEditingConsultant(null);
  }, []);

  const handleFormSuccess = useCallback((data, action) => {
    showSuccessToast(
      action === "create"
        ? "W2 Consultant created successfully "
        : "W2 Consultant updated successfully "
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
          showSuccessToast(result.message || "W2 Consultant deleted ");
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("Delete error:", error);
          showErrorToast("Failed to delete W2 consultant ");
        }
      };
      showDeleteConfirm(deleteConsultantAction, row.name || "this W2 consultant");
    },
    [userId]
  );

  const handleNavigate = (consultantId) => {
    navigate(`/dashboard/hotlist/w2/${consultantId}`);
  };

  const handleMoveToMaster = useCallback(async (row) => {
    try {
      const result = await hotlistAPI.moveToMasterHotlist(row.consultantId);
      showSuccessToast(result.message || "Consultant moved to master hotlist");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Move error:", error);
      showErrorToast("Failed to move consultant to master hotlist");
    }
  }, []);

  const handleNavigateRTR = (row) => {
    navigate("/dashboard/rtr/rtr-form", {
      state: {
        consultantId: row.consultantId,
        consultantName: row.name,
      },
    });
  };

  /** ---------------- Columns ---------------- */
  const columns = [
    ...getHotListColumns({
      handleNavigate,
      handleEdit,
      handleDelete,
      handleNavigateRTR,
      loading,
      userRole: role,
      userId,
      filterOptions,
    }),
    // {
    //   id: "move-to-master",
    //   label: "Move to Master",
    //   width: 150,
    //   render: (_, row) => (
    //     <Button
    //       variant="text"
    //       color="primary"
    //       disabled={loading}
    //       onClick={() => handleMoveToMaster(row)}
    //       sx={{
    //         textTransform: "none",
    //         minWidth: 150,
    //       }}
    //     >
    //       Move to Master
    //     </Button>
    //   ),
    // },
  ];

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <>
          {/* Status Filter Toggle Buttons */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', margin: '10px' }}>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusFilterChange}
              aria-label="consultant status"
              size="small"
            >
              <ToggleButton 
                value="ACTIVE" 
                aria-label="active"
                sx={{ 
                  px: 3,
                  fontWeight: statusFilter === 'ACTIVE' ? 'bold' : 'normal',
                  backgroundColor: statusFilter === 'ACTIVE' ? theme.palette.primary.main : 'inherit',
                  color: statusFilter === 'ACTIVE' ? theme.palette.primary.contrastText : theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: statusFilter === 'ACTIVE' ? theme.palette.primary.dark : theme.palette.action.hover,
                  }
                }}
              >
                ACTIVE
              </ToggleButton>
              <ToggleButton 
                value="INACTIVE" 
                aria-label="inactive"
                sx={{ 
                  px: 3,
                  fontWeight: statusFilter === 'INACTIVE' ? 'bold' : 'normal',
                  backgroundColor: statusFilter === 'INACTIVE' ? theme.palette.primary.main : 'inherit',
                  color: statusFilter === 'INACTIVE' ? theme.palette.primary.contrastText : theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: statusFilter === 'INACTIVE' ? theme.palette.primary.dark : theme.palette.action.hover,
                  }
                }}
              >
                INACTIVE
              </ToggleButton>
            </ToggleButtonGroup>
            
            {/* Clear Status Filter Button */}
            {statusFilter && (
              <Button
                onClick={handleClearStatusFilter}
                variant="outlined"
                size="small"
                sx={{
                  ml: 2,
                  textTransform: 'none'
                }}
              >
                Clear Status Filter
              </Button>
            )}
          </Box>

          <CustomDataTable
            title="W2 Hotlist"
            columns={columns}
            rows={consultants}
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            search={search}
            loading={loading}
            filters={filters}
            filterStorageKey="w2_hotlist_filters"
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
        </>
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

export default W2Hotlist;