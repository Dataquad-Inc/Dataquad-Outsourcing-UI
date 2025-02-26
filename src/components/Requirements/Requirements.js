import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  Grid,
  Checkbox,
  MenuItem,
  Select,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "../../redux/features/employeesSlice";
import RequirementsTable from "./RequirementsTable";
import BASE_URL from "../../redux/config";
import CloseIcon from "@mui/icons-material/Close";
import SectionHeader from "../MuiComponents/SectionHeader";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CustomDialog from "../MuiComponents/CustomDialog";
import JobEditDialog from "./JobEditDialog";

// const BASE_URL = "http://192.168.0.246:8111";

const Requirements = () => {
  const dispatch = useDispatch();
  const { employeesList } = useSelector((state) => state.employees);
  const [requirementsList, setRequirementsList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const [openDescriptionDialog, setOpenDescriptionDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const recruiters = employeesList.filter(
    (emp) => emp.roles === "EMPLOYEE" && emp.status === "ACTIVE"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequirements().finally(() => setIsRefreshing(false));
  };

  // Function to open the description dialog
  const handleOpenDescriptionDialog = (description, jobTitle) => {
    setDialogTitle(jobTitle);
    setDialogContent(description);
    setOpenDescriptionDialog(true);
  };

  const handleCloseDescriptionDialog = () => {
    setOpenDescriptionDialog(false);
    setDialogTitle("");
    setDialogContent("");
  };

  useEffect(() => {
    dispatch(fetchEmployees());
    fetchRequirements();
  }, [dispatch]);

  const fetchRequirements = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/requirements/getAssignments`
      );
      setRequirementsList(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load job requirements");
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    if (!job) return;
  
    // Ensure recruiter data is properly structured
    const recruiterNames = Array.isArray(job.recruiterName) ? job.recruiterName : [];
    const recruiterIds = Array.isArray(job.recruiterIds) ? job.recruiterIds : [];
  
    // Map recruiter IDs and names correctly
    const uniqueRecruiters = recruiterIds.map((id, index) => ({
      id,
      name: recruiterNames[index] || "",
    }));
  
    // Remove duplicates
    const filteredRecruiters = uniqueRecruiters.reduce((acc, emp) => {
      if (emp.id && !acc.some((e) => e.id === emp.id)) {
        acc.push(emp);
      }
      return acc;
    }, []);
  
    setEditFormData({
      ...job,
      recruiterName: filteredRecruiters.map((emp) => emp.name),
      recruiterIds: filteredRecruiters.map((emp) => emp.id),
      jobDescription: job.jobDescription || "", // Ensure description is always a string
      jobDescriptionBlob: job.jobDescriptionBlob || "", // Ensure file data is handled
    });
  
    setEditDialogOpen(true);
  };
  

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
  
    try {
      const updatedFormData = new FormData();
  
      updatedFormData.append("jobId", editFormData.jobId);
      updatedFormData.append("jobTitle", editFormData.jobTitle);
      updatedFormData.append("clientName", editFormData.clientName);
      updatedFormData.append("experienceRequired", editFormData.experienceRequired);
      updatedFormData.append("jobMode", editFormData.jobMode);
      updatedFormData.append("jobType", editFormData.jobType);
      updatedFormData.append("location", editFormData.location);
      updatedFormData.append("noOfPositions", editFormData.noOfPositions);
      updatedFormData.append("noticePeriod", editFormData.noticePeriod);
      updatedFormData.append("qualification", editFormData.qualification);
      updatedFormData.append("relevantExperience", editFormData.relevantExperience);
      updatedFormData.append("requirementAddedTimeStamp", editFormData.requirementAddedTimeStamp);
      updatedFormData.append("salaryPackage", `${editFormData.salaryPackage}`);
      updatedFormData.append("status", editFormData.status);
  
      // ✅ Ensure recruiterIds and recruiterName are formatted as JSON strings
      updatedFormData.append("recruiterIds", JSON.stringify(editFormData.recruiterIds || []));
      updatedFormData.append("recruiterName", JSON.stringify(editFormData.recruiterName || []));
  
      // ✅ Handle Job Description (Text or File)
      if (editFormData.jobDescription && editFormData.jobDescription.trim() !== "") {
        updatedFormData.append("jobDescription", editFormData.jobDescription);
      }
  
      if (editFormData.jobDescriptionBlob instanceof File) {
        updatedFormData.append("jobDescriptionFile", editFormData.jobDescriptionBlob); 
      } else if (editFormData.jobDescriptionFile) {
        updatedFormData.append("jobDescriptionFile", editFormData.jobDescriptionBlob); 
      }
  
      // ✅ Make API request
      await axios.put(
        `${BASE_URL}/requirements/updateRequirement/${editFormData.jobId}`,
        updatedFormData,
        { headers: { "Content-Type": "multipart/form-data" } } // ✅ Correct Content-Type
      );
  
      setSnackbar({
        open: true,
        message: "Job requirement updated successfully",
        severity: "success",
      });
  
      handleCloseEditDialog();
      fetchRequirements();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to update job requirement",
        severity: "error",
      });
    }
  };
  
  

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${BASE_URL}/requirements/deleteRequirement/${jobToDelete}`
      );
      setSnackbar({
        open: true,
        message: "Job requirement deleted successfully",
        severity: "success",
      });
      fetchRequirements();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete job requirement",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const handleSelectRecruiter = (event) => {
    const selectedNames = event.target.value;
    const selectedRecruiters = selectedNames.map((name) =>
      recruiters.find((emp) => emp.userName === name)
    );

    // Ensure unique recruiter IDs
    const uniqueRecruiters = selectedRecruiters.reduce((acc, emp) => {
      if (emp && !acc.some((e) => e.employeeId === emp.employeeId)) {
        acc.push(emp);
      }
      return acc;
    }, []);

    setEditFormData((prev) => ({
      ...prev,
      recruiterName: uniqueRecruiters.map((emp) => emp.userName),
      recruiterIds: uniqueRecruiters.map((emp) => emp.employeeId),
    }));
  };

  return (
    <Container
      maxWidth={false} // 1) No fixed max width
      disableGutters // 2) Remove horizontal padding
      sx={{
        width: "100%", // Fill entire viewport width
        height: "calc(100vh - 20px)", // Fill entire viewport height
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      <SectionHeader
        title="Requirements List"
        totalCount={requirementsList.length} // ✅ Pass count instead of array
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        icon={<ListAltIcon sx={{ color: "#FFF" }} />}
        sx={{
          backgroundColor: "#00796b",
          color: "white",
          padding: 2,
          borderRadius: 1,
          fontWeight: 600,
        }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <RequirementsTable
            requirementsList={requirementsList}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
            handleOpenDescriptionDialog={handleOpenDescriptionDialog} // Pass the dialog handler
            recruiters={recruiters}
          />

          {/* Edit Dialog */}
          <JobEditDialog
            editDialogOpen={editDialogOpen}
            handleCloseEditDialog={handleCloseEditDialog}
            editFormData={editFormData}
            handleInputChange={handleInputChange}
            recruiters={recruiters}
            handleSelectRecruiter={handleSelectRecruiter}
            handleSubmitEdit={handleSubmitEdit}
            setEditFormData={setEditFormData} 
          />

          

          {/* Delete Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
          >
            <DialogTitle sx={{ backgroundColor: "#00796b", color: "white" }}>
              Confirm Delete
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography>
                Are you sure you want to delete this job requirement?
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                Job ID: {jobToDelete}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, backgroundColor: "grey.100" }}>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                color="#fff"
                backgroundColor="#00796b"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          <CustomDialog
            open={openDescriptionDialog}
            onClose={handleCloseDescriptionDialog}
            title={dialogTitle}
            content={dialogContent}
          />

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
};

export default Requirements;
