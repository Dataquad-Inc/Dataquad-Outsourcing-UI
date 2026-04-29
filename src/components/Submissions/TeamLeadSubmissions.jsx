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
import { set } from "date-fns";

// ─── stable initial pagination ───────────────────────────────────────────────
const INIT_PAGINATION = {
  totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10,
};

const TeamLeadSubmissions = () => {
  const [selfData, setSelfData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const [selfPagination, setSelfPagination] = useState(INIT_PAGINATION);
  const [teamPagination, setTeamPagination] = useState(INIT_PAGINATION);

  // ─── derive isTeamTab from tabValue (never stale) ──────────────────────────
  const isTeamTab = tabValue === 0;

  const { userId, role } = useSelector((state) => state.auth);
  const {
    isTeamLeadFiltered,
    filteredSubmissionsForTeamLead,
    filteredTeamLeadPagination,
  } = useSelector((state) => state.submission);

  const dispatch = useDispatch();

  // ─── refs ──────────────────────────────────────────────────────────────────
  const controllerRef          = useRef(null);
  const isMountedRef           = useRef(false);
  const hadTeamDataRef         = useRef(false);
  const loadedTabsRef          = useRef({ team: false, self: false });
  const pendingFilterTabRef    = useRef(true);   // which tab owns the next Redux result

  const teamPageSizeRef = useRef(10);
  const selfPageSizeRef = useRef(10);

  
  useEffect(() => {
    teamPageSizeRef.current = teamPagination.pageSize;
  }, [teamPagination.pageSize]);

  useEffect(() => {
    selfPageSizeRef.current = selfPagination.pageSize;
  }, [selfPagination.pageSize]);

  // ─── stable refs for search / filters / dateRange / tab ───────────────────
  // Callbacks read these refs instead of closing over state, so they never
  // go stale and never need those values in their dependency arrays.
  const globalSearchRef = useRef(globalSearch);
  const filtersRef      = useRef(filters);
  const dateRangeRef    = useRef(dateRange);
  const isTeamTabRef    = useRef(isTeamTab);

  useEffect(() => { globalSearchRef.current = globalSearch; }, [globalSearch]);
  useEffect(() => { filtersRef.current = filters; },         [filters]);
  useEffect(() => { dateRangeRef.current = dateRange; },     [dateRange]);
  useEffect(() => { isTeamTabRef.current = isTeamTab; },     [isTeamTab]);

  // ─── fetchData ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (
    page = 0, size = 10, searchValue = "", filterParams = {},
    isTeam = false, currentDateRange = null
  ) => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      const params = { page, size };
      if (isTeam) params.team = "true";
      if (searchValue?.trim()) params.globalSearch = searchValue.trim();
      if (currentDateRange?.startDate && currentDateRange?.endDate) {
        params.startDate = currentDateRange.startDate;
        params.endDate   = currentDateRange.endDate;
      }
      Object.entries(filterParams).forEach(([k, v]) => { if (v) params[k] = v; });

      const response = await axios.get(
        `https://mymulya.com/candidate/submissions/teamlead/${userId}`,
        { signal: controllerRef.current.signal, timeout: 30000, params }
      );

      if (isTeam) {
        const submissions = response.data?.teamSubmissions || [];
        setTeamData(submissions);
        setTeamPagination({
          totalElements: response.data?.totalTeamSubmissions || 0,
          totalPages:    response.data?.totalTeamPages|| 0,
          currentPage:   response.data?.currentPage?? page,
          pageSize:      response.data?.pageSize || size,
        });
        loadedTabsRef.current.team = true;
        return { totalElements: response.data?.totalTeamSubmissions || 0 };
      } else {
        const submissions = response.data?.selfSubmissions || [];
        setSelfData(submissions);
        setSelfPagination({
          totalElements: response.data?.totalSelfSubmissions || 0,
          totalPages:    response.data?.totalSelfPages        || 0,
          currentPage:   response.data?.currentPage          ?? page,
          pageSize:      response.data?.pageSize              || size,
        });
        loadedTabsRef.current.self = true;
        return { totalElements: response.data?.totalSelfSubmissions || 0 };
      }
    } catch (err) {
      if (axios.isCancel(err)) return;
      showToast(err.response?.data?.message || "Network error", "error");
      return { totalElements: 0 };
    } finally {
      setLoading(false);
      setInitialLoading(false);
      controllerRef.current = null;
    }
  }, [userId]); // Remove dateRange from dependencies

  // ─── dispatchFilter — always sets ref BEFORE dispatch ─────────────────────
  const dispatchFilter = useCallback(({
    startDate, endDate, page, size, search, filterParams, isTeam,
  }) => {
    pendingFilterTabRef.current = isTeam; // set BEFORE dispatch — sync effect reads this
    dispatch(filterSubmissionsByTeamLead({
      startDate, endDate,
      page:         page ?? 0,
      size,
      globalSearch: search ?? "",
      ...filterParams,
      isTeam,
    }));
  }, [dispatch]); // ✅ only dispatch — stable forever

  // ─── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData(0, 10, "", {}, true).then((result) => {
      if (result?.totalElements === 0) {
        setTabValue(1);
        fetchData(0, 10, "", {}, false);
      }
      isMountedRef.current = true;
    });
    return () => controllerRef.current?.abort();
  }, [fetchData]);

 
  useEffect(() => {
    if (!isTeamLeadFiltered || !filteredSubmissionsForTeamLead) return;

    const newData       = [...filteredSubmissionsForTeamLead];
    const newPagination = filteredTeamLeadPagination
      ? { ...filteredTeamLeadPagination } : undefined;

    if (pendingFilterTabRef.current) {
      setTeamData(newData);
      if (newPagination) setTeamPagination(newPagination);
    } else {
      setSelfData(newData);
      if (newPagination) setSelfPagination(newPagination);
    }
   
  }, [isTeamLeadFiltered, filteredSubmissionsForTeamLead, filteredTeamLeadPagination]);

  // tab visibility
  if (teamPagination.totalElements > 0) hadTeamDataRef.current = true;
  const shouldShowTabs = hadTeamDataRef.current;

  // ─── debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      // Read everything from refs — no stale closures possible
      const dr      = dateRangeRef.current;
      const isTeam  = isTeamTabRef.current;
      const search  = globalSearchRef.current;
      const fParams = filtersRef.current;
      const size    = isTeam ? teamPageSizeRef.current : selfPageSizeRef.current;

      if (dr.startDate && dr.endDate) {
        dispatchFilter({
          startDate: dr.startDate, endDate: dr.endDate,
          page: 0, size, search, filterParams: fParams, isTeam,
        });
      } else {
        fetchData(0, size, search, fParams, isTeam);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [globalSearch, dispatchFilter, fetchData]);


  // ─── date range ───────────────────────────────────────────────────────────
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    const isTeam = isTeamTabRef.current;
    const search = globalSearchRef.current;
    const fParams = filtersRef.current;

    if (startDate && endDate) {
      const size = isTeam ? teamPageSizeRef.current : selfPageSizeRef.current;
      setDateRange({ startDate, endDate });
      dispatch(setFilteredDataRequested(true));
      dispatch(setTeamLeadFilteredFlag(true));
      dispatchFilter({ startDate, endDate, page: 0, size, search, filterParams: fParams, isTeam });
    } else {
      setDateRange({ startDate: null, endDate: null });
      dispatch(setFilteredDataRequested(false));
      dispatch(setTeamLeadFilteredFlag(false));
      dispatch(resetTeamLeadFilteredSubmissions());
      loadedTabsRef.current = { team: false, self: false };
      const size = isTeam ? teamPageSizeRef.current : selfPageSizeRef.current;
      fetchData(0, size, search, fParams, isTeam, { startDate: null, endDate: null });
    }
  }, [dispatch, dispatchFilter, fetchData]);
  

  // ─── tab change ───────────────────────────────────────────────────────────
  const handleTabChange = useCallback((event, newValue) => {
    const isNowTeam = newValue === 0;
    setTabValue(newValue);

    const dr      = dateRangeRef.current;
    const search  = globalSearchRef.current;
    const fParams = filtersRef.current;
    const size    = isNowTeam ? teamPageSizeRef.current : selfPageSizeRef.current;

    if (dr.startDate && dr.endDate) {
      dispatchFilter({
        startDate: dr.startDate, endDate: dr.endDate,
        page: 0, size, search, filterParams: fParams, isTeam: isNowTeam,
      });
      return;
    }

    const alreadyLoaded = isNowTeam
      ? loadedTabsRef.current.team
      : loadedTabsRef.current.self;

    if (!alreadyLoaded) {
      fetchData(0, size, search, fParams, isNowTeam);
    }
  }, [dispatchFilter, fetchData]);
  

  // ─── page change ──────────────────────────────────────────────────────────
  const handlePageChange = useCallback((page, size) => {
    const dr      = dateRangeRef.current;
    const isTeam  = isTeamTabRef.current;
    const search  = globalSearchRef.current;
    const fParams = filtersRef.current;

    if (dr.startDate && dr.endDate) {
      dispatchFilter({ startDate: dr.startDate, endDate: dr.endDate, page, size, search, filterParams: fParams, isTeam });
    } else {
      fetchData(page, size, search, fParams, isTeam);
    }
  }, [dispatchFilter, fetchData]);

  // ─── rows per page change ─────────────────────────────────────────────────
  const handleRowsPerPageChange = useCallback((size) => {
    const dr      = dateRangeRef.current;
    const isTeam  = isTeamTabRef.current;
    const search  = globalSearchRef.current;
    const fParams = filtersRef.current;

    if (dr.startDate && dr.endDate) {
      dispatchFilter({ startDate: dr.startDate, endDate: dr.endDate, page: 0, size, search, filterParams: fParams, isTeam });
    } else {
      fetchData(0, size, search, fParams, isTeam);
    }
  }, [dispatchFilter, fetchData]);
  

  // ─── filter change ────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((newFilters, page, size) => {
    setFilters(newFilters);
    const dr     = dateRangeRef.current;
    const isTeam = isTeamTabRef.current;
    const search = globalSearchRef.current;
    const pgSize = size ?? (isTeam ? teamPageSizeRef.current : selfPageSizeRef.current);

    if (dr.startDate && dr.endDate) {
      dispatchFilter({ startDate: dr.startDate, endDate: dr.endDate, page: page ?? 0, size: pgSize, search, filterParams: newFilters, isTeam });
    } else {
      fetchData(page ?? 0, pgSize, search, newFilters, isTeam);
    }
  }, [dispatchFilter, fetchData]);

  // ─── search change ────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((search) => setGlobalSearch(search), []);

  // ─── refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    const dr      = dateRangeRef.current;
    const isTeam  = isTeamTabRef.current;
    const search  = globalSearchRef.current;
    const fParams = filtersRef.current;

    // Read current page from state snapshot via closure at call time is fine here
    // because refresh is always a direct user action, never triggered by effects
    if (dr.startDate && dr.endDate) {
      const p    = isTeam ? teamPagination : selfPagination;
      const size = isTeam ? teamPageSizeRef.current : selfPageSizeRef.current;
      dispatchFilter({ startDate: dr.startDate, endDate: dr.endDate, page: p.currentPage, size, search, filterParams: fParams, isTeam });
    } else {
      const p    = isTeam ? teamPagination : selfPagination;
      const size = isTeam ? teamPageSizeRef.current : selfPageSizeRef.current;
      fetchData(p.currentPage, size, search, fParams, isTeam);
    }
  }, [dispatchFilter, fetchData, teamPagination, selfPagination]);
  

  return (
    <BaseSubmission
      data={isTeamTab ? teamData : selfData}
      loading={initialLoading}
      title={isTeamTab ? "Team Submissions" : "My Submissions"}
      refreshData={handleRefresh}
      enableTeamLeadTabs={shouldShowTabs}
      tabValue={tabValue}
      setTabValue={handleTabChange}
      pagination={isTeamTab ? teamPagination : selfPagination}
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