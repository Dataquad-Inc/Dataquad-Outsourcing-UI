import React, { useEffect, useCallback, useState } from "react";
import { useTheme, Box } from "@mui/material";
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

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const TeamConsultantsHotlist = React.memo(() => {
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

  // NEW: filters state
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  /** ---------------- Fetch Filter Options ---------------- */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const result = await hotlistAPI.getFilterOptions();
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
      });
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build filter params
      const filterParams = {};
      Object.entries(filters).forEach(([key, filter]) => {
        if (filter.value) {
          if (filter.type === "dateRange") {
            if (filter.value.from) filterParams[`${key}From`] = filter.value.from;
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

      const result = await hotlistAPI.getTeamConsultants(userId, params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      showInfoToast("Consultants loaded successfully ");
    } catch (err) {
      console.error("Error fetching consultants:", err);
      showErrorToast("Failed to load consultants ");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, userId, debouncedSearch, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

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
        ? "Consultant created successfully "
        : "Consultant updated successfully "
    );
    setShowCreateForm(false);
    setEditingConsultant(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  /** ---------------- Delete ---------------- */
  const handleDelete = useCallback((row) => {
    const deleteConsultantAction = async () => {
      try {
        const result = await hotlistAPI.deleteConsultant(row.consultantId,userId);
        showSuccessToast(result.message || "Consultant deleted ");
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Delete error:", error);
        showErrorToast("Failed to delete consultant ");
      }
    };
    showDeleteConfirm(deleteConsultantAction, row.name || "this consultant");
  }, []);

  const handleNavigate = (consultantId) => {
    navigate(`/dashboard/hotlist/team-consultants/${consultantId}`);
  };

  /** ---------------- Columns ---------------- */
  const columns = getHotListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    loading,
    userRole: role,
    userId: userId,
    filterOptions, // Pass filter options here
  });

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <CustomDataTable
          title="Team Consultants Hotlist"
          columns={columns}
          rows={consultants}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          search={search}
          loading={loading}
          filters={filters}
          onFiltersChange={handleFiltersChange}
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

export default TeamConsultantsHotlist;
