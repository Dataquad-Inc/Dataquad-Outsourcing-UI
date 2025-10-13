import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getRequirementDetailsByJobId } from "../../../redux/requirementSlice";
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ToastNotification, { showToast } from "../../../utils/ToastNotification";
import MuiButton from "../../muiComponents/MuiButton";
import DataTable from "../../muiComponents/DataTabel"; 
import { generateCandidatesColumns, generateInterviewsColumns, generatePlacementsColumns, generateJobDetailsColumns } from "./JobDetailsTabelConfig";

const JobDetails = () => {
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const location = useLocation();
  const { requirementDetails, loading, error } = useSelector(
    (state) => state.requirement
  );

  const { role } = useSelector((state) => state.auth);

  useEffect(() => {
    if (jobId) {
      dispatch(getRequirementDetailsByJobId(jobId));
      showToast(`Viewing Job ID: ${jobId}`, "info");
    }
  }, [dispatch, jobId]);

  useEffect(() => {
    if (error) {
      showToast(`Error loading job details: ${error}`, "error");
    }
  }, [error]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleBackClick = () => {
    const fromPath = location.state?.from;
    
    // Check if coming from In-Progress component
    if (fromPath && fromPath.includes('/dashboard/InProgress')) {
      navigate('/dashboard/InProgress');
    }
    if (fromPath && fromPath.includes('/dashboard/submissions')) {
      navigate('/dashboard/submissions');
    }
    // Check if coming from general interviews
    else if (fromPath && fromPath.includes('/dashboard/interviews')) {
      navigate('/dashboard/interviews');
    }
    // Role-based fallback
    else if (role === "SUPERADMIN" || role === "TEAMLEAD") {
      navigate("/dashboard/requirements");
    } 
    else {
      navigate("/dashboard/interviews");
    }
  };

  const getBackButtonText = () => {
    const fromPath = location.state?.from;
    
    if (fromPath && fromPath.includes('/dashboard/InProgress')) {
      return "Back to In-Progress";
    }
    else if (fromPath && fromPath.includes('/dashboard/interviews')) {
      return "Back to Interviews";
    }
    else if (fromPath && fromPath.includes('/dashboard/submissions')) {
      return "Back to Submissions";
    }
    else if (role === "SUPERADMIN" || role === "TEAMLEAD") {
      return "Back to Requirements";
    }
    else {
      return "Back to Interviews";
    }
  };

  const renderDetailTable = (data, columns) => {
    if (!data) return null;

    return (
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableBody>
            {columns.map((column) => (
              <TableRow key={column.id || column.key}>
                <TableCell
                  component="th"
                  sx={{ fontWeight: "bold", width: "30%" }}
                >
                  {column.label}
                </TableCell>
                <TableCell>
                  {column.render ? column.render(data) : data[column.key || column.id]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <>
      <ToastNotification />
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <MuiButton
            variant="outlined"
            color="primary"
            onClick={handleBackClick}
          >
            {getBackButtonText()}
          </MuiButton>
          <Typography
            variant="h5"
            sx={{
              borderRadius: 2,
              p: 1,
              bgcolor: "#ffffff",
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
              color: "#333",
              fontWeight: 400,
            }}
          >
            {requirementDetails?.requirement?.jobtitle}
          </Typography>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={3}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{
                alignItems: "flex-start",
                justifyContent: "flex-start",
                borderBottom: 1,
                borderColor: "divider",
                px: 2,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Tab label="Job Details" />
              <Tab label="Candidates" />
              <Tab label="Interviews" />
              <Tab label="Placements" />
            </Tabs>

            <Box p={3}>
              {tabIndex === 0 && (
                <>
                  {loading ? (
                    <Box display="flex" justifyContent="center">
                      <CircularProgress />
                    </Box>
                  ) : requirementDetails?.requirement && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Job Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {renderDetailTable(
                        requirementDetails.requirement,
                        generateJobDetailsColumns()
                      )}
                    </Box>
                  )}
                </>
              )}

              {tabIndex === 1 && (
                <DataTable
                  data={requirementDetails?.submittedCandidates || []}
                  columns={generateCandidatesColumns()}
                  title="Submitted Candidates"
                  enableSelection={false}
                  defaultSortColumn="candidateName"
                  defaultSortDirection="asc"
                  defaultRowsPerPage={10}
                  primaryColor="#00796b"
                  secondaryColor="#e0f2f1"
                  customStyles={{
                    headerBackground: "#1976d2",
                    rowHover: "#e0f2f1",
                    selectedRow: "#b2dfdb",
                  }}
                  uniqueId="candidateId"
                />
              )}

              {tabIndex === 2 && (
                <DataTable
                  data={requirementDetails?.interviewScheduledCandidates || []}
                  columns={generateInterviewsColumns()}
                  title="Interview Schedules"
                  enableSelection={false}
                  defaultSortColumn="interviewDateTime"
                  defaultSortDirection="desc"
                  defaultRowsPerPage={10}
                  primaryColor="#00796b"
                  secondaryColor="#e0f2f1"
                  customStyles={{
                    headerBackground: "#1976d2",
                    rowHover: "#e0f2f1",
                    selectedRow: "#b2dfdb",
                  }}
                  uniqueId="candidateId"
                />
              )}

              {tabIndex === 3 && (
                <DataTable
                  data={requirementDetails?.placements || []}
                  columns={generatePlacementsColumns()}
                  title="Placements"
                  enableSelection={false}
                  defaultSortColumn="placedDate"
                  defaultSortDirection="desc"
                  defaultRowsPerPage={10}
                  primaryColor="#00796b"
                  secondaryColor="#e0f2f1"
                  customStyles={{
                    headerBackground: "#1976d2",
                    rowHover: "#e0f2f1",
                    selectedRow: "#b2dfdb",
                  }}
                  uniqueId="candidateId"
                />
              )}
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default JobDetails;