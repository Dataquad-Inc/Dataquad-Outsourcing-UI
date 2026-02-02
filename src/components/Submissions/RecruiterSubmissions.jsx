import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { showToast } from "../../utils/ToastNotification";
import BaseSubmission from "./BaseSubmission";
import { 
  filterSubmissionsByRecruiter,
  setRecruiterFilteredFlag,
  resetRecruiterFilteredSubmissions 
} from "../../redux/submissionSlice";
import { setFilteredDataRequested } from "../../redux/benchSlice";

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
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const { userId, role } = useSelector((state) => state.auth);
  const { 
    isRecruiterFiltered, 
    filteredSubmissionsForRecruiter,
    filteredRecruiterPagination 
  } = useSelector((state) => state.submission);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);

  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);
  const controllerRef = useRef(null);

  // Fetch data function - REMOVED dateRange from dependencies
  const fetchData = useCallback(
    async (page = 0, size = 10, searchValue = "", filterParams = {}, currentDateRange = null) => {
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

        // ✅ Date Range Filter - use passed date range or state
        const dateToUse = currentDateRange || dateRange;
        if (dateToUse?.startDate && dateToUse?.endDate) {
          params.startDate = dateToUse.startDate;
          params.endDate = dateToUse.endDate;
        }

        // ✅ Filters
        Object.keys(filterParams).forEach((key) => {
          if (filterParams[key] && filterParams[key] !== "") {
            params[key] = filterParams[key];
          }
        });

        const response = await axios.get(
          `https://mymulya.com/candidate/submissionsByUserId/${userId}`,
          {
            signal: controllerRef.current.signal,
            timeout: 30000,
            params,
          }
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

        console.error("Error fetching recruiter submissions:", error);

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
    [userId], // REMOVED dateRange from dependencies
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

  // Handle date range changes
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    if (startDate && endDate) {
      setDateRange({ startDate, endDate });
      dispatch(setFilteredDataRequested(true));
      dispatch(setRecruiterFilteredFlag(true));
      
      // Dispatch the filter action
      dispatch(filterSubmissionsByRecruiter({
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
      dispatch(setRecruiterFilteredFlag(false));
      dispatch(resetRecruiterFilteredSubmissions());
      
      // Fetch without date filter - explicitly pass null
      fetchData(0, pagination.pageSize, globalSearch, filters, { startDate: null, endDate: null });
    }
  }, [dispatch, fetchData, pagination.pageSize, globalSearch, filters]);

  // Handle when filtered data is available from Redux
  useEffect(() => {
    if (isRecruiterFiltered && filteredSubmissionsForRecruiter && filteredSubmissionsForRecruiter.length > 0) {
      setData(filteredSubmissionsForRecruiter);
      if (filteredRecruiterPagination) {
        setPagination(filteredRecruiterPagination);
      }
    } else if (!isRecruiterFiltered && filteredSubmissionsForRecruiter && filteredSubmissionsForRecruiter.length === 0) {
      // If no filtered data, fetch fresh data
      fetchData(0, pagination.pageSize, globalSearch, filters);
    }
  }, [isRecruiterFiltered, filteredSubmissionsForRecruiter, filteredRecruiterPagination, fetchData, pagination.pageSize, globalSearch, filters]);

  // Pagination handlers
  const handlePageChange = useCallback(
    (newPage, newSize) => {
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByRecruiter({
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
        dispatch(filterSubmissionsByRecruiter({
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

  // Filters handler
  const handleFilterChange = useCallback(
    (newFilters, page, rowsPerPage) => {
      setFilters(newFilters);
      
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByRecruiter({
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

  // Global Search handler
  const handleSearchChange = useCallback(
    (searchValue, page, rowsPerPage) => {
      setGlobalSearch(searchValue);
      
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByRecruiter({
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
      dispatch(filterSubmissionsByRecruiter({
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
        filters
      );
    }
  }, [
    fetchData,
    dateRange,
    pagination.currentPage,
    pagination.pageSize,
    globalSearch,
    filters,
    dispatch,
  ]);

  return (
    <BaseSubmission
      data={data}
      loading={loading}
      componentName="RecruiterSubmissions"
      title="My Submissions"
      refreshData={handleRefresh}
      pagination={pagination}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onFilterChange={handleFilterChange}
      onSearchChange={handleSearchChange}
      role={role}
      enableServerSideFiltering
      onDateRangeChange={handleDateRangeChange}
      isFiltered={isRecruiterFiltered}
    />
  );
};

export default RecruiterSubmissions;