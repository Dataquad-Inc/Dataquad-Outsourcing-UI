import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { showToast } from "../../utils/ToastNotification";
import BaseSubmission from "./BaseSubmission";

const AdminSubmissions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");

  const { role } = useSelector((state) => state.auth);
  const hasFetchedRef = useRef(false);
  const controllerRef = useRef(null);

  const fetchData = useCallback(
    async (page = 0, size = 10, searchValue = "", filterParams = {}) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      try {
        setLoading(true);

        const params = {
          page,
          size,
        };

        // ✅ Global Search
        if (searchValue && searchValue.trim() !== "") {
          params.globalSearch = searchValue.trim();
        }

        // ✅ Filters (exact match filters only)
        Object.keys(filterParams).forEach((key) => {
          if (filterParams[key] && filterParams[key] !== "") {
            params[key] = filterParams[key];
          }
        });

        const response = await axios.get(
          "https://mymulya.com/candidate/submissions",
          {
            signal: controllerRef.current.signal,
            timeout: 30000,
            params,
          },
        );

        let submissions = [];
        let paginationData = {
          totalElements: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: size,
        };

        if (response.data?.status) {
          submissions = Array.isArray(response.data.data)
            ? response.data.data
            : [];

          paginationData = {
            totalElements: response.data.totalElements || 0,
            totalPages: response.data.totalPages || 0,
            currentPage: response.data.currentPage ?? page,
            pageSize: response.data.pageSize || size,
          };
        } else if (Array.isArray(response.data)) {
          submissions = response.data;
        }

        setData(submissions);
        setPagination(paginationData);
        hasFetchedRef.current = true;

        if (submissions.length === 0) {
          showToast("No submissions found", "info");
        }
      } catch (error) {
        if (axios.isCancel(error)) return;

        console.error("Error fetching submissions:", error);

        if (error.response) {
          showToast(error.response.data?.message || "Server error", "error");
        } else {
          showToast("Network error", "error");
        }

        setData([]);
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchData();
    }

    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Pagination
  const handlePageChange = useCallback(
    (newPage, newSize) => {
      fetchData(newPage, newSize, globalSearch, filters);
    },
    [fetchData, globalSearch, filters],
  );

  const handleRowsPerPageChange = useCallback(
    (newSize) => {
      fetchData(0, newSize, globalSearch, filters);
    },
    [fetchData, globalSearch, filters],
  );

  // Sorting - COMPLETELY REMOVED
  const handleSortChange = useCallback(() => {
    // No sorting functionality
  }, []);

  // Filters
  const handleFilterChange = useCallback(
    (newFilters, page, rowsPerPage) => {
      setFilters(newFilters);
      fetchData(page, rowsPerPage, globalSearch, newFilters);
    },
    [fetchData, globalSearch],
  );

  // ✅ Global Search handler
  const handleSearchChange = useCallback(
    (searchValue, page, rowsPerPage) => {
      setGlobalSearch(searchValue);
      fetchData(page, rowsPerPage, searchValue, filters);
    },
    [fetchData, filters],
  );

  // Refresh
  const handleRefresh = useCallback(() => {
    fetchData(
      pagination.currentPage,
      pagination.pageSize,
      globalSearch,
      filters,
    );
  }, [
    fetchData,
    pagination.currentPage,
    pagination.pageSize,
    globalSearch,
    filters,
  ]);

  return (
    <BaseSubmission
      data={data}
      loading={loading}
      componentName="AdminSubmissions"
      title="All Submissions"
      refreshData={handleRefresh}
      pagination={pagination}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onSortChange={handleSortChange} 
      onFilterChange={handleFilterChange}
      onSearchChange={handleSearchChange}
      role={role}
      enableServerSideFiltering
    />
  );
};

export default AdminSubmissions;
