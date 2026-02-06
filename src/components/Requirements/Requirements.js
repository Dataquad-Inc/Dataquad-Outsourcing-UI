import React, { useState, useEffect, useCallback, useMemo } from "react";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
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
} from "@mui/icons-material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ToastService from "../../Services/toastService";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import PostRequirement from "./PostRequirement/PostRequirement";
import EditRequirement from "./EditRequirement";
import httpService from "../../Services/httpService";
import LoadingSkeleton from "../muiComponents/LoadingSkeleton";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllRequirementsBDM,
  fetchRequirementsBdmSelf,
  filterRequirementsByDateRange,
  setFilteredRequirementPage,
  setFilteredRequirementSize,
  setFilteredRequirementFilters,
  resetFilteredRequirements
} from "../../redux/requirementSlice";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Requirements = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const navigate = useNavigate();

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

  // Pagination state for regular data
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState("requirementAddedTimeStamp");
  const [order, setOrder] = useState("desc");
  const [filters, setFilters] = useState({});

  // Get state from Redux
  const {
    filteredRequirementList,
    filteredRequirementPagination,
    filteredRequirementFilters,
    isFilteredDataRequested,
    requirementsAllBDM,
    requirementsSelfBDM,
    loading: reduxLoading
  } = useSelector((state) => state.requirement);

  const { role, userId } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [tabValue, setTabValue] = useState(0);
  const [isAllData, setIsAllData] = useState(false);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    // Reset filtered data when refreshing
    dispatch(resetFilteredRequirements());
    ToastService.info("Refreshing requirements data...");
  };

  // Fetch data with pagination
  const fetchData = useCallback(async () => {
    // Don't fetch if we're viewing filtered data
    if (isFilteredDataRequested) {
      setLoading(false);
      return;
    }

    // For BDM role, don't fetch from API (uses Redux)
    if (role === "BDM") {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let response;
      let endpoint = "";

      if (role === "SUPERADMIN") {
        // Build query parameters using your API format
        const queryParams = new URLSearchParams({
          page: page.toString(),
          size: rowsPerPage.toString(),
        });

        // Add search if provided
        if (searchQuery && searchQuery.trim() !== "") {
          queryParams.append("search", searchQuery);
        }

        // Add filters if any
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key] !== "") {
            queryParams.append(key, filters[key]);
          }
        });

        endpoint = `/requirements/getAssignments?${queryParams.toString()}`;
        console.log("Fetching from endpoint:", endpoint);
        response = await httpService.get(endpoint);
      } else if (role === "TEAMLEAD") {
        endpoint = `/requirements/teamleadrequirements/${userId}`;
        response = await httpService.get(endpoint);
      } else if (role === "COORDINATOR") {
        endpoint = `/requirements/coordinatorRequirements/${userId}`;
        response = await httpService.get(endpoint);
      } else {
        setData([]);
        setError(new Error("Unauthorized role for this action"));
        ToastService.error("Unauthorized role for fetching requirements", "error");
        return;
      }

      console.log("API Response:", response.data);

      if (response.data) {
        let requirements = [];
        let total = 0;

        // Check response structure based on your API
        if (Array.isArray(response.data)) {
          // If API returns direct array
          requirements = response.data;
          total = response.data.length;

          // Apply client-side pagination
          const startIndex = page * rowsPerPage;
          const endIndex = startIndex + rowsPerPage;
          requirements = requirements.slice(startIndex, endIndex);
        } else if (response.data.content) {
          // Spring Boot Pageable response format
          requirements = response.data.content || [];
          total = response.data.totalElements || 0;
        } else if (response.data.data) {
          // Custom response format { data: [], total: number }
          requirements = response.data.data || [];
          total = response.data.total || 0;
        } else if (response.data.requirements) {
          requirements = response.data.requirements || [];
          total = response.data.total || 0;
        } else {
          requirements = [];
          total = 0;
        }

        // Sort by priority status
        const priorityStatuses = ["Submitted", "On Hold", "In Progress"];
        const sortedData = requirements.sort((a, b) => {
          const aPriority = priorityStatuses.includes(a.status) ? 0 : 1;
          const bPriority = priorityStatuses.includes(b.status) ? 0 : 1;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          return new Date(b.requirementAddedTimeStamp) - new Date(a.requirementAddedTimeStamp);
        });

        setData(sortedData);
        setTotalCount(total);

        if (requirements.length > 0) {
          ToastService.success(`Page ${page + 1}: Showing ${requirements.length} requirements`);
        }
      } else {
        setData([]);
        setTotalCount(0);
        ToastService.info("No requirements found");
      }
    } catch (err) {
      setError(err);
      setData([]);
      setTotalCount(0);
      console.error("Error fetching data:", err);
      ToastService.error(err.message || "Error loading requirements");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, orderBy, order, filters, role, userId, refreshTrigger, isFilteredDataRequested]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // For BDM role, fetch data from Redux
  useEffect(() => {
    if (role === "BDM") {
      dispatch(fetchAllRequirementsBDM());
      dispatch(fetchRequirementsBdmSelf());
    }
  }, [role, dispatch, refreshTrigger]);

  // Handle page change for regular data
  const handlePageChange = (newPage, newRowsPerPage) => {
    console.log(`Page changed to: ${newPage}, Rows per page: ${newRowsPerPage}`);
    setPage(newPage);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(0);
    }
  };

  // Handle rows per page change for regular data
  const handleRowsPerPageChange = (newRowsPerPage) => {
    console.log(`Rows per page changed to: ${newRowsPerPage}`);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  // Handle pagination for filtered data
  const handleFilteredPageChange = (newPage, newRowsPerPage) => {
    console.log(`Filtered data - Page: ${newPage}, Size: ${newRowsPerPage}`);

    // Update pagination state
    dispatch(setFilteredRequirementPage(newPage));
    if (newRowsPerPage !== filteredRequirementPagination.pageSize) {
      dispatch(setFilteredRequirementSize(newRowsPerPage));
    }

    // Fetch filtered data with new pagination
    dispatch(filterRequirementsByDateRange({
      ...filteredRequirementFilters,
      page: newPage,
      size: newRowsPerPage || filteredRequirementPagination.pageSize
    }));
  };

  // Handle DateRangeFilter apply
  const handleDateFilterApply = (startDate, endDate) => {
    // Reset to first page when applying new filter
    const filterParams = {
      startDate,
      endDate,
      page: 0,
      size: filteredRequirementPagination.pageSize || 10
    };

    dispatch(setFilteredRequirementFilters(filterParams));
    dispatch(filterRequirementsByDateRange(filterParams));
  };

  // Handle DateRangeFilter reset
  const handleDateFilterReset = () => {
    dispatch(resetFilteredRequirements());
    // Refetch regular data
    fetchData();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const selected = event.target.id;
    if (selected === "all") {
      setIsAllData(true);
      return;
    }
    setIsAllData(false);
  };

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
      const response = await httpService.delete(
        `/requirements/deleteRequirement/${deleteDialog.jobId}`
      );

      if (response.data.success) {
        ToastService.update(
          deleteToastId,
          `Requirement "${deleteDialog.jobTitle}" deleted successfully`,
          "success"
        );
        // Refresh data after deletion
        if (isFilteredDataRequested) {
          // Refetch filtered data
          dispatch(filterRequirementsByDateRange({
            ...filteredRequirementFilters,
            page: filteredRequirementPagination.currentPage,
            size: filteredRequirementPagination.pageSize
          }));
        } else {
          fetchData();
        }
      } else {
        ToastService.update(
          deleteToastId,
          `Failed to delete requirement: ${response.data.message || "Unknown error"}`,
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
    if (reduxLoading) {
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

  const generateColumns = useMemo(() => {
    const isLoading = reduxLoading;
    const skeletonProps = {
      rows: 1,
      height: 24,
      animation: "wave",
    };

    return [
      {
        key: "jobId",
        label: "Job ID",
        sortable: true,
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
        sortable: true,
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
        key: "updatedAt",
        label: "Updated Date",
        sortable: true,
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
        sortable: true,
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
        sortable: true,
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
        sortable: true,
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
        sortable: false,
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
        sortable: true,
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
        sortable: true,
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
        sortable: false,
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
        sortable: true,
        filterable: true,
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
        sortable: true,
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
        sortable: true,
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
        sortable: false,
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
  }, [reduxLoading]);

  useEffect(() => {
    setColumns(generateColumns);
  }, [generateColumns]);

  // Prepare data for display
  const processedData = useMemo(() => {
    let sourceData = [];

    if (isFilteredDataRequested) {
      sourceData = Array.isArray(filteredRequirementList) ? filteredRequirementList : [];
    } else if (role === "BDM") {
      sourceData = isAllData ?
        (Array.isArray(requirementsAllBDM) ? requirementsAllBDM : []) :
        (Array.isArray(requirementsSelfBDM) ? requirementsSelfBDM : []);
    } else {
      sourceData = Array.isArray(data) ? data : [];
    }

    return sourceData.map((row) => ({
      ...row,
      expandContent: renderExpandedContent,
      expanded: row.jobId === expandedRowId,
    }));
  }, [isFilteredDataRequested, filteredRequirementList, role, isAllData, requirementsAllBDM, requirementsSelfBDM, data, expandedRowId]);

  // Determine display values for DataTablePaginated
  const displayData = processedData;
  const displayTotalCount = isFilteredDataRequested
    ? (filteredRequirementPagination?.totalElements || processedData.length)
    : role === "BDM"
      ? processedData.length
      : totalCount;

  const displayPage = isFilteredDataRequested
    ? (filteredRequirementPagination?.currentPage || 0)
    : role === "BDM"
      ? 0
      : page;

  const displayRowsPerPage = isFilteredDataRequested
    ? (filteredRequirementPagination?.pageSize || 10)
    : role === "BDM"
      ? 10
      : rowsPerPage;

  // Determine if we should use server-side pagination
  const enableServerSidePagination = role !== "BDM";

  // Handle sort change
  const handleSortChange = (property, direction) => {
    console.log(`Sort changed: ${property}, ${direction}`);
    setOrderBy(property);
    setOrder(direction);
    setPage(0);
  };

  // Handle search change
  const handleSearchChange = (searchTerm) => {
    console.log(`Search changed: ${searchTerm}`);
    setSearchQuery(searchTerm);
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (filterParams) => {
    console.log(`Filters changed:`, filterParams);
    setFilters(filterParams);
    setPage(0);
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
          {/* Pass callback functions to DateRangeFilter */}
          <DateRangeFilter
            component="Requirement"
            onApplyFilter={handleDateFilterApply}
            onResetFilter={handleDateFilterReset}
            isFiltered={isFilteredDataRequested}
            paginationInfo={isFilteredDataRequested ? filteredRequirementPagination : null}
          />

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

      {role === "BDM" && (
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab id="self" label="Self Requirements" />
            <Tab id="all" label="All Requirements" />
          </Tabs>
        </Paper>
      )}

      {(reduxLoading || loading) && displayData.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <LoadingSkeleton rows={5} height={60} spacing={2} />
        </Box>
      ) : (
        <DataTablePaginated
          data={displayData}
          columns={columns}
          title=""
          loading={reduxLoading || loading}
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

          // Server-side pagination props
          serverSide={enableServerSidePagination || isFilteredDataRequested}
          totalCount={displayTotalCount}
          page={displayPage}
          rowsPerPage={displayRowsPerPage}
          onPageChange={isFilteredDataRequested ? handleFilteredPageChange : handlePageChange}
          onRowsPerPageChange={isFilteredDataRequested ? handleFilteredPageChange : handleRowsPerPageChange}
          onSortChange={enableServerSidePagination && !isFilteredDataRequested ? handleSortChange : undefined}
          onSearchChange={enableServerSidePagination && !isFilteredDataRequested ? handleSearchChange : undefined}
          onFilterChange={enableServerSidePagination && !isFilteredDataRequested ? handleFilterChange : undefined}
          enableServerSideFiltering={enableServerSidePagination && !isFilteredDataRequested}
          searchValue={searchQuery}
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