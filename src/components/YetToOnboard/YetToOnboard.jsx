import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  IconButton,
  CircularProgress,
  Tooltip,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns from "../Hotlist/hotListColumns";
import { AddCircleOutline } from "@mui/icons-material";
import { showSuccessToast } from "../../utils/toastUtils";

const YetToOnboard = ({ userRole = "RECRUITER", userId = null }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [movingConsultants, setMovingConsultants] = useState(new Set());
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 🔹 Fetch table data with better error handling
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        search: search.trim(),
      });

      const res = await fetch(
        `https://mymulya.com/hotlist/yetToOnBoardConsultants?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authentication headers if needed
            // "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setRows(data?.data?.content || []);
      setTotal(data?.data?.totalElements || 0);

      // Clear any previous error notifications
      if (notification.severity === "error") {
        setNotification((prev) => ({ ...prev, open: false }));
      }
    } catch (err) {
      console.error("Error fetching consultants:", err);
      setRows([]);
      setTotal(0);
      setNotification({
        open: true,
        message: "Failed to fetch consultants. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, notification.severity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔹 Move to Hotlist API with better UX
  const handleMoveToHotlist = async (row) => {
    if (!row?.consultantId) {
      setNotification({
        open: true,
        message: "Invalid consultant data",
        severity: "error",
      });
      return;
    }

    // Add consultant to moving set for individual loading state
    setMovingConsultants((prev) => new Set([...prev, row.consultantId]));

    try {
      const res = await fetch(
        `https://mymulya.com/hotlist/moveToHotlist/${row.consultantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // Add authentication headers if needed
            // "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        showSuccessToast("Consultant moved to hotlist successfully");
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`
        );
      }

      // ✅ Remove row directly for better UX (no refetch needed)
      setRows((prev) =>
        prev.filter((r) => r.consultantId !== row.consultantId)
      );
      setTotal((prev) => Math.max(0, prev - 1));

      setNotification({
        open: true,
        message: `${row.name || "Consultant"} moved to hotlist successfully!`,
        severity: "success",
      });
    } catch (err) {
      console.error("Error moving consultant:", err);
      setNotification({
        open: true,
        message: err.message || "Failed to move consultant to hotlist",
        severity: "error",
      });
    } finally {
      // Remove consultant from moving set
      setMovingConsultants((prev) => {
        const newSet = new Set(prev);
        newSet.delete(row.consultantId);
        return newSet;
      });
    }
  };

  // 🔹 Handle edit action
  const handleEdit = (row) => {
    // Implement edit logic here
    console.log("Edit consultant:", row);
    // You might navigate to an edit form or open a modal
  };

  // 🔹 Handle delete action
  const handleDelete = (row) => {
    // Implement delete logic here
    console.log("Delete consultant:", row);
    // You might show a confirmation dialog
  };

  // 🔹 Handle navigation to consultant details
  const handleNavigate = (consultantId) => {
    // Implement navigation logic here
    console.log("Navigate to consultant:", consultantId);
    // You might use React Router to navigate
  };

  // 🔹 Get columns with proper parameters
  const baseColumns = getHotListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    loading,
    userRole,
    userId,
  });

  // 🔹 Add custom "Move to Hotlist" column
  const columns = [
    ...baseColumns,
    {
      id: "moveToHotlist",
      label: "Move To Hotlist",
      width: 200,
      render: (_, row) => {
        const isMoving = movingConsultants.has(row.consultantId);

        return (
          <Tooltip title="Move consultant to hotlist">
            <span>
              {" "}
              {/* Span wrapper needed for tooltip on disabled button */}
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleMoveToHotlist(row)}
                disabled={loading || isMoving}
                startIcon={
                  isMoving ? (
                    <CircularProgress size={16} />
                  ) : (
                    <AddCircleOutline />
                  )
                }
                size="small"
                sx={{
                  minWidth: 120,
                  textTransform: "none",
                }}
              >
                {isMoving ? "Moving..." : "Move to Hotlist"}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  // 🔹 Close notification
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Global loading indicator */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Data table */}
      <CustomDataTable
        columns={columns}
        rows={rows}
        page={page}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        totalCount={total}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No consultants yet to onboard"
      />
    </Box>
  );
};

export default YetToOnboard;
