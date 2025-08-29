import React, { useEffect, useCallback, useState } from "react";
import { Box, useTheme } from "@mui/material";
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
import ConsultantProfile from "./ConsultantProfile";

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
  const [refreshKey, setRefreshKey] = useState(0);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, size: rowsPerPage, keyword: search };
      let result = null;
      if (role === "SALESEXECUTIVE") {
        result = await hotlistAPI.getSalesExecConsultants(userId, params);
      } else {
        result = await hotlistAPI.getConsultantsByUserId(userId, params);
      }

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);
      showInfoToast("Hotlist loaded successfully ");
    } catch (err) {
      console.error("Error fetching hotlist:", err);
      showErrorToast("Failed to load hotlist ");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, userId, search, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

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

    console.log("Setting edit data:", cleanEditData); // Debug log
    setEditingConsultant(cleanEditData);
    setShowCreateForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  }, []);

  const handleFormCancel = useCallback(() => {
    console.log("Cancel button clicked"); // Debug log
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
        const result = await hotlistAPI.deleteConsultant(row.consultantId);
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
    navigate(`/dashboard/hotlist/consultants/${consultantId}`);
  };

  /** ---------------- Columns ---------------- */
  const columns = getHotListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    loading,
    userRole: role, // Pass user role
    userId: userId, // Pass user ID
  });

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <CustomDataTable
          title="My Hotlist"
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
          initialValues={editingConsultant}
        />
      )}
    </Box>
  );
});

export default HotList;