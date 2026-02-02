import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { showToast } from "../../utils/ToastNotification";
import BaseSubmission from "./BaseSubmission";
import { 
  filterSubmissionsByTeamLead,
  setTeamLeadFilteredFlag,
  resetTeamLeadFilteredSubmissions 
} from "../../redux/submissionSlice";
import { setFilteredDataRequested } from "../../redux/benchSlice";

const TeamLeadSubmissions = () => {
  const [selfData, setSelfData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const isTeamData = tabValue === 0;

  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const [selfPagination, setSelfPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
  });

  const [teamPagination, setTeamPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
  });

  const { userId, role } = useSelector((state) => state.auth);
  const { 
    isTeamLeadFiltered,
    filteredSubmissionsForTeamLead,
    filteredTeamLeadPagination,
    selfSubmissionsTL,
    teamSubmissionsTL 
  } = useSelector((state) => state.submission);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);

  const dispatch = useDispatch();
  const controllerRef = useRef(null);
  const hasFetchedRef = useRef(false);

  // ================= FETCH FUNCTION =================
  const fetchData = useCallback(
    async (
      page = 0,
      size = 10,
      searchValue = "",
      filterParams = {},
      isTeam = false,
      currentDateRange = null // Pass date range as parameter
    ) => {
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

        if (isTeam) params.team = "true";

        if (searchValue?.trim()) {
          params.globalSearch = searchValue.trim();
        }

        Object.entries(filterParams).forEach(([k, v]) => {
          if (v) params[k] = v;
        });

        // Add date range if filtering
        const dateToUse = currentDateRange || dateRange;
        if (dateToUse?.startDate && dateToUse?.endDate) {
          params.startDate = dateToUse.startDate;
          params.endDate = dateToUse.endDate;
        }

        const response = await axios.get(
          `https://mymulya.com/candidate/submissions/teamlead/${userId}`,
          {
            signal: controllerRef.current.signal,
            timeout: 30000,
            params,
          }
        );

        // ===== TEAM =====
        if (isTeam) {
          const teamSubmissions = response.data?.teamSubmissions || [];
          setTeamData(teamSubmissions);
          setTeamPagination({
            totalElements: response.data?.totalTeamSubmissions || 0,
            totalPages: response.data?.totalTeamPages || 0,
            currentPage: response.data?.currentPage ?? page,
            pageSize: response.data?.pageSize || size,
          });

          return {
            data: teamSubmissions,
            totalElements: response.data?.totalTeamSubmissions || 0,
          };
        }

        // ===== SELF =====
        const selfSubmissions = response.data?.selfSubmissions || [];
        setSelfData(selfSubmissions);
        setSelfPagination({
          totalElements: response.data?.totalSelfSubmissions || 0,
          totalPages: response.data?.totalSelfPages || 0,
          currentPage: response.data?.currentPage ?? page,
          pageSize: response.data?.pageSize || size,
        });

        return {
          data: selfSubmissions,
          totalElements: response.data?.totalSelfSubmissions || 0,
        };
      } catch (err) {
        if (axios.isCancel(err)) return;
        
        console.error("Error fetching data:", err);
        if (err.response) {
          showToast(err.response.data?.message || "Server error", "error");
        } else {
          showToast("Network error", "error");
        }
        return { data: [], totalElements: 0 };
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [userId], // Remove dateRange from dependencies
  );

  // ================= INITIAL LOAD =================
  useEffect(() => {
    if (!hasFetchedRef.current) {
      const initializeData = async () => {
        try {
          // First, try to load team data
          const teamResult = await fetchData(0, 10, "", {}, true);

          // If team has no data, also load self data
          if (teamResult.totalElements === 0) {
            await fetchData(0, 10, "", {}, false);
          }

          hasFetchedRef.current = true;
          setInitialLoadComplete(true);
        } catch (error) {
          console.error("Error initializing data:", error);
          setInitialLoadComplete(true);
        }
      };

      initializeData();
    }

    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // ================= HANDLE DATE RANGE CHANGE =================
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    if (startDate && endDate) {
      setDateRange({ startDate, endDate });
      dispatch(setFilteredDataRequested(true));
      dispatch(setTeamLeadFilteredFlag(true));
      
      // Dispatch the filter action for current tab
      dispatch(filterSubmissionsByTeamLead({
        startDate,
        endDate,
        page: 0,
        size: isTeamData ? teamPagination.pageSize : selfPagination.pageSize,
        globalSearch,
        ...filters,
        isTeam: isTeamData
      }));
    } else {
      // Clear date range filter
      setDateRange({ startDate: null, endDate: null });
      dispatch(setFilteredDataRequested(false));
      dispatch(setTeamLeadFilteredFlag(false));
      dispatch(resetTeamLeadFilteredSubmissions());
      
      // Fetch without date filter
      fetchData(
        0, 
        isTeamData ? teamPagination.pageSize : selfPagination.pageSize, 
        globalSearch, 
        filters, 
        isTeamData,
        { startDate: null, endDate: null } // Explicitly pass null
      );
    }
  }, [dispatch, isTeamData, teamPagination.pageSize, selfPagination.pageSize, 
      globalSearch, filters, fetchData]);

  // ================= HANDLE FILTERED DATA FROM REDUX =================
  useEffect(() => {
    if (isTeamLeadFiltered && filteredSubmissionsForTeamLead && filteredSubmissionsForTeamLead.length > 0) {
      if (isTeamData) {
        setTeamData(filteredSubmissionsForTeamLead);
        if (teamSubmissionsTL && teamSubmissionsTL.length > 0) {
          setTeamData(teamSubmissionsTL);
        }
      } else {
        setSelfData(filteredSubmissionsForTeamLead);
      }
      
      if (filteredTeamLeadPagination) {
        if (isTeamData) {
          setTeamPagination(filteredTeamLeadPagination);
        } else {
          setSelfPagination(filteredTeamLeadPagination);
        }
      }
    } else if (!isTeamLeadFiltered && filteredSubmissionsForTeamLead && filteredSubmissionsForTeamLead.length === 0) {
      // If no filtered data, fetch fresh data
      fetchData(
        0, 
        isTeamData ? teamPagination.pageSize : selfPagination.pageSize, 
        globalSearch, 
        filters, 
        isTeamData
      );
    }
  }, [isTeamLeadFiltered, filteredSubmissionsForTeamLead, filteredTeamLeadPagination, 
      isTeamData, teamSubmissionsTL, selfSubmissionsTL, fetchData, 
      teamPagination.pageSize, selfPagination.pageSize, globalSearch, filters]);

  // ================= DETERMINE TAB VISIBILITY =================
  const hasTeamData = teamPagination.totalElements > 0;
  const hasSelfData = selfPagination.totalElements > 0;
  const shouldShowTabs = hasTeamData;

  // If no team data and initial load is complete, switch to self view
  useEffect(() => {
    if (initialLoadComplete && !hasTeamData && tabValue === 0) {
      setTabValue(1);
    }
  }, [initialLoadComplete, hasTeamData, tabValue]);

  // ================= TAB CHANGE =================
  const handleTabChange = useCallback(
    async (event, newValue) => {
      const isNowTeam = newValue === 0;
      setTabValue(newValue);

      // If date range is active, apply filter to new tab
      if (dateRange.startDate && dateRange.endDate) {
        dispatch(filterSubmissionsByTeamLead({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: 0,
          size: isNowTeam ? teamPagination.pageSize : selfPagination.pageSize,
          globalSearch,
          ...filters,
          isTeam: isNowTeam
        }));
      } else {
        // Fetch data for the selected tab if not already loaded
        if (isNowTeam && teamData.length === 0) {
          await fetchData(0, teamPagination.pageSize, globalSearch, filters, true);
        } else if (!isNowTeam && selfData.length === 0) {
          await fetchData(0, selfPagination.pageSize, globalSearch, filters, false);
        }
      }
    },
    [tabValue, dateRange, dispatch, teamPagination.pageSize, selfPagination.pageSize, 
     globalSearch, filters, teamData.length, selfData.length, fetchData],
  );

  // ================= HANDLERS =================
  const handlePageChange = useCallback((page, size) => {
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(filterSubmissionsByTeamLead({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page,
        size,
        globalSearch,
        ...filters,
        isTeam: isTeamData
      }));
    } else {
      fetchData(page, size, globalSearch, filters, isTeamData);
    }
  }, [dateRange, dispatch, globalSearch, filters, isTeamData, fetchData]);

  const handleRowsPerPageChange = useCallback((size) => {
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(filterSubmissionsByTeamLead({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: 0,
        size,
        globalSearch,
        ...filters,
        isTeam: isTeamData
      }));
    } else {
      fetchData(0, size, globalSearch, filters, isTeamData);
    }
  }, [dateRange, dispatch, globalSearch, filters, isTeamData, fetchData]);

  const handleFilterChange = useCallback((newFilters, page, size) => {
    setFilters(newFilters);
    
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(filterSubmissionsByTeamLead({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: page || 0,
        size: size || (isTeamData ? teamPagination.pageSize : selfPagination.pageSize),
        globalSearch,
        ...newFilters,
        isTeam: isTeamData
      }));
    } else {
      fetchData(
        page || 0, 
        size || (isTeamData ? teamPagination.pageSize : selfPagination.pageSize), 
        globalSearch, 
        newFilters, 
        isTeamData
      );
    }
  }, [dateRange, dispatch, isTeamData, teamPagination.pageSize, selfPagination.pageSize, 
      globalSearch, fetchData]);

  const handleSearchChange = useCallback((search, page, size) => {
    setGlobalSearch(search);
    
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(filterSubmissionsByTeamLead({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: page || 0,
        size: size || (isTeamData ? teamPagination.pageSize : selfPagination.pageSize),
        globalSearch: search,
        ...filters,
        isTeam: isTeamData
      }));
    } else {
      fetchData(
        page || 0, 
        size || (isTeamData ? teamPagination.pageSize : selfPagination.pageSize), 
        search, 
        filters, 
        isTeamData
      );
    }
  }, [dateRange, dispatch, isTeamData, teamPagination.pageSize, selfPagination.pageSize, 
      filters, fetchData]);

  const handleRefresh = useCallback(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const p = isTeamData ? teamPagination : selfPagination;
      dispatch(filterSubmissionsByTeamLead({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: p.currentPage,
        size: p.pageSize,
        globalSearch,
        ...filters,
        isTeam: isTeamData
      }));
    } else {
      const p = isTeamData ? teamPagination : selfPagination;
      fetchData(p.currentPage, p.pageSize, globalSearch, filters, isTeamData);
    }
  }, [dateRange, dispatch, isTeamData, teamPagination, selfPagination, globalSearch, filters, fetchData]);

  return (
    <BaseSubmission
      data={isTeamData ? teamData : selfData}
      loading={loading}
      title={isTeamData ? "Team Submissions" : "My Submissions"}
      refreshData={handleRefresh}
      enableTeamLeadTabs={shouldShowTabs}
      tabValue={tabValue}
      setTabValue={handleTabChange}
      pagination={isTeamData ? teamPagination : selfPagination}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onFilterChange={handleFilterChange}
      onSearchChange={handleSearchChange}
      role={role}
      enableServerSideFiltering
      onDateRangeChange={handleDateRangeChange}
      isFiltered={isTeamLeadFiltered}
    />
  );
};

export default TeamLeadSubmissions;