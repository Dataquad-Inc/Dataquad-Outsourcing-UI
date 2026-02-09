import React, { useState, useEffect } from "react";
import DataTable from "../muiComponents/DataTabel";
import {
  Box,
  Typography,
  Button,
  Chip,
  Link,
  Tooltip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  DialogContentText,
  Badge,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Refresh,
  Description as DescriptionIcon,
  TextFields,
  Download,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Cancel,
} from "@mui/icons-material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ToastService from "../../Services/toastService";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import ComponentTitle from "../../utils/ComponentTitle";
import PostRequirement from "./PostRequirement/PostRequirement";
import EditRequirement from "./EditRequirement";
import httpService from "../../Services/httpService"; // Import httpService
import LoadingSkeleton from "../muiComponents/LoadingSkeleton"; // Import LoadingSkeleton
import { DateRangeIcon } from "@mui/x-date-pickers";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllRequirementsBDM, fetchRequirementsBdmSelf, setFilteredReqDataRequested } from "../../redux/requirementSlice";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Requirements = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const navigate = useNavigate()
  const [descriptionDialog, setDescriptionDialog] = useState({
    open: false,
    content: "",
    title: "",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    jobId: null,
    jobTitle: "",
  });
  const [expandedRowId, setExpandedRowId] = useState(null);

  const { filteredRequirementList } = useSelector((state) => state.requirement);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  const { role, userId } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { requirementsAllBDM, requirementsSelfBDM } = useSelector((state) => state.requirement)
  const [tabValue, setTabValue] = useState(0);
  const [isAllData, setIsAllData] = useState(false)

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    ToastService.info("Refreshing requirements data...");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;

        if (role === "SUPERADMIN") {
          response = await httpService.get("/requirements/getAssignments");
        } else if (role === "TEAMLEAD") {
          response = await httpService.get(`/requirements/teamleadrequirements/${userId}`);
        }
        else if (role === "COORDINATOR") {
          response = await httpService.get(`/requirements/coordinatorRequirements/${userId}`)
        }
        else if (role === "BDM") {
          dispatch(fetchAllRequirementsBDM());
          dispatch(fetchRequirementsBdmSelf());
          ToastService.success("Data Fetched Successfully!")
        }
        else {
          setData([]);
          setError(new Error("Unauthorized role for this action"));
          ToastService.error("Unauthorized role for fetching requirements",
            "error")
          return;
        }

        if (Array.isArray(response.data) && role != "BDM") {
          const priorityStatuses = ["Submitted", "On Hold", "In Progress"];

          const sortedData = response.data.sort((a, b) => {
            const aPriority = priorityStatuses.includes(a.status) ? 0 : 1;
            const bPriority = priorityStatuses.includes(b.status) ? 0 : 1;

            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }

            return (
              new Date(b.requirementAddedTimeStamp) -
              new Date(a.requirementAddedTimeStamp)
            );
          });

          setData(sortedData);
          ToastService.success("Requirements data loaded successfully")
        } else {
          setData([]);
          const msg =
            response.data?.message || "Data fetched was not an array.";
          setError(new Error(msg));
          ToastService.error(msg)
        }
      } catch (err) {
        setError(err);
        setData([]);
        console.warn(err);
        ToastService.error(err)
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger, role, userId]);


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const selected = event.target.id;
    if (selected === "all") {
      setIsAllData(true);
      return;
    }
    setIsAllData(false)
  };

  // Update columns when loading state or data changes
  useEffect(() => {
    setColumns(generateColumns(loading));
  }, [loading]);

  const handleJobIdClick = (jobId) => {
    console.log("Job ID clicked:", jobId);
    ToastService.info(`Viewing details for Job ID: ${jobId}`);
    navigate(`job-details/${jobId}`);
  };

  const handleOpenDescriptionDialog = (content, title) => {
    setDescriptionDialog({
      open: true,
      content,
      title,
    });
    ToastService.info(`Viewing job description for: ${title}`);
  };

  const handleCloseDescriptionDialog = () => {
    setDescriptionDialog({
      open: false,
      content: "",
      title: "",
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleCloseEditDrawer = () => {
    setEditDrawerOpen(false);
    refreshData();
  };

  const handleEditClick = (row) => {
    setEditFormData(row);
    setEditDrawerOpen(true);
    ToastService.info(`Editing requirement: ${row.jobTitle}`);
  };

  const handleDeleteClick = (jobId, jobTitle) => {
    setDeleteDialog({
      open: true,
      jobId,
      jobTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.jobId) return;

    const deleteToastId = ToastService.loading(
      `Deleting requirement: ${deleteDialog.jobTitle}...`
    );

    try {
      setLoading(true);
      // Using httpService instead of axios directly
      const response = await httpService.delete(
        `/requirements/deleteRequirement/${deleteDialog.jobId}`
      );

      if (response.data.success) {
        ToastService.update(
          deleteToastId,
          `Requirement "${deleteDialog.jobTitle}" deleted successfully`,
          "success"
        );
      } else {
        ToastService.update(
          deleteToastId,
          `Failed to delete requirement: ${response.data.message || "Unknown error"
          }`,
          "error"
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      ToastService.update(
        deleteToastId,
        `Error deleting requirement: ${error.message}`,
        "error"
      );
    } finally {
      setDeleteDialog({ open: false, jobId: null, jobTitle: "" });
      refreshData();
      setLoading(false);
    }
  };

  const handleViewDetails = (rowId) => {
    setExpandedRowId(rowId === expandedRowId ? null : rowId);
  };

  const handleDownloadJD = (jobId, jobTitle) => {
    ToastService.info(`Downloading job description for: ${jobTitle}`);
  };

  const renderStatus = (status) => {
    let color = "default";

    switch (status?.toLowerCase()) {
      case "submitted":
        color = "success";
        break;
      case "closed":
        color = "error";
        break;
      case "hold" || "on hold":
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

  // Use the LoadingSkeleton component for job description loading state
  const renderJobDescription = (row) => {
    if (loading) {
      return <LoadingSkeleton rows={2} height={60} spacing={1} />;
    }

    const hasTextDescription =
      row.jobDescription &&
      typeof row.jobDescription === "string" &&
      row.jobDescription.trim() !== "";

    const hasFileDescription = row.jobDescriptionBlob || row.jobDescriptionFile;

    if (hasTextDescription && hasFileDescription) {
      return (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TextFields sx={{ mr: 1, color: "#00796b" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Job Description:
              </Typography>
            </Box>
            <Typography
              variant="body2"
              component="div"
              sx={{
                whiteSpace: "pre-wrap",
                p: 2,
                bgcolor: "rgba(0, 121, 107, 0.05)",
                borderRadius: 1,
                border: "1px solid rgba(0, 121, 107, 0.2)",
                maxHeight: "300px",
                overflowY: "auto",
                mb: 2,
              }}
            >
              {row.jobDescription}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <DescriptionIcon sx={{ mr: 1, color: "#00796b" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Job Description File:
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Link
                href={`/requirements/download-jd/${row.jobId}`}
                target="_blank"
                download={`JD_${row.jobId}.pdf`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                  border: "1px dashed #00796b",
                  borderRadius: 1,
                  bgcolor: "rgba(0, 121, 107, 0.05)",
                  "&:hover": {
                    bgcolor: "rgba(0, 121, 107, 0.1)",
                    textDecoration: "none",
                  },
                }}
                onClick={() => handleDownloadJD(row.jobId, row.jobTitle)}
              >
                <Download sx={{ mr: 1, color: "#00796b" }} />
                <Typography>Download JD</Typography>
              </Link>
            </Box>
          </Box>
        </Box>
      );
    }

    if (hasTextDescription) {
      return (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <TextFields sx={{ mr: 1, color: "#00796b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Job Description:
            </Typography>
          </Box>
          <Typography
            variant="body2"
            component="div"
            sx={{
              whiteSpace: "pre-wrap",
              p: 2,
              bgcolor: "rgba(0, 121, 107, 0.05)",
              borderRadius: 1,
              border: "1px solid rgba(0, 121, 107, 0.2)",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {row.jobDescription}
          </Typography>
        </Box>
      );
    }

    if (hasFileDescription) {
      return (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <DescriptionIcon sx={{ mr: 1, color: "#00796b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Job Description File:
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Link
              href={`/requirements/download-jd/${row.jobId}`}
              target="_blank"
              download={`JD_${row.jobId}.pdf`}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                border: "1px dashed #00796b",
                borderRadius: 1,
                bgcolor: "rgba(0, 121, 107, 0.05)",
                "&:hover": {
                  bgcolor: "rgba(0, 121, 107, 0.1)",
                  textDecoration: "none",
                },
              }}
              onClick={() => handleDownloadJD(row.jobId, row.jobTitle)}
            >
              <Download sx={{ mr: 1, color: "#00796b" }} />
              <Typography>Download Job Description</Typography>
            </Link>
          </Box>
        </Box>
      );
    }

    return (
      <Typography sx={{ fontStyle: "italic", color: "text.secondary", mt: 1 }}>
        No job description available.
      </Typography>
    );
  };

  const getExpandedContentConfig = (row) => {
    return {
      title: "Job Details",
      description: {
        custom: renderJobDescription(row),
        fallback: "No description available.",
      },
      backgroundColor: "#f5f5f5",
      sections: [
        {
          title: "Basic Information",
          fields: [
            { label: "Job ID", key: "jobId", fallback: "-" },
            { label: "Job Title", key: "jobTitle", fallback: "-" },
            { label: "Client Name", key: "clientName", fallback: "-" },
            { label: "Type", key: "jobType", fallback: "-" },
            { label: "Mode", key: "jobMode", fallback: "-" },
            { label: "Location", key: "location", fallback: "-" },
          ],
        },
        {
          title: "Requirements",
          fields: [
            {
              label: "Total Experience",
              key: "experienceRequired",
              fallback: "-",
            },
            {
              label: "Relevant Experience",
              key: "relevantExperience",
              fallback: "-",
            },
            { label: "Notice Period", key: "noticePeriod", fallback: "-" },
            { label: "Qualification", key: "qualification", fallback: "-" },
            {
              label: "Recruiters",
              key: "recruiterName",
              fallback: "Not assigned",
              transform: (names) => {
                if (!names || names.length === 0) return "Not assigned";

                // Trim whitespace from each name and filter out empty strings
                const cleanedNames = names
                  .map((name) => name.trim())
                  .filter((name) => name.length > 0);

                // Join with comma + space
                return cleanedNames.join(", ");
              },
            },
          ],
        },
        {
          title: "Additional Information",
          fields: [
            { label: "Salary Package", key: "salaryPackage", fallback: "-" },
            {
              label: "Positions Available",
              key: "noOfPositions",
              fallback: "-",
            },
            {
              label: "Posted Date",
              key: "requirementAddedTimeStamp",
              fallback: "-",
              transform: (value) =>
                value
                  ? new Date(value).toLocaleDateString() +
                  " " +
                  new Date(value).toLocaleTimeString()
                  : "-",
            },
            { label: "Status", key: "status", fallback: "-" },
            { label: "Assigned By", key: "assignedBy", fallback: "-" },
          ],
        },
      ],
      actions: [
        {
          label: "Edit",
          icon: <EditIcon />,
          onClick: () => handleEditClick(row),
          color: "primary",
        },
        {
          label: "Delete",
          icon: <DeleteIcon />,
          onClick: () => handleDeleteClick(row.jobId, row.jobTitle),
          color: "error",
        },
      ],
    };
  };

  const renderExpandedContent = (row) => {
    return (
      <ReusableExpandedContent
        row={row}
        config={getExpandedContentConfig(row)}
      />
    );
  };

  const generateColumns = (isLoading) => {
    const skeletonProps = {
      rows: 1,
      height: 24,
      animation: "wave",
    };

    return [
      {
        key: "jobId",
        label: "Job ID",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={80} />
          ) : (
            <Link
              component="button"
              variant="body2"
              onClick={() => handleJobIdClick(row.jobId)}
              sx={{
                textDecoration: "none",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {row.jobId}
            </Link>
          ),
      },
      {
        key: "requirementAddedTimeStamp",
        label: "Posted Date",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : !row.requirementAddedTimeStamp ? (
            "N/A"
          ) : isNaN(new Date(row.requirementAddedTimeStamp)) ? (
            "Invalid Date"
          ) : (
            new Date(row.requirementAddedTimeStamp).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          ),
      },
      {
          key:"updatedAt",
           label: "Updated Date",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : !row.updatedAt ? (
            "N/A"
          ) : isNaN(new Date(row.updatedAt)) ? (
            "Invalid Date"
          ) : (
            new Date(row.updatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          ),
      },
      {
        key: "jobTitle",
        label: "Job Title",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={120} />
          ) : (
            row.jobTitle || "N/A"
          ),
      },
      {
        key: "clientName",
        label: "Client Name",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : (
            row.clientName || "N/A"
          ),
      },
      {
        key: "assignedBy",
        label: "Assigned By",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : row.assignedBy ? (
            <Typography sx={{ fontWeight: 350, color: "#e91e64" }}>
              {row.assignedBy}
            </Typography>
          ) : (
            "Not Assigned"
          ),
      },
      {
        key: "recruiterName",
        label: "Recruiter(s)",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : !row.recruiterName || row.recruiterName.length === 0 ? (
            "N/A"
          ) : Array.isArray(row.recruiterName) ? (
            row.recruiterName.join(", ")
          ) : (
            "Invalid Data"
          ),
      },

      {
        key: "numberOfSubmissions",
        label: "Submissions",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : (
            <Chip
              label={row.numberOfSubmissions || 0}
              variant="outlined"
              color={row.numberOfSubmissions > 0 ? "primary" : "default"}
              sx={{
                fontWeight: 500,
                borderWidth: row.numberOfSubmissions > 0 ? 2 : 1,
                borderColor:
                  row.numberOfSubmissions > 0 ? "primary.main" : "divider",
              }}
            />
          ),
      },
      {
        key: "numberOfInterviews",
        label: "Interviews",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={100} />
          ) : (
            <Chip
              label={row.numberOfInterviews || 0}
              variant="outlined"
              color={row.numberOfInterviews > 0 ? "success" : "default"}
              sx={{
                fontWeight: 500,
                borderWidth: row.numberOfInterviews > 0 ? 2 : 1,
                borderColor:
                  row.numberOfInterviews > 0 ? "success.main" : "divider",
              }}
            />
          ),
      },
      {
        key: "jobDescription",
        label: "Job Description",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={120} />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {row.jobDescription ? (
                <>
                  <Typography noWrap sx={{ maxWidth: 80 }}>
                    {row.jobDescription.slice(0, 15)}
                    {row.jobDescription.length > 15 && "..."}
                  </Typography>
                  {row.jobDescription.length > 15 && (
                    <Tooltip title="View Full Description">
                      <Button
                        onClick={() =>
                          handleOpenDescriptionDialog(
                            row.jobDescription,
                            row.jobTitle
                          )
                        }
                        size="small"
                        startIcon={<DescriptionIcon />}
                        sx={{ minWidth: 0 }}
                      >
                        more
                      </Button>
                    </Tooltip>
                  )}
                </>
              ) : (
                <Tooltip title="Download Job Description">
                  <Link
                    href={`/requirements/download-job-description/${row.jobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{ color: "#00796b" }}
                    onClick={() => handleDownloadJD(row.jobId, row.jobTitle)}
                  >
                    Download JD
                  </Link>
                </Tooltip>
              )}
            </Box>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={80} />
          ) : (
            renderStatus(row.status)
          ),
      },
      {
        key: "salaryPackage",
        label: "Package",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={80} />
          ) : (
            row.salaryPackage || "N/A"
          ),
      },
      {
        key: "age",
        label: "Age Of Requirement",
        render: (row) =>
          isLoading ? (
            <LoadingSkeleton {...skeletonProps} width={80} />
          ) : (
            row.age || "N/A"
          ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          isLoading ? (
            <Stack direction="row" spacing={1}>
              <LoadingSkeleton rows={1} width={32} height={32} />
              <LoadingSkeleton rows={1} width={32} height={32} />
              <LoadingSkeleton rows={1} width={32} height={32} />
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleViewDetails(row.jobId)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Requirement">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEditClick(row)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Requirement">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(row.jobId, row.jobTitle)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ),
      },
    ];
  };

 

  const processedData = data.map((row) => ({
    ...row,
    expandContent: renderExpandedContent,
    expanded: row.jobId === expandedRowId,
  }));

  console.log("Processed data",processedData)
   
  // if (error) {
  //   return (
  //     <Box sx={{ p: 3, textAlign: "center" }}>
  //       <Typography color="error">Error: {error.message}</Typography>
  //       <Button
  //         variant="outlined"
  //         onClick={refreshData}
  //         startIcon={<Refresh />}
  //         sx={{ mt: 2 }}
  //       >
  //         Retry
  //       </Button>
  //     </Box>
  //   );
  // }

  const handleCalenderDialog = () => {
    setDialogOpen(!dialogOpen);
  };

  const handleDisableFilter = () => {
    dispatch(setFilteredReqDataRequested(false));
    setDialogOpen(false);
  };

  return (
    <>
      <ToastContainer />

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
        <Typography variant="h6" color="primary">
          Requirements Management
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ ml: "auto" }}
        >
          <DateRangeFilter component="Requirement" />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setDrawerOpen(true);
              ToastService.info("Opening new requirement form");
            }}
            startIcon={<Send size={18} />}
          >
            Post New Requirement
          </Button>
        </Stack>
      </Stack>

      {role === "BDM" &&
            <Paper sx={{ mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                <Tab id="self" label="Self Requirements" />
                <Tab id="all" label="All Requirements" />
              </Tabs>
            </Paper>
        }

      {loading && data.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <LoadingSkeleton rows={5} height={60} spacing={2} />
        </Box>
      ) : (
        <DataTable
        data={isFilteredDataRequested ? filteredRequirementList :
          role === "BDM" ? isAllData ? requirementsAllBDM : requirementsSelfBDM :
          processedData || []}
          columns={columns}
          title=""
          loading={loading}
          enableSelection={false}
          defaultSortColumn="requirementAddedTimeStamp"
          defaultSortDirection="desc"
          defaultRowsPerPage={10}
          refreshData={refreshData}
          primaryColor="#1976d2"
          secondaryColor="#e0f2f1"
          customStyles={{
            headerBackground: "#1976d2",
            rowHover: "#e0f2f1",
            selectedRow: "#b2dfdb",
          }}
          uniqueId="jobId"
          onRowClick={(row) => handleViewDetails(row.jobId)}
        />
      )}

      {/* Job Description Dialog */}
      <Dialog
        open={descriptionDialog.open}
        onClose={handleCloseDescriptionDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{descriptionDialog.title}</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body1"
            component="div"
            sx={{
              whiteSpace: "pre-wrap",
              p: 2,
              bgcolor: "rgba(0, 121, 107, 0.05)",
              borderRadius: 1,
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {descriptionDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDescriptionDialog}
            color="primary"
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post New Requirement Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: "70%", md: "60%", lg: "60%" },
            mt: 3,
          },
        }}
      >
        <PostRequirement onClose={handleCloseDrawer} />
      </Drawer>

      {/* Edit Requirement Drawer */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={handleCloseEditDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: "90%", md: "60%", lg: "70%" },
            maxWidth: "1000px",
          },
        }}
      >
        {editFormData && (
          <EditRequirement
            requirementData={editFormData}
            onClose={handleCloseEditDrawer}
          />
        )}
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, jobId: null, jobTitle: "" })
        }
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the job requirement "
            {deleteDialog.jobTitle}" (ID: {deleteDialog.jobId})? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, jobId: null, jobTitle: "" })
            }
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Requirements;
