import React, { useState, useEffect, useRef } from "react";
import { Stack, Typography } from "@mui/material";
import axios from "axios";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import { generateSubmissionColumns } from "./submissionColumns";
import ToastService from "../../Services/toastService";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { useSelector } from "react-redux";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8085";

const AllSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});

  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  const { filteredSubmissionsList } = useSelector((state) => state.submission);

  // Use refs to track current state
  const stateRefs = useRef({
    page,
    rowsPerPage,
    searchQuery,
    filters,
    isFetching: false
  });

  // Keep refs updated
  useEffect(() => {
    stateRefs.current.page = page;
    stateRefs.current.rowsPerPage = rowsPerPage;
    stateRefs.current.searchQuery = searchQuery;
    stateRefs.current.filters = filters;
  }, [page, rowsPerPage, searchQuery, filters]);

  /* ===========================
     FETCH SUBMISSIONS
     =========================== */
  const fetchSubmissions = async () => {
    if (stateRefs.current.isFetching) {
      console.log("Already fetching, skipping...");
      return;
    }

    try {
      stateRefs.current.isFetching = true;
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", stateRefs.current.page + 1); // API expects 1-based page number
      params.append("size", stateRefs.current.rowsPerPage);
      
      // Add search query if exists
      if (stateRefs.current.searchQuery) {
        params.append("fullName", stateRefs.current.searchQuery);
      }
      
      // Add filters directly as URL parameters
      Object.entries(stateRefs.current.filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      console.log("Fetching submissions:", {
        page: stateRefs.current.page,
        size: stateRefs.current.rowsPerPage,
        params: params.toString()
      });

      const response = await axios.get(`/candidate/submissions?${params.toString()}`, {
        baseURL: API_BASE_URL,
      });

      const data = response.data || {};

      // Match your API response structure
      setSubmissions(data.data || []);
      setTotalCount(data.totalElements || 0);

      console.log("Fetched:", data.data?.length, "Total:", data.totalElements, "Page:", stateRefs.current.page);
    } catch (error) {
      console.error("Fetch error:", error);
      ToastService.error("Failed to load submissions");
      setSubmissions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      stateRefs.current.isFetching = false;
    }
  };

  /* ===========================
     FETCH ON STATE CHANGES
     =========================== */
  useEffect(() => {
    if (!isFilteredDataRequested) {
      console.log("Triggering fetch - Page:", page);
      fetchSubmissions();
    }
  }, [page, rowsPerPage, isFilteredDataRequested]);

  // Separate effect for filters and search (with debouncing)
  useEffect(() => {
    if (!isFilteredDataRequested) {
      const timer = setTimeout(() => {
        console.log("Filters/search changed, resetting to page 0");
        setPage(0); // This will trigger the first useEffect
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [filters, searchQuery, isFilteredDataRequested]);

  /* ===========================
     HANDLERS
     =========================== */
  const handlePageChange = (newPage, newRowsPerPage) => {
    console.log("Page change in parent:", { newPage, newRowsPerPage });
    
    // Update page state - this will trigger the fetch
    setPage(newPage);
    
    // Update rowsPerPage if different
    if (newRowsPerPage !== undefined && newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
    }
  };

  const handleFilterChange = (newFilters) => {
    console.log("Filter change in parent:", newFilters);
    setFilters(newFilters);
    // Page reset will happen in the useEffect above
  };

  const handleSearchChange = (value) => {
    console.log("Search change in parent:", value);
    setSearchQuery(value);
    // Page reset will happen in the useEffect above
  };

  const handleRefresh = () => {
    console.log("Manual refresh");
    fetchSubmissions();
  };

  /* ===========================
     ACTIONS
     =========================== */
  const handleEdit = (row) => {
    ToastService.info(`Editing submission for ${row.fullName}`);
  };

  const handleDelete = async (row) => {
    try {
      const toastId = ToastService.loading("Deleting submission...");

      await axios.delete(`/submission/${row.submissionId}`, {
        baseURL: API_BASE_URL,
      });

      ToastService.update(toastId, "Deleted successfully", "success");
      fetchSubmissions();
    } catch (error) {
      console.error(error);
      ToastService.error("Delete failed");
    }
  };

  const columns = generateSubmissionColumns(submissions, {
    handleEdit,
    handleDelete,
  });

  /* ===========================
     RENDER
     =========================== */
  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h6" color="primary">
          Submissions Management
        </Typography>

        <DateRangeFilter component="Submissions" />
      </Stack>
      <DataTablePaginated
        data={isFilteredDataRequested ? filteredSubmissionsList : submissions}
        columns={columns}
        title="Candidate Submissions"
        loading={loading}
        serverSide={!isFilteredDataRequested}
        totalCount={
          isFilteredDataRequested ? filteredSubmissionsList.length : totalCount
        }
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={isFilteredDataRequested ? undefined : handlePageChange}
        onFilterChange={
          isFilteredDataRequested ? undefined : handleFilterChange
        }
        onSearchChange={
          isFilteredDataRequested ? undefined : handleSearchChange
        }
        refreshData={handleRefresh}
        enableSelection={false}
        customTableHeight={650}
        uniqueId="submissionId"
        enableLocalFiltering={isFilteredDataRequested}
        defaultRowsPerPage={10}
      />
    </>
  );
};

export default AllSubmissions;