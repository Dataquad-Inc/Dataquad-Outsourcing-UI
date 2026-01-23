import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import httpService from "../../Services/httpService";
import BaseSubmission from "./BaseSubmission";
import { showToast } from "../../utils/ToastNotification";

const RecruiterSubmissions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { userId, role } = useSelector((state) => state.auth);
  const { isFilteredDataRequested, filteredSubmissionsForRecruiter } = useSelector(
    (state) => state.submission
  );

const fetchData = useCallback(async () => {
  try {
    setLoading(true);

    const response = await fetch(
      `https://mymulya.com/candidate/submissionsByUserId/${userId}`,
      // `http://localhost:8085/candidate/submissionsByUserId/ADRTIN025`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    const submissions = result?.data || result || [];

    console.log("Fetched recruiter submissions:", submissions.length);
    setData(submissions);
  } catch (error) {
    console.error("Error fetching recruiter submissions:", error);
    showToast("Failed to load submissions", "error");
    setData([]);
  } finally {
    setLoading(false);
  }
}, [userId]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use filtered data if requested, otherwise use fetched data
  const displayData = isFilteredDataRequested 
    ? filteredSubmissionsForRecruiter 
    : data;

  return (
    <BaseSubmission
      data={displayData}
      loading={loading}
      setLoading={setLoading}
      componentName="RecruiterSubmissions"
      title="My Submissions"
      refreshData={fetchData}
      role={role}
    />
  );
};

export default RecruiterSubmissions;