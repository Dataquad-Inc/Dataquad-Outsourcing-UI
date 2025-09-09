import React, { useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRequirementsColumns from "./requirementsColumns";
import { showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "../../ui-lib/ConfirmDialog"; // import your dialog

const RequirementsList = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  const { userId } = useSelector((state) => state.auth);

  // 🔹 Confirm Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "https://mymulya.com/api/us/requirements/allRequirements",
        {
          params: { page, size: rowsPerPage },
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      if (data.success && data.data) {
        setRequirements(data.data.content || []);
        setTotal(data.data.totalElements || 0);
      } else {
        showErrorToast(data.message || "Failed to load requirements");
        setRequirements([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching requirements:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to load requirements"
      );
      setRequirements([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  /** ---------------- Navigate ---------------- */
  const handleNagivateToReqProfile = (row) => {
    navigate(`/dashboard/us-requirements/${row.jobId}`);
  };

  /** ---------------- Download JD ---------------- */
  const handleDownloadJD = async (jobId) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-jd/${jobId}`,
        { method: "GET", headers: { Accept: "application/pdf" } }
      );

      if (!response.ok) throw new Error("Failed to download JD");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `JD-${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading JD:", error);
    }
  };

  /** ---------------- Delete with confirm ---------------- */
  const handleRequestDelete = (jobId) => {
    setDeleteJobId(jobId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!userId || !deleteJobId) return;

      await axios.delete(
        `https://mymulya.com/api/us/requirements/delete-requirement/${deleteJobId}?userId=${userId}`
      );

      setConfirmOpen(false);
      setDeleteJobId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting requirement:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to delete requirement"
      );
    }
  };

  /** ---------------- Columns ---------------- */
  const columns = getRequirementsColumns({
    handleNagivateToReqProfile,
    handleDownloadJD,
    handleDelete: handleRequestDelete, // 👈 open confirm dialog
    loading,
  });

  return (
    <>
      <CustomDataTable
        title="Job Requirements"
        columns={columns}
        rows={requirements}
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
      />

      {/* 🔹 Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Requirement"
        message="Are you sure you want to delete this requirement? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
      />
    </>
  );
};

export default RequirementsList;
