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

  // Filters
  const [filters, setFilters] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  // State for edit form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        size: rowsPerPage,
        ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
        ...appliedFilters, // include applied filters
      };

      const result = await hotlistAPI.getYetToOnboardConsultants(params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);
      showInfoToast("Yet-to-onboard consultants loaded successfully");
    } catch (err) {
      console.error("Error fetching consultants:", err);
      showErrorToast("Failed to load consultants");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, appliedFilters, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  /** ---------------- Filter Handlers ---------------- */
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setPage(0);
  }, [filters]);

  const clearFilter = useCallback((field) => {
    setFilters((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    setAppliedFilters((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    setPage(0);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
    setPage(0);
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
          appliedFilters={appliedFilters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClearFilter={clearFilter}
          onClearAllFilters={clearAllFilters}
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
