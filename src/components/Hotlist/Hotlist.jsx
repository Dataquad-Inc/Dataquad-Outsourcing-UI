import React, { useEffect, useCallback, useState } from "react";
import { Box, useTheme, Button, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns, { getW2HotlistColumns } from "./hotListColumns";
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

const HotList = React.memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userId, role } = useSelector((state) => state.auth);

  const [consultants, setConsultants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [refreshKey, setRefreshKey] = useState(0);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // filters
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  /** ---------------- Extract Filter Options from Data ---------------- */
  const extractFilterOptionsFromData = useCallback((data) => {
    const options = {
      technology: [],
      teamleadName: [],
      recruiterName: [],
      salesExecutive: [],
      reference: [],
      payroll: [],
      marketingVisa: [],
      actualVisa: [],
    };

    data.forEach((consultant) => {
      Object.keys(options).forEach((field) => {
        const value = consultant[field];
        if (value && !options[field].find((opt) => opt.value === value)) {
          options[field].push({ value, label: value });
        }
      });
    });

    Object.keys(options).forEach((field) => {
      options[field].sort((a, b) => a.label?.localeCompare(b.label || "") || 0);
    });

    setFilterOptions(options);
  }, []);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // build filter params
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

      let result = null;
      if (role === "SALESEXECUTIVE") {
        result = await hotlistAPI.getSalesExecConsultants(userId, params);
      } else {
        result = await hotlistAPI.getConsultantsByUserId(userId, params);
      }

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }

    } catch (err) {
      console.error("Error fetching hotlist:", err);
      showErrorToast("Failed to load hotlist");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    userId,
    debouncedSearch,
    filters,
    statusFilter,
    role,
    filterOptions,
    extractFilterOptionsFromData,
  ]);

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

  /** ---------------- Filter Handler ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  /** ---------------- CRUD Handlers ---------------- */
  const handleEdit = useCallback((row) => {
    const {
      teamleadName,
      recruiterName,
      consultantAddedTimeStamp,
      updatedTimeStamp,
      ...cleanEditData
    } = row;
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    setShowCreateForm(false);
    setEditingConsultant(null);
  }, []);

  const handleFormSuccess = useCallback((data, action) => {
    showSuccessToast(
      action === "create"
        ? "Consultant created successfully"
        : "Consultant updated successfully"
    );
    setShowCreateForm(false);
    setEditingConsultant(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  /** ---------------- Delete ---------------- */
  const handleDelete = useCallback((row) => {
    const deleteConsultantAction = async () => {
      try {
        const result = await hotlistAPI.deleteConsultant(row.consultantId, userId);
        showSuccessToast(result.message || "Consultant deleted");
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Delete error:", error);
        showErrorToast("Failed to delete consultant");
      }
    };
    showDeleteConfirm(deleteConsultantAction, row.name || "this consultant");
  }, [userId]);

  const handleNavigate = (consultantId) => {
    navigate(`/dashboard/hotlist/consultants/${consultantId}`);
  };

  /** ---------------- View Handler ---------------- */
  const handleView = useCallback((row) => {
    navigate(`/dashboard/hotlist/consultants/${row.consultantId}`);
  }, [navigate]);

  /** ---------------- RTR Handler ---------------- */
  const handleNavigateRTR = useCallback((row) => {
    navigate(`/dashboard/rtr/rtr-form`, {
      state: { 
        consultantId: row.consultantId,
        consultantName: row.name 
      }
    });
  }, [navigate]);

  /** ---------------- Columns ---------------- */
  const columns = [
    {
      id:"actions",
      width:150,
      render:(_,row)=>(
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
     ...getW2HotlistColumns({
      handleNavigate,
      handleEdit,
      handleDelete,
      handleNavigateRTR,
      loading,
      userRole: role,
      userId,
      filterOptions,
    }),
    //    {
    //   id: "Yet-To-OnBoard",
    //   label: "Move Yet-To-OnBoard",
    //   width: 180,
    //   render: (_, row) => (
    //     <Button
    //       variant="text"
    //       color="primary"
    //       disabled={loading}
    //       onClick={() => handleMoveToYetToOnboard(row)}
    //       sx={{
    //         textTransform: "none",
    //         minWidth: 180,
    //       }}
    //     >
    //       Move Yet-To-OnBoard
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
            title="My Hotlist"
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

export default HotList;