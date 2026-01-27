import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import BaseSubmission from "./BaseSubmission";
import { showToast } from "../../utils/ToastNotification";

const TeamLeadSubmissions = () => {
  const [selfData, setSelfData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 🔑 Start with team tab (0) - tabs are now: 0 = team, 1 = self
  const [tabValue, setTabValue] = useState(0); // 0 = team (default), 1 = self
  const isTeamData = tabValue === 0;

  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");

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

  const controllerRef = useRef(null);

  // ================= FETCH =================
  const fetchData = useCallback(
    async (
      page = 0,
      size = 10,
      searchValue = "",
      filterParams = {},
      isTeam = false,
    ) => {
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

        if (isTeam) params.append("team", "true");

        if (searchValue?.trim()) {
          params.append("globalSearch", searchValue.trim());
        }

        Object.entries(filterParams).forEach(([k, v]) => {
          if (v) params.append(k, v);
        });

        const response = await fetch(
          `https://mymulya.com/candidate/submissions/teamlead/${userId}?${params}`,
          { signal: controllerRef.current.signal },
        );

        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();

        // ===== TEAM =====
        if (isTeam) {
          const teamSubmissions = result.teamSubmissions || [];
          setTeamData(teamSubmissions);
          setTeamPagination({
            totalElements:
              result.totalTeamSubmissions ||
              result.totalElements ||
              teamSubmissions.length,
            totalPages: result.totalTeamPages || result.totalPages || 1,
            currentPage: result.currentPage ?? page,
            pageSize: result.pageSize || size,
          });

          return {
            data: teamSubmissions,
            totalElements:
              result.totalTeamSubmissions ||
              result.totalElements ||
              teamSubmissions.length,
          };
        }

        // ===== SELF =====
        const selfSubmissions = result.selfSubmissions || [];
        setSelfData(selfSubmissions);
        setSelfPagination({
          totalElements:
            result.totalSelfSubmissions ||
            result.totalElements ||
            selfSubmissions.length,
          totalPages: result.totalSelfPages || result.totalPages || 1,
          currentPage: result.currentPage ?? page,
          pageSize: result.pageSize || size,
        });

        return {
          data: selfSubmissions,
          totalElements:
            result.totalSelfSubmissions ||
            result.totalElements ||
            selfSubmissions.length,
        };
      } catch (err) {
        if (err.name !== "AbortError") {
          showToast(err.message || "Network error", "error");
        }
        return { data: [], totalElements: 0 };
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [userId],
  );

  // ================= INITIAL LOAD (TEAM FIRST) =================
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First, try to load team data
        const teamResult = await fetchData(0, 10, "", {}, true);

        // If team has no data, also load self data
        if (teamResult.totalElements === 0) {
          await fetchData(0, 10, "", {}, false);
        }

        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Error initializing data:", error);
        setInitialLoadComplete(true);
      }
    };

    initializeData();

    return () => controllerRef.current?.abort();
  }, [fetchData]);

  // ================= DETERMINE TAB VISIBILITY =================
  const hasTeamData = teamPagination.totalElements > 0;
  const hasSelfData = selfPagination.totalElements > 0;

  // Show tabs only if there's team data
  const shouldShowTabs = hasTeamData;

  // If no team data and initial load is complete, switch to self view
  useEffect(() => {
    if (initialLoadComplete && !hasTeamData && tabValue === 0) {
      setTabValue(1); // Switch to self tab
    }
  }, [initialLoadComplete, hasTeamData, tabValue]);

  // ================= TAB CHANGE =================
  const handleTabChange = useCallback(
    async (event, newValue) => {
      setTabValue(newValue);

      // TEAM TAB CLICKED (index 0)
      if (newValue === 0 && teamData.length === 0) {
        await fetchData(0, 10, globalSearch, filters, true);
      }

      // SELF TAB CLICKED (index 1)
      if (newValue === 1 && selfData.length === 0) {
        await fetchData(0, 10, globalSearch, filters, false);
      }
    },
    [fetchData, globalSearch, filters, teamData.length, selfData.length],
  );

  // ================= HANDLERS =================
  const handlePageChange = (page, size) => {
    fetchData(page, size, globalSearch, filters, isTeamData);
  };

  const handleRowsPerPageChange = (size) => {
    fetchData(0, size, globalSearch, filters, isTeamData);
  };

  const handleFilterChange = (newFilters, page, size) => {
    setFilters(newFilters);
    fetchData(page, size, globalSearch, newFilters, isTeamData);
  };

  const handleSearchChange = (search, page, size) => {
    setGlobalSearch(search);
    fetchData(page, size, search, filters, isTeamData);
  };

  const handleRefresh = () => {
    const p = isTeamData ? teamPagination : selfPagination;
    fetchData(p.currentPage, p.pageSize, globalSearch, filters, isTeamData);
  };

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
    />
  );
};

export default TeamLeadSubmissions;