import React, { useEffect, useCallback, useState, useRef } from "react";
import { useTheme, Box, Button, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns from "./hotListColumns";
import CreateConsultant from "./CreateConsultant";
import {
  showErrorToast,
  showSuccessToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { hotlistAPI } from "../../utils/api";
import { useSelector } from "react-redux";
import { AssignmentTurnedIn } from "@mui/icons-material";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const DirectHotlistConsultants = React.memo(() => {
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

  // Status filter state for direct hotlist
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Initialize filters from localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem("directhotlist_filters");
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading filters:", error);
      return {};
    }
  });

  const [filterOptions, setFilterOptions] = useState({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  // Use refs to track fetch state
  const isFetching = useRef(false);
  const initialFetchDone = useRef(false);
  const prevDebouncedSearch = useRef("");
  const prevFilters = useRef({});
  const prevStatusFilter = useRef("ACTIVE");
  const prevPage = useRef(0);
  const prevRowsPerPage = useRef(20);

  // Fetch filter options for direct hotlist consultants
  const fetchFilterOptions = useCallback(async () => {
    try {
      const result = await hotlistAPI.getGuestHouseFilterOptions?.() || await hotlistAPI.getFilterOptions();

      if (result?.data) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setFilterOptions({
        technology: [],
        teamleadName: [],
        salesExecutive: [],
        recruiterName: [],
        reference: [],
        payroll: [],
        marketingVisa: [],
        actualVisa: [],
        guestHouseStatus: [],
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
      guestHouseStatus: [],
    };

    data.forEach((consultant) => {
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

    Object.keys(options).forEach((field) => {
      options[field].sort((a, b) => a.label?.localeCompare(b.label || "") || 0);
    });

    setFilterOptions(options);
  }, []);

  /** ---------------- Fetch Direct Hotlist Data ---------------- */
  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
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

      // Use direct hotlist specific API endpoint
      const result = await hotlistAPI.getDirectHotlistConsultants?.(params) || 
                    await hotlistAPI.getAllConsultants({
                      ...params,
                      directHotlistOnly: true
                    });

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      // Extract filter options from the data if not already set
      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }
      
    } catch (err) {
      console.error("Error fetching direct hotlist consultants:", err);
      showErrorToast("Failed to load direct hotlist consultants");
    } finally {
      setLoading(false);
      isFetching.current = false;
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

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch data only when dependencies change
  useEffect(() => {
    // Check if it's the initial mount
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchData();
      return;
    }

    // Check if any dependency actually changed
    const searchChanged = prevDebouncedSearch.current !== debouncedSearch;
    const filtersChanged = JSON.stringify(prevFilters.current) !== JSON.stringify(filters);
    const statusChanged = prevStatusFilter.current !== statusFilter;
    const pageChanged = prevPage.current !== page;
    const rowsChanged = prevRowsPerPage.current !== rowsPerPage;
    const refreshTriggered = refreshKey > 0;

    // Update refs with current values
    prevDebouncedSearch.current = debouncedSearch;
    prevFilters.current = filters;
    prevStatusFilter.current = statusFilter;
    prevPage.current = page;
    prevRowsPerPage.current = rowsPerPage;

    // Only fetch if something actually changed
    if (searchChanged || filtersChanged || statusChanged || pageChanged || rowsChanged || refreshTriggered) {
      fetchData();
    }
  }, [fetchData, refreshKey, debouncedSearch, filters, statusFilter, page, rowsPerPage]);

  /** ---------------- Status Filter Handler ---------------- */
  const handleStatusFilterChange = useCallback((event, newStatus) => {
    setStatusFilter(newStatus);
    setPage(0);
  }, []);

  /** ---------------- Clear Status Filter ---------------- */
  const handleClearStatusFilter = useCallback(() => {
    setStatusFilter("");
    setPage(0);
  }, []);

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0);
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

    console.log("Setting edit data (DirectHotlistConsultants):", cleanEditData);
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    console.log("Cancel button clicked (DirectHotlistConsultants)");
    setShowCreateForm(false);
    setEditingConsultant(null);
  }, []);

  const handleFormSuccess = useCallback((data, action) => {
    showSuccessToast(
      action === "create"
        ? "Direct hotlist consultant created successfully"
        : "Direct hotlist consultant updated successfully"
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
          const result = await hotlistAPI.deleteGuestHouseConsultant?.(
            row.consultantId,
            userId
          ) || await hotlistAPI.deleteConsultant(
            row.consultantId,
            userId
          );
          showSuccessToast(result.message || "Direct hotlist consultant deleted");
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("Delete error:", error);
          showErrorToast("Failed to delete direct hotlist consultant");
        }
      };
      showDeleteConfirm(deleteConsultantAction, row.name || "this direct hotlist consultant");
    },
    [userId]
  );

  const handleNavigate = (consultantId) => {
    navigate(`/dashboard/hotlist/direct/${consultantId}`);
  };

  const handleMoveToMasterHotlist = useCallback(async (row) => {
    try {
      const result = await hotlistAPI.moveToMasterHotlist?.(row.consultantId) ||
                    await hotlistAPI.updateConsultantStatus(row.consultantId, { 
                      status: "ACTIVE",
                      isGuestHouse: false 
                    });
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
    {
      id: "actions",
      width: 150,
      render: (_, row) => (
        <Tooltip title="Submit RTR">
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<AssignmentTurnedIn fontSize="small" />}
            onClick={() => handleNavigateRTR(row)}
            sx={{
              minWidth: "auto",
              px: 1.5,
              py: 0.5,
              fontSize: "0.75rem",
              textTransform: "none",
              whiteSpace: "nowrap",
              height: "32px",
            }}
          >
            Submit RTR
          </Button>
        </Tooltip>
      )
    },
    ...getHotListColumns({
      handleNavigate,
      handleEdit,
      handleDelete,
      handleNavigateRTR,
      handleMoveToMasterHotlist,
      loading,
      userRole: role,
      userId,
      filterOptions,
    }),
    {
      id: "move-to-master",
      label: "Move to Master",
      width: 180,
      render: (_, row) => (
        <Button
          variant="text"
          color="primary"
          disabled={loading}
          onClick={() => handleMoveToMasterHotlist(row)}
          sx={{
            textTransform: "none",
            minWidth: 180,
          }}
        >
          Move to Master Hotlist
        </Button>
      ),
    },
  ];

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <>
          {/* Status Filter Toggle Buttons */}
          <Box sx={{ 
            mb: 2, 
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center',
            margin: '10px' 
          }}>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusFilterChange}
              aria-label="direct hotlist consultant status"
              size="small"
            >
              <ToggleButton 
                value="ACTIVE" 
                aria-label="active"
                sx={{ 
                  px: 3,
                  fontWeight: statusFilter === 'ACTIVE' ? 'bold' : 'normal',
                  backgroundColor: statusFilter === 'ACTIVE' ? theme.palette.primary.main : 'inherit',
                  color: statusFilter === 'ACTIVE' ? theme.palette.common.white : theme.palette.primary.main,
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
                  color: statusFilter === 'INACTIVE' ? theme.palette.common.white : theme.palette.primary.main,
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
            title="Direct Hotlist Consultants"
            columns={columns}
            rows={consultants}
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            search={search}
            loading={loading}
            filters={filters}
            filterStorageKey="directhotlist_filters"
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
            createButtonText="Add Direct Hotlist Consultant"
          />
        </>
      ) : (
        <CreateConsultant
          onClose={handleFormCancel}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
          initialValues={editingConsultant}
          isGuestHouse={true}
        />
      )}
    </Box>
  );
});

export default DirectHotlistConsultants;