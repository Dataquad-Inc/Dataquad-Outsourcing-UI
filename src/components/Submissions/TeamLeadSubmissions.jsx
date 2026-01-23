import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import BaseSubmission from "./BaseSubmission";
import { showToast } from "../../utils/ToastNotification";

const TeamLeadSubmissions = () => {
  const [selfData, setSelfData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔑 Single source of truth
  const [tabValue, setTabValue] = useState(0); // 0 = self, 1 = team
  const isTeamData = tabValue === 1;

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

          return teamSubmissions;
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

        return selfSubmissions;
      } catch (err) {
        if (err.name !== "AbortError") {
          showToast(err.message || "Network error", "error");
        }
        return [];
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [userId],
  );

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchData(0, 10, "", {}, false);
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  // ================= TAB CHANGE (WITH FALLBACK) =================
  const handleTabChange = useCallback(
    async (event, newValue) => {
      setTabValue(newValue);

      // TEAM TAB CLICKED
      if (newValue === 1) {
        const teamResult = await fetchData(
          0,
          10,
          globalSearch,
          filters,
          true,
        );

        // 🔥 AUTO FALLBACK
        if (teamResult.length === 0 && selfData.length > 0) {
          showToast(
            "No team submissions found. Showing self submissions.",
            "info",
          );
          setTabValue(0);
        }
      }

      // SELF TAB CLICKED
      if (newValue === 0 && selfData.length === 0) {
        fetchData(0, 10, globalSearch, filters, false);
      }
    },
    [fetchData, globalSearch, filters, selfData.length],
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
      enableTeamLeadTabs
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
