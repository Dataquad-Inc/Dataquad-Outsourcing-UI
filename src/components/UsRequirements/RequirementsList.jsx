import React, { useState, useCallback, useEffect } from "react";
import { Button, Stack, Box, Typography } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRequirementsColumns from "./requirementsColumns";
import { showErrorToast } from "../../utils/toastUtils";
import { CustomModal } from "../../ui-lib/CustomModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const RequirementsList = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [formValues, setFormValues] = useState({});

  const [requirements, setRequirements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  // Define which fields are editable
  const editableFields = [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: ["Open", "Closed", "OnHold", "Cancelled"],
    },
    {
      id: "jobMode",
      label: "Job Mode",
      type: "select",
      options: ["Remote", "Onsite", "Hybrid"],
    },
    {
      id: "jobType",
      label: "Employment Type",
      type: "select",
      options: ["FullTime", "PartTime", "Contract", "Temporary"],
    },
    { id: "noticePeriod", label: "Notice Period", type: "text" },
    { id: "salaryPackage", label: "Salary Package", type: "text" },
    { id: "noOfPositions", label: "Number of Positions", type: "number" },
    { id: "experienceRequired", label: "Experience Required", type: "text" },
    { id: "relevantExperience", label: "Relevant Experience", type: "text" },
    { id: "qualification", label: "Qualification", type: "text" },
  ];



const fetchData = useCallback(async () => {
  try {
    setLoading(true);

    const response = await axios.get(
      "https:mymulya.com/api/us/requirements/allRequirements",
      {
        params: {
          page,
          size: rowsPerPage,
          // If you want search filter later, you can add:
          // search: search || ""
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    if (data.success && data.data) {
      setRequirements(data.data.content || []);
      setTotal(data.data.totalElements || 0);
    } else {
      showErrorToast(data.message || "Failed to load requirements");
      setRequirements([]);
      setTotal(0);
    }
  } catch (error) {
    console.error("Error fetching requirements:", error);
    showErrorToast(
      error.response?.data?.message || "Failed to load requirements"
    );
    setRequirements([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}, [page, rowsPerPage, search]);


  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  /** ---------------- Navigate to Requirement Profile ---------------- */
  const handleNagivateToReqProfile = (row) => {
    navigate(`/dashboard/us-requirements/${row.jobId}`);
  };

  /** ---------------- Columns ---------------- */
  const columns = getRequirementsColumns({
    handleNagivateToReqProfile: handleNagivateToReqProfile,
  });

  /** ---------------- Render ---------------- */
  return (
    <>
      <CustomDataTable
        title="Job Requirements"
        columns={columns}
        rows={requirements}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={loading}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onSearchChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        onSearchClear={() => {
          setSearch("");
          setPage(0);
        }}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />
    </>
  );
};

export default RequirementsList;
