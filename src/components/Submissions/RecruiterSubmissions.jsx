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
  const[initialLoading, setInitialLoading] = useState(true);
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

  const dispatch = useDispatch();
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

        if (searchValue?.trim()) {
          params.globalSearch = searchValue.trim();
        }

        if (currentDateRange?.startDate && currentDateRange?.endDate) {
          params.startDate = currentDateRange.startDate;
          params.endDate = currentDateRange.endDate;
        }

        Object.entries(filterParams).forEach(([key, value]) => {
          if (value && value !== "") params[key] = value;
        });

        const response = await axios.get(
          `https://mymulya.com/candidate/submissionsByUserId/${userId}`,
          {
            signal: controllerRef.current.signal,
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

        if (submissions.length === 0) {
          showToast("No submissions found", "info");
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        console.error("Error fetching recruiter submissions:", error);
        showToast(error.response?.data?.message || "Network error", "error");
        setData([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
        controllerRef.current = null;
      }
    },
    [userId]
  );

  // ✅ FIX: Always fetch on mount, no hasFetchedRef guard
  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  // ✅ FIX: Only sync Redux filtered results into local state — no fetchData calls here
  useEffect(() => {
    if (isRecruiterFiltered && filteredSubmissionsForRecruiter) {
      setData([...filteredSubmissionsForRecruiter]);
      if (filteredRecruiterPagination) {
        setPagination({ ...filteredRecruiterPagination });
      }
    }
  }, [isRecruiterFiltered, filteredSubmissionsForRecruiter, filteredRecruiterPagination]);

  // ✅ FIX: Debounced search with full deps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(
          filterSubmissionsByRecruiter({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            page: 0,
            size: pagination.pageSize,
            globalSearch,
            ...filters,
          })
        );
      } else {
        fetchData(0, pagination.pageSize, globalSearch, filters);
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch]); // Intentionally only globalSearch — debounce on typing only

  const handleDateRangeChange = useCallback(
    (startDate, endDate) => {
      if (startDate && endDate) {
        const newRange = { startDate, endDate };
        setDateRange(newRange);
        dispatch(setFilteredDataRequested(true));
        dispatch(setRecruiterFilteredFlag(true));
        dispatch(
          filterSubmissionsByRecruiter({
            startDate,
            endDate,
            page: 0,
            size: pagination.pageSize,
            globalSearch,
            ...filters,
          })
        );
      } else {
        setDateRange({ startDate: null, endDate: null });
        dispatch(setFilteredDataRequested(false));
        dispatch(setRecruiterFilteredFlag(false));
        dispatch(resetRecruiterFilteredSubmissions());
        fetchData(0, pagination.pageSize, globalSearch, filters);
      }
    },
    [dispatch, fetchData, pagination.pageSize, globalSearch, filters]
  );

  const handlePageChange = useCallback(
    (newPage, newSize) => {
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(
          filterSubmissionsByRecruiter({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            page: newPage,
            size: newSize,
            globalSearch,
            ...filters,
          })
        );
      } else {
        fetchData(newPage, newSize, globalSearch, filters);
      }
    },
    [fetchData, dateRange, globalSearch, filters, dispatch]
  );

  const handleRowsPerPageChange = useCallback(
    (newSize) => {
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(
          filterSubmissionsByRecruiter({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            page: 0,
            size: newSize,
            globalSearch,
            ...filters,
          })
        );
      } else {
        fetchData(0, newSize, globalSearch, filters);
      }
    },
    [fetchData, dateRange, globalSearch, filters, dispatch]
  );

  const handleFilterChange = useCallback(
    (newFilters, page, rowsPerPage) => {
      setFilters(newFilters);
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(
          filterSubmissionsByRecruiter({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            page: page || 0,
            size: rowsPerPage || pagination.pageSize,
            globalSearch,
            ...newFilters,
          })
        );
      } else {
        fetchData(page || 0, rowsPerPage || pagination.pageSize, globalSearch, newFilters);
      }
    },
    [fetchData, dateRange, globalSearch, pagination.pageSize, dispatch]
  );

  const handleSearchChange = useCallback((value) => {
    setGlobalSearch(value);
  }, []);

  const handleRefresh = useCallback(() => {
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(
        filterSubmissionsByRecruiter({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: pagination.currentPage,
          size: pagination.pageSize,
          globalSearch,
          ...filters,
        })
      );
    } else {
      fetchData(pagination.currentPage, pagination.pageSize, globalSearch, filters);
    }
  }, [fetchData, dateRange, pagination, globalSearch, filters, dispatch]);

  return (
    <BaseSubmission
      data={data}
      loading={initialLoading}
      componentName="RecruiterSubmissions"
      title="My Submissions"
      refreshData={handleRefresh}
      pagination={pagination}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onFilterChange={handleFilterChange}
      onSearchChange={handleSearchChange}
      searchValue={globalSearch}
      role={role}
      enableServerSideFiltering
      onDateRangeChange={handleDateRangeChange}
      isFiltered={isRecruiterFiltered}
    />
  );
};

export default RecruiterSubmissions;