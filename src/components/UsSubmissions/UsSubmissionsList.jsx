import React, { useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getSubmissionsColumns from "./submissionsColumns";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "../../ui-lib/ConfirmDialog";
import { CustomModal } from "../../ui-lib/CustomModal";

// Add debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Utility function to format date as DD-MM-YYYY
const formatDateForAPI = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const UsSubmissionsList = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [keyword, setSearch] = useState("");
  const debouncedSearch = useDebounce(keyword, 500);

  // Initialize filters from localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem("submissions_filters");
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading filters:", error);
      return {};
    }
  });

  const [filterOptions, setFilterOptions] = useState({});

  const { userId, role } = useSelector((state) => state.auth);

  // Confirm Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteSubmissionId, setDeleteSubmissionId] = useState(null);

  // Resume Preview Modal state
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [currentResumeUrl, setCurrentResumeUrl] = useState("");
  const [currentCandidateName, setCurrentCandidateName] = useState("");

  // Build filter query parameters
  const buildFilterParams = useCallback((filters) => {
    const params = {};

    Object.entries(filters).forEach(([key, filter]) => {
      switch (filter.type) {
        case "text":
        case "select":
        case "number":
          if (filter.value) {
            params[`${key}`] = filter.value;
          }
          break;

        case "date":
          if (filter.value) {
            const formattedDate = formatDateForAPI(filter.value);
            if (formattedDate) {
              // For createdAt, use fromDate and toDate
              if (key === "createdAt") {
                params["fromDate"] = formattedDate;
                params["toDate"] = formattedDate;
              } else {
                params[`${key}`] = formattedDate;
              }
            }
          }
          break;

        case "dateRange":
          if (filter.value?.from || filter.value?.to) {
            // Special handling for createdAt field
            const isCreatedAt = key === "createdAt";

            if (filter.value.from) {
              const formattedFrom = formatDateForAPI(filter.value.from);
              if (formattedFrom) {
                params[isCreatedAt ? "fromDate" : `${key}From`] = formattedFrom;
              }
            }

            if (filter.value.to) {
              const formattedTo = formatDateForAPI(filter.value.to);
              if (formattedTo) {
                params[isCreatedAt ? "toDate" : `${key}To`] = formattedTo;
              }
            }
          }
          break;

        default:
          break;
      }
    });

    return params;
  }, []);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const filterParams = buildFilterParams(filters);
      const params = {
        page,
        size: rowsPerPage,
        ...filterParams,
      };

      if (debouncedSearch.trim()) {
        params.keyword = debouncedSearch.trim();
      }

      // Log the params for debugging
      console.log("API Request Params:", params);

      let response;
      if (role === "RECRUITER" || role === "GRANDSALES") {
        response = await axios.get(
          `https://mymulya.com/api/us/requirements/get-submission/${userId}`,
          {
            params,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        response = await axios.get(
          `https://mymulya.com/api/us/requirements/get-submission/${userId}`,
          {
            params,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = response.data;
      console.log("API Response:", data);

      // Properly handle the paginated API response
      if (data && Array.isArray(data.content)) {
        setSubmissions(data.content);
        setTotal(data.totalElements || 0);

        // Extract filter options if not already loaded
        if (
          Object.keys(filterOptions).length === 0 &&
          data.content.length > 0
        ) {
          extractFilterOptionsFromData(data.content);
        }
      } else {
        showErrorToast("Failed to load submissions: Invalid data format");
        setSubmissions([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to load submissions"
      );
      setSubmissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    filters,
    buildFilterParams,
    filterOptions,
    role,
    userId,
  ]);

  const extractFilterOptionsFromData = (data) => {
    const options = {
      candidateName: [],
      recruiterName: [],
      visaType: [],
      currentLocation: [],
      qualification: [],
      employmentType: [],
    };

    data.forEach((row) => {
      Object.keys(options).forEach((field) => {
        const value = row[field];
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
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  /** ---------------- Navigate to Submission Details ---------------- */
  const handleNavigateToSubmission = (row) => {
    navigate(`/dashboard/us-submissions/${row.submissionId}`);
  };

  /** ---------------- Download Resume ---------------- */
  const MIME_EXTENSION_MAP = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "text/plain": "txt",
    "application/zip": "zip",
  };

  const handleDownloadResume = async (submissionId, candidateName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/octet-stream" },
        }
      );

      if (!response.ok) throw new Error("Failed to download resume");

      const blob = await response.blob();

      const contentDisposition = response.headers.get("content-disposition");
      let fileName = `Resume-${candidateName}-${submissionId}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) {
          fileName = match[1];
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && MIME_EXTENSION_MAP[contentType]) {
          fileName += `.${MIME_EXTENSION_MAP[contentType]}`;
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccessToast("Resume downloaded successfully");
    } catch (error) {
      console.error("Error downloading resume:", error);
      showErrorToast("Failed to download resume");
    }
  };

  /** ---------------- View Resume ---------------- */
  const handleViewResume = async (submissionId, candidateName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`,
        { method: "GET", headers: { Accept: "application/pdf" } }
      );

      if (!response.ok) throw new Error("Failed to load resume");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      setCurrentResumeUrl(url);
      setCurrentCandidateName(candidateName);
      setResumeModalOpen(true);
    } catch (error) {
      console.error("Error loading resume:", error);
      showErrorToast("Failed to load resume");
    }
  };

  const handleCloseResumeModal = () => {
    setResumeModalOpen(false);
    setCurrentResumeUrl("");
    setCurrentCandidateName("");
    if (currentResumeUrl) {
      window.URL.revokeObjectURL(currentResumeUrl);
    }
  };

  /** ---------------- Delete with confirm ---------------- */
  const handleRequestDelete = (submissionId) => {
    setDeleteSubmissionId(submissionId);
    setConfirmOpen(true);
  };

  /** ---------------- Edit Submission ---------------- */
  const handleEdit = (submissionId) => {
    navigate(`/dashboard/us-submissions/edit/${submissionId}`);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!deleteSubmissionId) return;

      await axios.delete(
        `https://mymulya.com/api/us/requirements/delete-submission/${deleteSubmissionId}`
      );

      setConfirmOpen(false);
      setDeleteSubmissionId(null);
      setRefreshKey((prev) => prev + 1);
      showSuccessToast("Submission deleted successfully");
    } catch (error) {
      console.error("Error deleting submission:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to delete submission"
      );
    }
  };

  /** ---------------- Create New Submission ---------------- */
  const handleCreateSubmission = () => {
    navigate("/dashboard/us-submissions/create-submission");
  };

  /** ---------------- Search Handlers ---------------- */
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleSearchClear = () => {
    setSearch("");
    setPage(0);
  };

  /** ---------------- Pagination Handlers ---------------- */
  const handlePageChange = (e, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  /** ---------------- Refresh Handler ---------------- */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleNavigateToSubmissionProfile = (submissionId) => {
    navigate(`/dashboard/us-submissions/candidate-profile/${submissionId}`, {
      state: {
        from: `/dashboard/us-submissions`,
      },
    });
  };

  /** ---------------- Columns ---------------- */
  const columns = getSubmissionsColumns({
    handleNavigateToSubmissionProfile,
    handleNavigateToSubmission,
    handleDownloadResume,
    handleViewResume,
    handleEdit,
    handleDelete: handleRequestDelete,
    userRole: role,
    filterOptions,
    loading,
  });

  return (
    <>
      <CustomDataTable
        title="US Submissions"
        columns={columns}
        rows={submissions}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        search={keyword}
        loading={loading}
        filters={filters}
        filterStorageKey="submissions_filters"
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onRefresh={handleRefresh}
        onFiltersChange={handleFiltersChange}
        onCreateNew={handleCreateSubmission}
        createNewTooltip="Create New Submission"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Submission"
        message="Are you sure you want to delete this submission? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
      />

      {/* Resume Preview Modal */}
      <CustomModal
        open={resumeModalOpen}
        onClose={handleCloseResumeModal}
        title={
          currentCandidateName
            ? `Resume - ${currentCandidateName}`
            : "Resume Preview"
        }
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ pt: 1, height: "80vh" }}>
          {currentResumeUrl && (
            <iframe
              src={currentResumeUrl}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "8px" }}
              title="Resume Preview"
            />
          )}
        </Box>
      </CustomModal>
    </>
  );
};

export default UsSubmissionsList;
