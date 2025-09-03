import React, { useState, useCallback } from "react";
import { Button, MenuItem, TextField, Stack } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getRequirementsColumns from "./requirementsColumns";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { CustomModal } from "../../ui-lib/CustomModal";
import { useNavigate } from "react-router-dom";

const RequirementsList = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [formValues, setFormValues] = useState({ status: "", jobMode: "" });

  const [requirements, setRequirements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  // Dummy data for demonstration
  const dummyRequirements = [
    {
      id: 1,
      jobId: "JOB-001",
      clientName: "TechCorp Inc.",
      jobTitle: "Senior Frontend Developer",
      jobMode: "Remote",
      location: "San Francisco, CA",
      employmentType: "FullTime",
      noOfPositions: 3,
      skills: "React, JavaScript, TypeScript, CSS",
      experience: 5,
      relevantExperience: 3,
      qualification: "Bachelor's in Computer Science",
      noticePeriod: 30,
      salaryPackage: 120000,
      payrollType: "W2",
      status: "Open",
      jobPostedDate: "2023-10-15",
      jobClosingDate: "2023-11-15",
      jdFile: "jd_techcorp_frontend.pdf",
      jobDescription:
        "Looking for an experienced frontend developer with strong React skills.",
      notes: "Urgent requirement, priority hiring",
      assignedBy: "John Smith",
    },
    {
      id: 2,
      jobId: "JOB-002",
      clientName: "DataSystems LLC",
      jobTitle: "Data Scientist",
      jobMode: "Hybrid",
      location: "New York, NY",
      employmentType: "FullTime",
      noOfPositions: 2,
      skills: "Python, Machine Learning, SQL, TensorFlow",
      experience: 4,
      relevantExperience: 4,
      qualification: "Master's in Data Science",
      noticePeriod: 15,
      salaryPackage: 130000,
      payrollType: "W2",
      status: "Open",
      jobPostedDate: "2023-10-20",
      jobClosingDate: "2023-11-20",
      jdFile: null,
      jobDescription:
        "Seeking data scientist with ML experience for analytics team.",
      notes: "Looking for candidates with healthcare domain experience",
      assignedBy: "Sarah Johnson",
    },
    {
      id: 3,
      jobId: "JOB-003",
      clientName: "CloudTech Solutions",
      jobTitle: "DevOps Engineer",
      jobMode: "Onsite",
      location: "Austin, TX",
      employmentType: "Contract",
      noOfPositions: 1,
      skills: "AWS, Docker, Kubernetes, Jenkins",
      experience: 6,
      relevantExperience: 4,
      qualification: "Bachelor's in IT",
      noticePeriod: 0,
      salaryPackage: 95000,
      payrollType: "C2C",
      status: "OnHold",
      jobPostedDate: "2023-09-10",
      jobClosingDate: "2023-10-10",
      jdFile: "devops_position.pdf",
      jobDescription:
        "DevOps engineer needed for cloud infrastructure management.",
      notes: "Project on hold until budget approval",
      assignedBy: "Mike Wilson",
    },
    {
      id: 4,
      jobId: "JOB-004",
      clientName: "FinanceBank Corp",
      jobTitle: "Java Backend Developer",
      jobMode: "Hybrid",
      location: "Chicago, IL",
      employmentType: "FullTime",
      noOfPositions: 4,
      skills: "Java, Spring Boot, Microservices, SQL",
      experience: 5,
      relevantExperience: 4,
      qualification: "Bachelor's in Computer Engineering",
      noticePeriod: 45,
      salaryPackage: 110000,
      payrollType: "W2",
      status: "Closed",
      jobPostedDate: "2023-08-05",
      jobClosingDate: "2023-09-05",
      jdFile: "java_backend_jd.docx",
      jobDescription: "Backend developer for financial services applications.",
      notes: "Position filled successfully",
      assignedBy: "Lisa Brown",
    },
    {
      id: 5,
      jobId: "JOB-005",
      clientName: "HealthTech Innovations",
      jobTitle: "UI/UX Designer",
      jobMode: "Remote",
      location: "Boston, MA",
      employmentType: "PartTime",
      noOfPositions: 1,
      skills: "Figma, Adobe XD, User Research, Prototyping",
      experience: 3,
      relevantExperience: 2,
      qualification: "Bachelor's in Design",
      noticePeriod: 15,
      salaryPackage: 85000,
      payrollType: "1099",
      status: "Open",
      jobPostedDate: "2023-10-25",
      jobClosingDate: "2023-11-25",
      jdFile: null,
      jobDescription: "UI/UX designer for healthcare application redesign.",
      notes: "Looking for someone with healthcare UI experience",
      assignedBy: "David Lee",
    },
  ];

  /** ---------------- Fetch Requirements ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const filteredData = dummyRequirements.filter(
        (req) =>
          req.clientName.toLowerCase().includes(search.toLowerCase()) ||
          req.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
          req.skills.toLowerCase().includes(search.toLowerCase()) ||
          req.jobId.toLowerCase().includes(search.toLowerCase())
      );

      // Apply pagination
      const startIndex = page * rowsPerPage;
      const paginatedData = filteredData.slice(
        startIndex,
        startIndex + rowsPerPage
      );

      setRequirements(paginatedData);
      setTotal(filteredData.length);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      showErrorToast("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  /** ---------------- Delete ---------------- */
  const handleDelete = useCallback((row) => {
    const deleteAction = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        showSuccessToast("Requirement deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Delete error:", error);
        showErrorToast("Failed to delete requirement");
      }
    };

    showDeleteConfirm(deleteAction, `${row.jobTitle} at ${row.clientName}`);
  }, []);

  /** ---------------- Create ---------------- */
  const handleCreateNew = () => {
    showInfoToast("Create new requirement clicked");
    // Navigate to create form
    navigate("/requirements/create");
  };

  /** ---------------- View JD ---------------- */
  const handleViewJD = (row) => {
    if (row.jdFile) {
      showInfoToast(`Opening JD file: ${row.jdFile}`);
      // In real implementation, you would download or open the file
    } else {
      showInfoToast("No JD file available for this requirement");
    }
  };

  /** ---------------- Navigate to Requirement Profile ---------------- */
  const handleNagivateToReqProfile = (row) => {
    navigate(`/dashboard/us-requirements/${row.jobId}`);
  };

  /** ---------------- Edit ---------------- */
  const handleEdit = (row) => {
    setSelectedRequirement(row);
    setFormValues({
      status: row.status || "",
      jobMode: row.jobMode || "",
    });
    setOpenEdit(true);
  };

  const handleSave = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      showSuccessToast("Requirement updated successfully");
      setOpenEdit(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Update error:", error);
      showErrorToast("Failed to update requirement");
    }
  };

  /** ---------------- Columns ---------------- */
  const columns = getRequirementsColumns({
    handleEdit,
    handleDelete,
    loading,
    onViewJD: handleViewJD,
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
        onCreateNew={handleCreateNew}
      />

      {/* ✅ Edit Dialog */}
      <CustomModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={`Edit Requirement - ${selectedRequirement?.jobTitle}`}
        actions={
          <>
            <Button onClick={() => setOpenEdit(false)} variant="outlined">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Update Requirement
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Status"
            value={formValues.status}
            onChange={(e) =>
              setFormValues({ ...formValues, status: e.target.value })
            }
            fullWidth
          >
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
            <MenuItem value="OnHold">On Hold</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </TextField>

          <TextField
            select
            label="Job Mode"
            value={formValues.jobMode}
            onChange={(e) =>
              setFormValues({ ...formValues, jobMode: e.target.value })
            }
            fullWidth
          >
            <MenuItem value="Remote">Remote</MenuItem>
            <MenuItem value="Onsite">Onsite</MenuItem>
            <MenuItem value="Hybrid">Hybrid</MenuItem>
          </TextField>
        </Stack>
      </CustomModal>
    </>
  );
};

export default RequirementsList;