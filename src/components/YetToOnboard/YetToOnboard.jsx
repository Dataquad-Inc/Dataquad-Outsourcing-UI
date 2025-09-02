import React, { useEffect, useCallback, useState } from "react";
import { Box, Button } from "@mui/material";
import { useSelector } from "react-redux";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns from "../Hotlist/hotListColumns";
import { hotlistAPI } from "../../utils/api";

import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "../../utils/toastUtils";

const YetToOnboard = React.memo(() => {
  const { userId, role } = useSelector((state) => state.auth);

  const [consultants, setConsultants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page, // 0-based index (backend should handle conversion if needed)
        size: rowsPerPage,
        keyword: search,
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
  }, [page, rowsPerPage, search, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleEdit = useCallback((row) => {
    console.log("Edit consultant:", row);
  }, []);

  const handleDelete = useCallback((row) => {
    console.log("Delete consultant:", row);
  }, []);

  const handleNavigate = useCallback((consultantId) => {
    console.log("Navigate to consultant:", consultantId);
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
            textTransform: "none", // keep normal casing
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
      <CustomDataTable
        title="Yet To Onboard"
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
      />
    </Box>
  );
});

export default YetToOnboard;
