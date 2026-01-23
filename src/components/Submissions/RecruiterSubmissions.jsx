import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import BaseSubmission from "./BaseSubmission";
import { showToast } from "../../utils/ToastNotification";

const RecruiterSubmissions = () => {
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

  const { userId, role } = useSelector((state) => state.auth);
  const { isFilteredDataRequested, filteredSubmissionsForRecruiter } =
    useSelector((state) => state.submission);

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

        const params = new URLSearchParams({
          page,
          size,
        });

        // Global search
        if (searchValue?.trim()) {
          params.append("globalSearch", searchValue.trim());
        }

        // Filters
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        // ✅ userId as PATH param
        const url = `https://mymulya.com/candidate/submissionsByUserId/${userId}?${params.toString()}`;

        const response = await fetch(url, {
          signal: controllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.message || "Server error");
        }

        const result = await response.json();

        let submissions = [];
        let paginationData = {
          totalElements: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: size,
        };

        if (result?.status) {
          submissions = Array.isArray(result.data) ? result.data : [];

          paginationData = {
            totalElements: result.totalElements || 0,
            totalPages: result.totalPages || 0,
            currentPage: result.currentPage ?? page,
            pageSize: result.pageSize || size,
          };
        } else if (Array.isArray(result)) {
          submissions = result;
        }

        setData(submissions);
        setPagination(paginationData);
        hasFetchedRef.current = true;

        if (submissions.length === 0) {
          showToast("No submissions found", "info");
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Error fetching recruiter submissions:", error);
        showToast(error.message || "Network error", "error");
        setData([]);
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchData();
    }

    return () => {
      controllerRef.current?.abort();
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

  // Sorting (disabled)
  const handleSortChange = useCallback(() => {}, []);

  // Filters
  const handleFilterChange = useCallback(
    (newFilters, page, rowsPerPage) => {
      setFilters(newFilters);
      fetchData(page, rowsPerPage, globalSearch, newFilters);
    },
    [fetchData, globalSearch],
  );

  // Global Search
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

  const displayData = isFilteredDataRequested
    ? filteredSubmissionsForRecruiter
    : data;

  return (
    <BaseSubmission
      data={displayData}
      loading={loading}
      componentName="RecruiterSubmissions"
      title="My Submissions"
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

export default RecruiterSubmissions;
