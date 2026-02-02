import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { showToast } from "../../utils/ToastNotification";
import BaseSubmission from "./BaseSubmission";
import { filterSubmissionsByDateRange, setFilteredFlag } from "../../redux/submissionSlice";
import { setFilteredDataRequested } from "../../redux/benchSlice";

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
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const { role } = useSelector((state) => state.auth);
  const { filteredSubmissionsList, filteredSubmissionsPagination, isFiltered } = useSelector((state) => state.submission);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);
  const controllerRef = useRef(null);

  // Fetch data function
  const fetchData = useCallback(
    async (page = 0, size = 10, searchValue = "", filterParams = {}, dateRangeParams = null) => {
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

        // ✅ Date Range Filter
        if (dateRangeParams?.startDate && dateRangeParams?.endDate) {
          params.startDate = dateRangeParams.startDate;
          params.endDate = dateRangeParams.endDate;
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

  // Handle date range changes
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    if (startDate && endDate) {
      setDateRange({ startDate, endDate });
      dispatch(setFilteredDataRequested(true));
      dispatch(setFilteredFlag(true));
      
      // Dispatch the filter action
      dispatch(filterSubmissionsByDateRange({
        startDate,
        endDate,
        page: 0,
        size: pagination.pageSize,
        globalSearch,
        ...filters
      }));
    } else {
      // Clear date range filter
      setDateRange({ startDate: null, endDate: null });
      dispatch(setFilteredDataRequested(false));
      dispatch(setFilteredFlag(false));
      
      // Fetch without date filter
      fetchData(0, pagination.pageSize, globalSearch, filters);
    }
  }, [dispatch, fetchData, pagination.pageSize, globalSearch, filters]);

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

  // Handle when filtered data is available from Redux
  useEffect(() => {
    if (isFiltered && filteredSubmissionsList && filteredSubmissionsList.length > 0) {
      setData(filteredSubmissionsList);
      if (filteredSubmissionsPagination) {
        setPagination(filteredSubmissionsPagination);
      }
    } else if (!isFiltered && filteredSubmissionsList && filteredSubmissionsList.length === 0) {
      // If no filtered data, fetch fresh data
      fetchData();
    }
  }, [isFiltered, filteredSubmissionsList, filteredSubmissionsPagination, fetchData]);

  // Pagination handlers
  const handlePageChange = useCallback(
    (newPage, newSize) => {
      if (dateRange.startDate && dateRange.endDate) {
        // Use filtered data with pagination
        dispatch(filterSubmissionsByDateRange({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: newPage,
          size: newSize,
          globalSearch,
          ...filters
        }));
      } else {
        fetchData(newPage, newSize, globalSearch, filters);
      }
    },
    [fetchData, dateRange, globalSearch, filters, dispatch],
  );

  const handleRowsPerPageChange = useCallback(
    (newSize) => {
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByDateRange({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: 0,
          size: newSize,
          globalSearch,
          ...filters
        }));
      } else {
        fetchData(0, newSize, globalSearch, filters);
      }
    },
    [fetchData, dateRange, globalSearch, filters, dispatch],
  );

  // Sorting handler
  const handleSortChange = useCallback(() => {
    // No sorting functionality
  }, []);

  // Filters handler
  const handleFilterChange = useCallback(
    (newFilters, page, rowsPerPage) => {
      setFilters(newFilters);
      
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByDateRange({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: page || 0,
          size: rowsPerPage || pagination.pageSize,
          globalSearch,
          ...newFilters
        }));
      } else {
        fetchData(page || 0, rowsPerPage || pagination.pageSize, globalSearch, newFilters);
      }
    },
    [fetchData, dateRange, globalSearch, pagination.pageSize, dispatch],
  );

  // ✅ Global Search handler
  const handleSearchChange = useCallback(
    (searchValue, page, rowsPerPage) => {
      setGlobalSearch(searchValue);
      
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByDateRange({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: page || 0,
          size: rowsPerPage || pagination.pageSize,
          globalSearch: searchValue,
          ...filters
        }));
      } else {
        fetchData(page || 0, rowsPerPage || pagination.pageSize, searchValue, filters);
      }
    },
    [fetchData, dateRange, filters, pagination.pageSize, dispatch],
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(filterSubmissionsByDateRange({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: pagination.currentPage,
        size: pagination.pageSize,
        globalSearch,
        ...filters
      }));
    } else {
      fetchData(
        pagination.currentPage,
        pagination.pageSize,
        globalSearch,
        filters,
      );
    }
  }, [
    fetchData,
    pagination.currentPage,
    pagination.pageSize,
    globalSearch,
    filters,
    dateRange,
    dispatch,
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
      enableServerSideFiltering={true}
      onDateRangeChange={handleDateRangeChange}
      isFiltered={isFiltered}
    />
  );
};

export default AdminSubmissions;