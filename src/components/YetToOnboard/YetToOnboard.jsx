import React, { useEffect, useCallback, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
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
import { ErrorMessage } from "formik";

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

  // Advanced Filters (similar to MasterHotlist)
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  // State for edit form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);

  // State for approval dialog
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    consultant: null,
    isSubmitting: false,
  });

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      // You can either call a dedicated API endpoint for filter options
      // or extract them from the existing data
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

      // Build filter parameters (similar to MasterHotlist)
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

      const params = {
        page,
        size: rowsPerPage,
        ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
        ...filterParams, // include filter parameters
      };

      const result = await hotlistAPI.getYetToOnboardConsultants(params);

      setConsultants(result?.data?.content || []);
      setTotal(result?.data?.totalElements || 0);

      // Extract filter options from the data if not already set
      if (Object.keys(filterOptions).length === 0 && result?.data?.content) {
        extractFilterOptionsFromData(result.data.content);
      }

      showInfoToast("Yet-to-onboard consultants loaded successfully");
    } catch (err) {
      console.error("Error fetching consultants:", err);
      showErrorToast("Failed to load consultants");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, filters, filterOptions, extractFilterOptionsFromData]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  /** ---------------- Approval Dialog Handlers ---------------- */
  const handleOpenApprovalDialog = useCallback((row) => {
    setApprovalDialog({
      open: true,
      consultant: row,
      isSubmitting: false,
    });
  }, []);

  const handleCloseApprovalDialog = useCallback(() => {
    setApprovalDialog({
      open: false,
      consultant: null,
      isSubmitting: false,
    });
  }, []);

  const handleApprovalSubmit = useCallback(async (isSubmitted) => {
    if (!approvalDialog.consultant) return;

    try {
      setApprovalDialog(prev => ({ ...prev, isSubmitting: true }));

      const result = await hotlistAPI.sendApproval(
        approvalDialog.consultant.consultantId,
        userId,
        isSubmitted // Pass true for approve, false for reject
      );

      showSuccessToast(
        isSubmitted
          ? "Consultant approved successfully"
          : "Consultant rejected successfully"
      );

      handleCloseApprovalDialog();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Approval error:", error);

      // Extract error message from your API response structure
      const errorMessage = error.response?.data?.error?.errorMessage ||
        error.response?.data?.message ||
        error.message ||
        "Failed to process approval";

      showErrorToast(errorMessage);
    } finally {
      setApprovalDialog(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [approvalDialog.consultant, userId, handleCloseApprovalDialog]);

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

  const handleCreateNew = useCallback(() => {
    setEditingConsultant(null);
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

  /** ---------------- Approval Flow Handlers ---------------- */

  // Handler for moving to hotlist (only for SUPERADMIN)
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

  /** ---------------- Render Approval Button Based on Role and Status ---------------- */
  const renderApprovalButton = (row) => {
    const { approvalStatus } = row;

    // RECRUITER: Show button only when status is "NOT_RAISED"
    if (role === 'RECRUITER') {
      if (approvalStatus === "NOT_RAISED" || approvalStatus === "REJECTED") {
        return (
          <Button
            variant="contained"
            disabled={loading}
            onClick={() => handleOpenApprovalDialog(row)}
            sx={{
              textTransform: "none",
              minWidth: 150,
              fontWeight: 700,
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #F26322 0%, #f5723a 50%, #F26322 100%)',
              boxShadow: '0 4px 15px rgba(242, 99, 34, 0.4)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: 'linear-gradient(135deg, #C3410A 0%, #F26322 50%, #f5723a 100%)',
                boxShadow: '0 6px 20px rgba(242, 99, 34, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 3px 10px rgba(242, 99, 34, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Submit Approval
            </Box>
          </Button>
        );
      }
      return null;
    }

    // TEAMLEAD: Show button only when status is "TL_PENDING"
    if (role === 'TEAMLEAD') {
      if (approvalStatus === "TL_PENDING") {
        return (
          <Button
            variant="contained"
            disabled={loading}
            onClick={() => handleOpenApprovalDialog(row)}
            sx={{
              textTransform: "none",
              minWidth: 150,
              fontWeight: 700,
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #F26322 0%, #f5723a 50%, #F26322 100%)',
              boxShadow: '0 4px 15px rgba(242, 99, 34, 0.4)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: 'linear-gradient(135deg, #C3410A 0%, #F26322 50%, #f5723a 100%)',
                boxShadow: '0 6px 20px rgba(242, 99, 34, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 3px 10px rgba(242, 99, 34, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Submit Approval
            </Box>
          </Button>
        );
      }
      return null;
    }

    // ADMIN: Show button only when status is "ADMIN_PENDING"
    if (role === 'ADMIN') {
      if (approvalStatus === "ADMIN_PENDING") {
        return (
          <Button
            variant="contained"
            disabled={loading}
            onClick={() => handleOpenApprovalDialog(row)}
            sx={{
              textTransform: "none",
              minWidth: 150,
              fontWeight: 700,
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #F26322 0%, #f5723a 50%, #F26322 100%)',
              boxShadow: '0 4px 15px rgba(242, 99, 34, 0.4)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: 'linear-gradient(135deg, #C3410A 0%, #F26322 50%, #f5723a 100%)',
                boxShadow: '0 6px 20px rgba(242, 99, 34, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 3px 10px rgba(242, 99, 34, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Submit Approval
            </Box>
          </Button>
        );
      }
      return null;
    }
    if (role === 'SUPERADMIN') {
      if (approvalStatus === "SADMIN_PENDING") {
        return (
          <Button
            variant="contained"
            disabled={loading}
            onClick={() => handleOpenApprovalDialog(row)}
            sx={{
              textTransform: "none",
              minWidth: 150,
              fontWeight: 700,
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #F26322 0%, #f5723a 50%, #F26322 100%)',
              boxShadow: '0 4px 15px rgba(242, 99, 34, 0.4)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: 'linear-gradient(135deg, #C3410A 0%, #F26322 50%, #f5723a 100%)',
                boxShadow: '0 6px 20px rgba(242, 99, 34, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 3px 10px rgba(242, 99, 34, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Submit Approval
            </Box>
          </Button>
        );
      }
      return null;
    }

    return null;
  };

  /** ---------------- Columns ---------------- */
  const columns = [
    ...getHotListColumns({
      handleNavigate,
      handleEdit,
      handleDelete,
      loading,
      userRole: role,
      userId,
      filterOptions,
    }),
    {
      id: "actions",
      width: 200,
      render: (_, row) => (
        <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
          {/* Render approval button based on role and status */}
          {renderApprovalButton(row)}

          {/* Move to Hotlist button - only for SUPERADMIN when status is APPROVED */}
          {role === 'SUPERADMIN' && row.approvalStatus === "APPROVED" && (
            <Button
              variant="outlined"
              color="primary"
              disabled={loading}
              onClick={() => handleMoveToHotlist(row)}
              sx={{
                textTransform: "none",
                minWidth: 150,
              }}
            >
              Move to Hotlist
            </Button>
          )}
        </Box>
      ),
    },
  ];

  /** ---------------- Render ---------------- */
  return (
    <Box>
      {!showCreateForm ? (
        <>
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

          {/* Approval Dialog */}
          <Dialog
            open={approvalDialog.open}
            onClose={handleCloseApprovalDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Submit Approval
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {approvalDialog.consultant && (
                  <>
                    Please review the consultant <strong>{approvalDialog.consultant.name}</strong> and
                    choose to approve or reject this submission.
                  </>
                )}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button
                onClick={handleCloseApprovalDialog}
                disabled={approvalDialog.isSubmitting}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleApprovalSubmit(false)}
                disabled={approvalDialog.isSubmitting}
                variant="outlined"
                color="error"
                sx={{ minWidth: 100 }}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleApprovalSubmit(true)}
                disabled={approvalDialog.isSubmitting}
                variant="contained"
                color="primary"
                sx={{ minWidth: 100 }}
              >
                Approve
              </Button>
            </DialogActions>
          </Dialog>
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

export default YetToOnboard;