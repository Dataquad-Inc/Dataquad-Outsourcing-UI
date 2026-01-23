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
  const [searchQuery, setSearchQuery] = useState("");

  const { role } = useSelector((state) => state.auth);

  const hasFetchedRef = useRef(false);
  const controllerRef = useRef(null);

  const fetchData = useCallback(
    async (
      page = 0,
      size = 10,
      search = "",
      filterParams = {}
    ) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      try {
        setLoading(true);
        console.log(
          `Fetching page ${page}, size ${size}, search: "${search}", filters:`,
          filterParams
        );

        const params = {
          page: page,
          size: size,
        };

        // Add search query if exists
        if (search) {
          params.search = search;
        }

        // Map frontend filter keys to backend API parameters
        if (filterParams.fullName && filterParams.fullName.trim() !== "") {
          params.fullname = filterParams.fullName.trim();
        }
        if (filterParams.clientName && filterParams.clientName.trim() !== "") {
          params.client = filterParams.clientName.trim();
        }
        if (filterParams.recruiterName && filterParams.recruiterName.trim() !== "") {
          params.recruiter = filterParams.recruiterName.trim();
        }

        // Add any other filters (excluding the three we already handled)
        Object.keys(filterParams).forEach((key) => {
          if (key !== 'fullName' && key !== 'clientName' && key !== 'recruiterName') {
            if (filterParams[key] && filterParams[key] !== "") {
              params[key] = filterParams[key];
            }
          }
        });

        console.log("Final API params:", params);

        const response = await axios.get(
          "https://mymulya.com/candidate/submissions",
          {
            signal: controllerRef.current.signal,
            timeout: 30000,
            params: params,
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
          if (Array.isArray(response.data.data)) {
            submissions = response.data.data;
          }

          paginationData.totalElements = response.data.totalElements || 0;
          paginationData.totalPages = response.data.totalPages || 0;
          paginationData.currentPage = response.data.currentPage ?? page;
          paginationData.pageSize = response.data.pageSize || size;
        } else if (Array.isArray(response.data)) {
          submissions = response.data;
        }

        setData(submissions);
        setPagination(paginationData);
        hasFetchedRef.current = true;

        if (submissions.length > 0) {
          showToast(
            `Loaded page ${page + 1} (${submissions.length} submissions)`,
            "success"
          );
        } else {
          showToast("No submissions found", "info");
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request cancelled");
          return;
        }

        console.error("Error fetching submissions:", error);

        if (error.response) {
          showToast(
            `Server error: ${error.response.data?.message || "Unknown error"}`,
            "error"
          );
        } else if (error.request) {
          showToast("No response from server", "error");
        } else {
          showToast(`Request error: ${error.message}`, "error");
        }

        setData([]);
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    []
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

  const handlePageChange = useCallback(
    (newPage, newSize) => {
      console.log(`Page change: page=${newPage}, size=${newSize}`);
      fetchData(
        newPage,
        newSize,
        searchQuery,
        filters
      );
    },
    [fetchData, searchQuery, filters]
  );

  const handleRowsPerPageChange = useCallback(
    (newSize) => {
      console.log(`Rows per page change: size=${newSize}`);
      fetchData(
        0,
        newSize,
        searchQuery,
        filters
      );
    },
    [fetchData, searchQuery, filters]
  );

  const handleFilterChange = useCallback(
    (newFilters, page, rowsPerPage, orderBy, order, search) => {
      console.log("Filter change:", newFilters);
      setFilters(newFilters);
      // Since sorting is removed, we can ignore orderBy and order parameters
      fetchData(page, rowsPerPage, search, newFilters);
    },
    [fetchData]
  );

  const handleSearchChange = useCallback(
    (search, page, rowsPerPage, orderBy, order) => {
      console.log(`Search change: "${search}"`);
      setSearchQuery(search);
      // Since sorting is removed, we can ignore orderBy and order parameters
      fetchData(page, rowsPerPage, search, filters);
    },
    [fetchData, filters]
  );

  const handleRefresh = useCallback(() => {
    console.log("Manual refresh");
    fetchData(
      pagination.currentPage,
      pagination.pageSize,
      searchQuery,
      filters
    );
  }, [
    fetchData,
    pagination.currentPage,
    pagination.pageSize,
    searchQuery,
    filters,
  ]);

  // Remove sort change handler since sorting is disabled
  const handleSortChange = null;

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
    />
  );
};

export default AdminSubmissions;