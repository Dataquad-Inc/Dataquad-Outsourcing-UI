import React, { useState, useCallback, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRequirementsColumns from "./requirementsColumns";
import { showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "../../ui-lib/ConfirmDialog";
import { CustomModal } from "../../ui-lib/CustomModal";

// Add debounce hook for search
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
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};

const RequirementsList = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [keyword, setSearch] = useState("");
  const debouncedSearch = useDebounce(keyword, 500);

  // Initialize filters from localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem("requirements_filters");
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
  const [deleteJobId, setDeleteJobId] = useState(null);

  // Description Modal state
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");

  // Build filter query parameters with date range support
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
              // For createdAt/updatedAt, use fromDate and toDate for single date
              if (key === "createdAt" || key === "updatedAt") {
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
            // Special handling for createdAt and updatedAt fields
            const isDateField = key === "createdAt" || key === "updatedAt";

            if (filter.value.from) {
              const formattedFrom = formatDateForAPI(filter.value.from);
              if (formattedFrom) {
                // Use fromDate for both createdAt and updatedAt
                if (isDateField) {
                  params["fromDate"] = formattedFrom;
                } else {
                  params[`${key}From`] = formattedFrom;
                }
              }
            }

            if (filter.value.to) {
              const formattedTo = formatDateForAPI(filter.value.to);
              if (formattedTo) {
                // Use toDate for both createdAt and updatedAt
                if (isDateField) {
                  params["toDate"] = formattedTo;
                } else {
                  params[`${key}To`] = formattedTo;
                }
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

  // Fetch filter options (if needed)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://mymulya.com/api/us/requirements/filterOptions",
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success && response.data.data) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setFilterOptions({
        clientName: [],
        jobType: [],
        location: [],
        qualification: [],
        visaType: [],
        assignedBy: [],
        status: [],
      });
    }
  }, []);

  // Main fetch data function
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
      if (role === "RECRUITER" || role === "GRANDSALES" || role === "TEAMLEAD" || role === "SUPERADMIN") {
        // For date range filter, use the API endpoint with fromDate and toDate
        response = await axios.get(
          `https://mymulya.com/api/us/requirements/v2/get-requirements/${userId}`,
          {
            params,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        response = await axios.get(
          "https://mymulya.com/api/us/requirements/allRequirements",
          {
            params,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = response.data;
      console.log("API Response:", data);

      if (data.content) {
        setRequirements(data.content || []);
        setTotal(data.totalElements || 0);

        // Extract filter options from data if filter options not already loaded
        if (Object.keys(filterOptions).length === 0 && data.content.length > 0) {
          extractFilterOptionsFromData(data.content || []);
        }
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

  // Extract filter options from data
  const extractFilterOptionsFromData = (data) => {
    const options = {
      clientName: [],
      jobType: [],
      location: [],
      qualification: [],
      visaType: [],
      assignedBy: [],
      status: [],
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
      options[field].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    });

    setFilterOptions(options);
  };

  // Initial data and filter options fetch
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, debouncedSearch]);

  /** ---------------- Navigate to Requirement Profile ---------------- */
  const handleNagivateToReqProfile = (row) => {
    navigate(`/dashboard/us-requirements/${row.jobId}`);
  };

  /** ---------------- Download JD ---------------- */
  const handleDownloadJD = async (jobId) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/v2/download-jd/${jobId}`,
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

  /** ---------------- View Description ---------------- */
  const handleViewDescription = (description, jobTitle) => {
    setCurrentDescription(description);
    setCurrentJobTitle(jobTitle);
    setDescriptionModalOpen(true);
  };

  const handleCloseDescriptionModal = () => {
    setDescriptionModalOpen(false);
    setCurrentDescription("");
    setCurrentJobTitle("");
  };

  /** ---------------- Delete with confirm ---------------- */
  const handleRequestDelete = (jobId) => {
    setDeleteJobId(jobId);
    setConfirmOpen(true);
  };

  /** ---------------- Submit Candidate ---------------- */
  const handleSubmitCandidate = (job) => {
    navigate(`/dashboard/us-submissions/create-submission`, { 
      state: { 
        job,
        jobId: job.jobId,
        userId: userId,
        billRate: job.billRate,
        payRate: job.payRate
      } 
    });
  };

  /** ---------------- Confirm Delete ---------------- */
  const handleConfirmDelete = async () => {
    try {
      if (!userId || !deleteJobId) return;

      await axios.delete(
        `https://mymulya.com/api/us/requirements/v2/delete-requirement/${deleteJobId}`
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

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  /** ---------------- Edit Requirement ---------------- */
  const handleEdit = (jobId) => {
    navigate(`/dashboard/us-requirements/edit/${jobId}`);
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

  /** ---------------- Columns ---------------- */
  const columns = getRequirementsColumns({
    handleNagivateToReqProfile,
    handleDownloadJD,
    handleEdit,
    handleDelete: handleRequestDelete,
    handleViewDescription,
    handleSubmitCandidate,
    userRole: role,
    filterOptions,
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
        search={keyword}
        loading={loading}
        filters={filters}
        filterStorageKey="requirements_filters"
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onRefresh={handleRefresh}
        onFiltersChange={handleFiltersChange}
      />

      {/* Confirm Delete Dialog */}
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

      {/* Job Description Modal */}
      <CustomModal
        open={descriptionModalOpen}
        onClose={handleCloseDescriptionModal}
        title={
          currentJobTitle
            ? `Job Description - ${currentJobTitle}`
            : "Job Description"
        }
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ pt: 1 }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              maxHeight: "60vh",
              overflow: "auto",
              p: 1,
              backgroundColor: "grey.50",
              borderRadius: 1,
            }}
          >
            {currentDescription}
          </Typography>
        </Box>
      </CustomModal>
    </>
  );
};

export default RequirementsList;