import React, { useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRequirementsColumns from "./requirementsColumns";
import { showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "../../ui-lib/ConfirmDialog";

const RequirementsList = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  const { userId } = useSelector((state) => state.auth);

  // 🔹 Confirm Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);

  // Fetch filter options for select filters
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
      // Set default filter options based on your data structure
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
            params[`${key}`] = new Date(filter.value)
              .toISOString()
              .split("T")[0];
          }
          break;

        case "dateRange":
          if (filter.value?.from) {
            params[`${key}From`] = new Date(filter.value.from)
              .toISOString()
              .split("T")[0];
          }
          if (filter.value?.to) {
            params[`${key}To`] = new Date(filter.value.to)
              .toISOString()
              .split("T")[0];
          }
          break;

        default:
          break;
      }
    });

    return params;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const filterParams = buildFilterParams(filters);
      const params = {
        page,
        size: rowsPerPage,
        ...filterParams,
      };

      // Add search parameter if exists
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axios.get(
        "https://mymulya.com/api/us/requirements/allRequirements",
        {
          params,
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      if (data.success && data.data) {
        setRequirements(data.data.content || []);
        setTotal(data.data.totalElements || 0);

        // Extract filter options from the response data if not already set
        if (Object.keys(filterOptions).length === 0) {
          extractFilterOptionsFromData(data.data.content || []);
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
  }, [page, rowsPerPage, search, filters, buildFilterParams, filterOptions]);

  // Extract filter options from data if API doesn't provide them
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
      // Extract unique values for each filterable field
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

    // Sort options alphabetically
    Object.keys(options).forEach((field) => {
      options[field].sort((a, b) => a.label.localeCompare(b.label));
    });

    setFilterOptions(options);
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

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

  /** ---------------- Filter Handlers ---------------- */
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };


  const handleEdit = (jobId) => {
  navigate(`/dashboard/us-requirements/edit/${jobId}`);
};

  /** ---------------- Columns ---------------- */
  const columns = getRequirementsColumns({
    handleNagivateToReqProfile,
    handleDownloadJD,
    handleEdit,
    handleDelete: handleRequestDelete,
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
