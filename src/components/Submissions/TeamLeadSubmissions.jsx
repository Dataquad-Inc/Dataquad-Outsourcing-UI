import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import BaseSubmission from "./BaseSubmission";
import { showToast } from "../../utils/ToastNotification";

const TeamLeadSubmissions = () => {
  const [selfData, setSelfData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isTeamData, setIsTeamData] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 5,
    totalSelfPages: 0,
    totalTeamPages: 0,
    totalSelfSubmissions: 0,
    totalTeamSubmissions: 0
  });

  const { userId, role } = useSelector((state) => state.auth);

  const fetchData = useCallback(async (page = 0, size = 5) => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://mymulya.com/candidate/submissions/teamlead/${userId}?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
            // Authorization: `Bearer ${token}` // add if needed
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      console.log("Fetched data:", data);

      setSelfData(data.selfSubmissions || []);
      setTeamData(data.teamSubmissions || []);

      setPagination({
        currentPage: data.currentPage || 0,
        pageSize: data.pageSize || 5,
        totalSelfPages: data.totalSelfPages || 0,
        totalTeamPages: data.totalTeamPages || 0,
        totalSelfSubmissions: data.totalSelfSubmissions || 0,
        totalTeamSubmissions: data.totalTeamSubmissions || 0
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      showToast("Failed to load submissions", "error");
      setSelfData([]);
      setTeamData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshData = useCallback(() => {
    fetchData(pagination.currentPage, pagination.pageSize);
  }, [fetchData, pagination.currentPage, pagination.pageSize]);

  const handlePageChange = useCallback((newPage) => {
    fetchData(newPage, pagination.pageSize);
  }, [fetchData, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentData = isTeamData ? teamData : selfData;
  const totalPages = isTeamData ? pagination.totalTeamPages : pagination.totalSelfPages;
  const totalItems = isTeamData
    ? pagination.totalTeamSubmissions
    : pagination.totalSelfSubmissions;

  return (
    <BaseSubmission
      data={currentData}
      loading={loading}
      setLoading={setLoading}
      componentName="TeamLeadSubmissions"
      title={isTeamData ? "Team Submissions" : "My Submissions"}
      refreshData={refreshData}
      enableTeamLeadTabs={true}
      isTeamData={isTeamData}
      setIsTeamData={setIsTeamData}
      tabValue={tabValue}
      setTabValue={setTabValue}
      role={role}
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        pageSize: pagination.pageSize,
        onPageChange: handlePageChange
      }}
    />
  );
};

export default TeamLeadSubmissions;
