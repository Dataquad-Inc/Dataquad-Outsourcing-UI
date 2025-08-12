import React, { useState, useEffect } from "react";
import DataTable from "../muiComponents/DataTabel";
import {
  IconButton,
  Box,
  Typography,
  Button,
  Chip,
  Tooltip,
  Drawer,
  CircularProgress,
  Skeleton,
  Stack,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Refresh,
  Edit as EditIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import CandidateSubmissionDrawer from "./CandidateSubmissionDrawer";
import { useSelector, useDispatch } from "react-redux";
import { fetchEmployees } from "../../redux/employeesSlice";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import ToastService from "../../Services/toastService";
import ComponentTitle from "../../utils/ComponentTitle";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import {
  fetchAssignedJobs,
  filterRequirementsByRecruiter,
  setFilteredReqDataRequested,
} from "../../redux/requirementSlice";

const topOffset = 68; // Height of the header
const bottomOffset =5;

const Assigned = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const { userId } = useSelector((state) => state.auth);
  const employeeList = useSelector((state) => state.employee.employeesList);
  const {
    filterAssignedRequirements,
    assignedJobs,
    loading: reduxLoading,
  } = useSelector((state) => state.requirement);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);

  const dispatch = useDispatch();

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    // Reset filter state when manually refreshing
    setIsFiltered(false);
    dispatch(setFilteredReqDataRequested(false));
  };

  useEffect(() => {
    ToastService.info("Loading assigned jobs...");
    dispatch(fetchAssignedJobs(userId));
    dispatch(fetchEmployees());
  }, [userId, refreshTrigger, dispatch]);

  useEffect(() => {
    if (!reduxLoading) {
      // Determine which data to use based on whether filtering is active
      const dataToUse = isFiltered ? filterAssignedRequirements : assignedJobs;

      if (dataToUse?.length > 0) {
        ToastService.success(`${dataToUse.length} jobs loaded successfully`);
        setColumns(generateColumns(dataToUse));
      } else if (error) {
        ToastService.error(error);
        setColumns([]);
      }
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [
    assignedJobs,
    filterAssignedRequirements,
    isFiltered,
    error,
    reduxLoading,
  ]);

  const handleSubmit = (row) => {
    const status = row.status?.toLowerCase();
    if (status === "hold") {
      ToastService.warning("Submission disabled for jobs with HOLD status");
      return;
    }

    setSelectedJob({
      userId: userId,
      jobId: row.jobId,
      clientName: row.clientName,
    });
    setMode("create");
    setSelectedCandidate(null);
    setOpenDrawer(true);
    ToastService.info(`Preparing submission for job: ${row.jobTitle}`);
  };

  const closeDrawer = () => {
    setOpenDrawer(false);
    setSelectedJob(null);
    setSelectedCandidate(null);
  };

  // Handle date filter application
  const handleDateFilterApply = (startDate, endDate) => {
    if (startDate && endDate) {
      dispatch(filterRequirementsByRecruiter({ startDate, endDate }))
        .then(() => {
          setIsFiltered(true);
          ToastService.success("Filter applied successfully");
        })
        .catch((err) => {
          ToastService.error("Failed to apply filter");
        });
    }
  };

  // Handle clearing date filter
  const handleClearFilter = () => {
    setIsFiltered(false);
    dispatch(fetchAssignedJobs(userId));
    ToastService.info("Filter cleared");
  };

  const renderStatus = (status) => {
    const statusLower = status?.toLowerCase();
    let color = "default";

    switch (statusLower) {
      case "submitted":
        color = "success";
        break;
      case "closed":
        color = "error";
        break;
      case "on hold":
      case "hold":
        color = "warning";
        break;
      case "in progress":
        color = "info";
        break;
      default:
        color = "default";
    }

    return <Chip label={status || "Unknown"} size="small" color={color} />;
  };

  const getExpandedContentConfig = () => {
    return {
      title: "Job Description",
      description: {
        key: "jobDescription",
        fallback: "No description available.",
      },
      backgroundColor: "#f5f5f5",
      sections: [
        {
          title: "Job Details",
          fields: [
            { label: "Type", key: "jobType", fallback: "-" },
            { label: "Mode", key: "jobMode", fallback: "-" },
            { label: "Location", key: "location", fallback: "-" },
          ],
        },
        {
          title: "Requirements",
          fields: [
            { label: "Experience", key: "experienceRequired", fallback: "-" },
            {
              label: "Relevant Experience",
              key: "relevantExperience",
              fallback: "-",
            },
            { label: "Qualification", key: "qualification", fallback: "-" },
          ],
        },
        {
          title: "Additional Info",
          fields: [
            {
              label: "Posted Date",
              key: "requirementAddedTimeStamp",
              fallback: "-",
            },
            { label: "Notice Period", key: "noticePeriod", fallback: "-" },
            { label: "Positions", key: "noOfPositions", fallback: "-" },
            { label: "Salary Package", key: "salaryPackage", fallback: "-" },
            { label: "Assigned By", key: "assignedBy", fallback: "-" },
          ],
        },
      ],
      actions: [
        {
          label: "Submit Candidate",
          icon: <AssignmentIcon />,
          onClick: (row) => handleSubmit(row),
          variant: "contained",
          size: "small",
          color: "primary",
          sx: { mr: 1 },
          disabled: (row) => row.status?.toLowerCase() === "hold",
        },
      ],
    };
  };

  const renderExpandedContent = (row) => {
    if (loading) {
      return (
        <Box sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Skeleton variant="rectangular" width="30%" height={100} />
            <Skeleton variant="rectangular" width="30%" height={100} />
            <Skeleton variant="rectangular" width="30%" height={100} />
          </Box>
        </Box>
      );
    }
    return (
      <ReusableExpandedContent row={row} config={getExpandedContentConfig()} />
    );
  };

  const generateColumns = (data) => {
    if (!data || data.length === 0) return [];

    return [
      {
        key: "jobId",
        label: "Job ID",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "jobTitle",
        label: "Job Title",
        type: "text",
        sortable: true,
        filterable: true,
        width: 200,
      },
      {
        key: "clientName",
        label: "Client",
        type: "text",
        sortable: true,
        filterable: true,
      },
      {
        key: "assignedBy",
        label: "Assigned By",
        type: "text",
        sortable: true,
        filterable: true,
      },
      {
        key: "age",
        label: "Age Of Requirement",
        type: "text",
        sortable: true,
        filterable: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        sortable: true,
        filterable: true,
        render: (row) => renderStatus(row.status),
        width: 120,
        options: ["Open", "Closed", "On Hold", "In Progress"],
      },
      {
        key: "location",
        label: "Location",
        type: "text",
        sortable: true,
        filterable: true,
      },
      {
        key: "experienceRequired",
        label: "Experience",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "requirementAddedTimeStamp",
        label: "Posted Date",
        type: "date",
        sortable: true,
        filterable: true,
        width: 150,
        render: (row) =>
          new Date(row.requirementAddedTimeStamp).toLocaleDateString(),
      },
      {
        key: "noOfPositions",
        label: "Positions",
        type: "number",
        sortable: true,
        filterable: true,
        width: 100,
        align: "center",
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        width: 160,
        align: "center",
        render: (row) => {
          const isDisabled =
            row.status?.toLowerCase() === "hold" ||
            row.status?.toLowerCase() === "closed";
          return (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Tooltip
                title={
                  isDisabled
                    ? "Submission disabled for HOLD status"
                    : "Submit Candidate"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => handleSubmit(row)}
                    disabled={isDisabled}
                    startIcon={<AssignmentIcon fontSize="small" />}
                  >
                    Submit
                  </Button>
                </span>
              </Tooltip>
            </Box>
          );
        },
      },
    ];
  };

  // Use filtered data when filter is applied, otherwise use all assigned jobs
  const dataToDisplay = isFiltered ? filterAssignedRequirements : assignedJobs;

  const processedData = loading
    ? Array(5)
        .fill({})
        .map((_, index) => ({
          jobId: index,
          expandContent: renderExpandedContent,
        }))
    : dataToDisplay.map((row) => ({
        ...row,
        expandContent: renderExpandedContent,
      }));

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">Error: {error.message}</Typography>
        <Button
          variant="outlined"
          onClick={refreshData}
          startIcon={<Refresh />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          mb: 3,
          justifyContent: "space-between",
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Box>
          <Typography variant="h6" color="primary">
            {isFiltered ? "Filtered Assigned Jobs" : "Assigned Jobs"}
          </Typography>
          {isFiltered && (
            <Chip
              label="Filter Active"
              color="info"
              size="small"
              onDelete={handleClearFilter}
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <DateRangeFilter
          component="AssignedList"
          onApply={handleDateFilterApply}
          onClear={handleClearFilter}
        />
      </Stack>
      <DataTable
        data={processedData}
        columns={columns}
        title=""
        loading={loading}
        enableSelection={false}
        defaultSortColumn="requirementAddedTimeStamp"
        defaultSortDirection="desc"
        defaultRowsPerPage={10}
        refreshData={refreshData}
        primaryColor="#00796b"
        secondaryColor="#e0f2f1"
        customStyles={{
          headerBackground: "#1976d2",
          rowHover: "#e0f2f1",
          selectedRow: "#b2dfdb",
        }}
        uniqueId="jobId"
      />
      <Drawer
        open={openDrawer}
        onClose={closeDrawer}
        anchor="right"
        sx={{}}
        PaperProps={{
          sx: {
            position: "fixed",
            top: `${topOffset}px`,
            bottom: `${bottomOffset}px`,
            height: `calc(100vh - ${topOffset + bottomOffset}px)`,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            
          },
        }}
      >
        {selectedJob && (
          <CandidateSubmissionDrawer
            userId={selectedJob?.userId}
            jobId={selectedJob?.jobId}
            clientName={selectedJob?.clientName}
            candidateData={selectedCandidate}
            mode={mode}
            onClose={closeDrawer}
            refreshData={refreshData}
            employeeEmail={employeeList
              .filter((employee) => employee.employeeId === userId)
              .map((employee) => employee.email)}
          />
        )}
      </Drawer>
    </>
  );
};

export default Assigned;
