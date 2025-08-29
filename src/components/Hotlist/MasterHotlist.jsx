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
  const { userId } = useSelector((state) => state.auth);

  const [consultants, setConsultants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [refreshKey, setRefreshKey] = useState(0);

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
      };

      const result = await hotlistAPI.getAllConsultants(params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      showInfoToast("Consultants loaded successfully ✅");
    } catch (err) {
      console.error("Error fetching consultants:", err);
      showErrorToast("Failed to load consultants ❌");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- CRUD Handlers ---------------- */
  const handleEdit = useCallback((row) => {
    // Keep all necessary data for editing, including consultantId
    const editData = {
      ...row,
      consultantId: row.consultantId, // Ensure consultantId is preserved
    };

    // Remove timestamp fields that shouldn't be edited
    const {
      teamleadName,
      recruiterName,
      consultantAddedTimeStamp,
      updatedTimeStamp,
      ...cleanEditData
    } = editData;

    console.log("Setting edit data (MasterHotlist):", cleanEditData); // Debug log
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    console.log("Cancel button clicked (MasterHotlist)"); // Debug log
    setShowCreateForm(false);
    setEditingConsultant(null);
  }, []);

  const handleFormSuccess = useCallback((data, action) => {
    showSuccessToast(
      action === "create"
        ? "Consultant created successfully 🎉"
        : "Consultant updated successfully ✨"
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
        showSuccessToast(result.message || "Consultant deleted 🗑️");
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Delete error:", error);
        showErrorToast("Failed to delete consultant ❌");
      }
    };
    showDeleteConfirm(deleteConsultantAction, row.name || "this consultant");
  }, []);

  const handleNavigate = (consultantId) => {
    navigate(`/dashboard/hotlist/master/${consultantId}`);
  };

  /** ---------------- Columns ---------------- */
  const columns = getHotListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    loading,
  });

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
          onCancel={handleFormCancel} // Add explicit onCancel prop
          onSuccess={handleFormSuccess}
          initialValues={editingConsultant} // Changed from editingConsultant to initialValues
        />
      )}
    </Box>
  );
});

export default MasterHotlist;
