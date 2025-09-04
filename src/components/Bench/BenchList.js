import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import httpService, { API_BASE_URL } from '../../Services/httpService';
import DataTable from '../muiComponents/DataTabel';
import DownloadResume from '../../utils/DownloadResume';

import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Skeleton,
  Chip,
  Stack,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Download,
  Add,
  FilterList,
  Person,
  Work,
  School,
  ContactPhone,
  Code,
  Feedback,
} from '@mui/icons-material';
import ToastService from '../../Services/toastService';
import BenchCandidateForm from './BenchForm';
import CandidateDetails from './CandidateDetails';
import { useDispatch, useSelector } from 'react-redux';
import { filterBenchListByDateRange, setFilteredDataRequested } from '../../redux/benchSlice';
import { User2Icon } from 'lucide-react';
import InternalFeedbackCell from '../Interviews/FeedBack';

const BenchList = () => {
  const [benchData, setBenchData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  // Form handling states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);

  const { isFilteredDataRequested, filteredBenchList } = useSelector((state) => state.bench);

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const dispatch = useDispatch();

  const fetchBenchList = async () => {
    try {
      setLoading(true);
      ToastService.info("Loading bench candidates...");

      const response = await httpService.get('/candidate/bench/getBenchList');
      setBenchData(response.data);
      ToastService.success(`Loaded ${response.data?.length || 0} bench candidates`);
    } catch (error) {
      console.error('Failed to fetch bench list:', error);
      ToastService.error('Failed to load bench candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchList();
  }, []);

  const handleView = (row) => {
    setSelectedCandidate({
      ...row,
      filterCriteria: {
        showBasicInfo: true,
        showContact: true,
        showExperience: true,
        showSkills: true,
        showEducation: true,
        showDocuments: true
      }
    });
    setIsViewModalOpen(true);
    ToastService.info(`Viewing details for ${row.fullName}`);
  };

  const toggleFilter = (filterKey) => {
    if (selectedCandidate) {
      setSelectedCandidate({
        ...selectedCandidate,
        filterCriteria: {
          ...selectedCandidate.filterCriteria,
          [filterKey]: !selectedCandidate.filterCriteria[filterKey]
        }
      });
    }
  };



  const handleAdd = () => {
    setEditCandidateId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setEditCandidateId(row.id);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditCandidateId(null);
  };

  const handleFormSuccess = () => {
    fetchBenchList();
  };

  const handleDelete = (row) => {
    setCandidateToDelete(row);
    setDeleteDialogOpen(true);
    ToastService.warning(`Preparing to delete ${row.fullName}`);
  };

  const confirmDelete = async () => {
    try {
      const toastId = ToastService.loading("Deleting candidate...");
      await httpService.delete(`/candidate/bench/deletebench/${candidateToDelete.id}`);
      ToastService.update(toastId, "Candidate deleted successfully!", "success");
      fetchBenchList();
      setDeleteDialogOpen(false);
    } catch (error) {
      ToastService.error("Failed to delete candidate");
      console.error("Error deleting candidate:", error);
    }
  };
  
  const downloadResume = async (id, candidateName, format = "pdf") => {
    if (downloadingResume) return;
  
    setDownloadingResume(true);
    const toastId = ToastService.loading("Preparing resume download...");
  
    try {
      const response = await fetch(
        `https://mymulya.com/candidate/bench/download/${id}?format=${format}`,
        {
          method: "GET",
          headers: {
            Accept: "application/octet-stream",
          },
        }
      );
  
      if (!response.ok) throw response;
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
  
      let filename = `${candidateName}.${format === "word" ? "docx" : "pdf"}`;

  
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }
  
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
  
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
  
      ToastService.update(toastId, "Resume downloaded successfully!", "success");
    } catch (error) {
      console.error("Download error:", error);
      let errorMessage = "Failed to download resume";
      if (error.status === 404) errorMessage = "Resume not found for this candidate";
      else if (error.status === 500) errorMessage = "Server error while processing download";
      ToastService.update(toastId, errorMessage, "error");
    } finally {
      setDownloadingResume(false);
      handleMenuClose();
    }
  };
  
  

  const generateColumns = (loading = false) => [
    {
      key: 'id',
      label: 'Bench ID',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 120,
      render: loading ? () => <Skeleton variant="text" width={80} height={24} /> : undefined
    },
    {
      key: 'fullName',
      label: 'Full Name',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 180,
      render: loading ? () => <Skeleton variant="text" width={140} height={24} /> : undefined
    },
     {
      key: 'technology',
      label: 'Technology',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 180,
      render: loading ? () => <Skeleton variant="text" width={140} height={24} /> : undefined
    },
    {
      key: 'skills',
      label: 'Skills',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 250,
      render: (row) =>
        loading ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={80} height={24} />
          </Box>
        ) : !row.skills || row.skills.length === 0 ? (
          "N/A"
        ) : Array.isArray(row.skills) ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {row.skills.slice(0, 3).map((skill, index) => (
              <Chip key={index} label={skill} size="small" />
            ))}
            {row.skills.length > 3 && (
              <Chip label={`+${row.skills.length - 3}`} size="small" />
            )}
          </Box>
        ) : (
          "Invalid Data"
        )
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 220,
      render: loading ? () => <Skeleton variant="text" width={180} height={24} /> : undefined
    },
    {
      key: 'contactNumber',
      label: 'Contact Number',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 150,
      render: loading ? () => <Skeleton variant="text" width={100} height={24} /> : undefined
    },
    {
      key: 'referredBy',
      label: 'Referred By',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 180,
      render: loading ? () => <Skeleton variant="text" width={120} height={24} /> : undefined
    },
    {
      key: 'totalExperience',
      label: 'Total Exp (Yrs)',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 150,
      render: loading ? () => <Skeleton variant="text" width={80} height={24} /> : (row) => (
        <Chip 
          label={`${row.totalExperience || 'N/A'}`} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      )
    },
    {
      key: 'relevantExperience',
      label: 'Rel Exp (Yrs)',
      type: 'text',
      sortable: true,
      filterable: true,
      width: 150,
      render: loading ? () => <Skeleton variant="text" width={80} height={24} /> : (row) => (
        <Chip 
          label={`${row.relevantExperience || 'N/A'}`} 
          size="small" 
          color="secondary" 
          variant="outlined" 
        />
      )
    },
    {
      key:'remarks',
      label:'Remarks',
      type:'text',
      align:'center',
      render:(row)=>(
        <InternalFeedbackCell value={row.remarks} type='remarks'/>
      ),
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      filterable: false,
      width: 200,
      align: 'center',
      render: loading ? () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      ) : (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View">
            <IconButton color="info" size="small" onClick={() => handleView(row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit">
            <IconButton color="primary" size="small" onClick={() => handleEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton color="error" size="small" onClick={() => handleDelete(row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>

          <DownloadResume
          candidate={{
          candidateId: row?.id ?? 'NO_ID',
          jobId: row?.jobId ?? 'NO_JOB_ID',
          fullName: row?.fullName ?? 'NO_NAME',
          }}
          getDownloadUrl={(candidate, format) => {
          console.log("Resolved candidate for download:", candidate, format);
           return `${API_BASE_URL}/candidate/bench/download/${candidate.candidateId}?format=${format}`;
         }}
         />
        </Box>
      ),
    },
  ];

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          flexWrap: 'wrap',
          mb: 3,
          p: 2,
          backgroundColor: '#f9f9f9',
          borderRadius: 2,
          boxShadow: 1,
          justifyContent: 'space-between', 
        }}
      >
        <Typography variant="h6" color="primary">
          Bench Candidate Management
        </Typography>
       
        <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 'auto' }}>
          <Button
            variant="text"
            color="primary"
            onClick={handleAdd}
            disabled={loading}
          >
            <Add /> <User2Icon />
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ height: 400, width: '100%' }}>
          <Skeleton variant="rectangular" width="100%" height={56} />
          {[...Array(10)].map((_, index) => (
            <Skeleton 
              key={index} 
              variant="rectangular" 
              width="100%" 
              height={52} 
              sx={{ mt: 1 }} 
            />
          ))}
        </Box>
      ) : (
        <DataTable
          data={benchData || []}
          columns={generateColumns(loading)}
          pageLimit={20}
          title="Bench List"
          onRefresh={fetchBenchList}
          refreshData={fetchBenchList}
          isRefreshing={loading}
          enableSelection={false}
          defaultSortColumn="id"
          defaultSortDirection="desc"
          noDataMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Records Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No bench consultants found.
              </Typography>
            </Box>
          }
          sx={{
            '& .MuiDataGrid-root': {
              border: 'none',
              borderRadius: 2,
              overflow: 'hidden',
            },
          }}
          uniqueId="id"
        />
      )}

      {/* Reusable Form Component - handles both Add and Edit */}
      <BenchCandidateForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        id={editCandidateId}
        initialData={editCandidateId ? benchData.find(item => item.id === editCandidateId) : null} 
      />

      {/* View Modal with Filter Controls */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          ToastService.info("Closed candidate details view");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Candidate Details - {selectedCandidate?.fullName}
            </Typography>
            
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCandidate ? (
            <CandidateDetails candidate={selectedCandidate} />
          ) : (
            <Box sx={{ p: 3 }}>
              <Skeleton variant="rectangular" width="100%" height={400} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete{' '}
            <strong>{candidateToDelete?.fullName}</strong> from the bench list?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BenchList;