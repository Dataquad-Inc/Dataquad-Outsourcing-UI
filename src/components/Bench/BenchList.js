import React, { useEffect, useState, useCallback, useRef } from 'react';
import httpService, { API_BASE_URL } from '../../Services/httpService';
import DataTablePaginated from '../muiComponents/DataTablePaginated';
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
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Add,
} from '@mui/icons-material';
import ToastService from '../../Services/toastService';
import BenchCandidateForm from './BenchForm';
import CandidateDetails from './CandidateDetails';
import InternalFeedbackCell from '../Interviews/FeedBack';
import { User2Icon } from 'lucide-react';

const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 20;

const BenchList = () => {
  const [benchData, setBenchData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);
  const isMounted = useRef(false);


  const fetchBenchList = useCallback(async (
    currentPage = page,
    currentSize = rowsPerPage,
  ) => {
    try {
      setLoading(true);

      const response = await httpService.get('/candidate/bench/getBenchList', {
        page: currentPage,
        size: currentSize,
      });

      const { data, totalItems } = response.data;

      setBenchData(data || []);
      setTotalCount(totalItems || 0);

    } catch (error) {
      console.error('Failed to fetch bench list:', error);
      ToastService.error('Failed to load bench candidates');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchBenchList(page, rowsPerPage);
    }
  }, []);


  const handlePageChange = (newPage, currentRowsPerPage) => {
    setPage(newPage);
    fetchBenchList(newPage, currentRowsPerPage ?? rowsPerPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); 
    fetchBenchList(0, newRowsPerPage);
  };


  const handleView = (row) => {
    setSelectedCandidate({
      ...row,
      filterCriteria: {
        showBasicInfo: true,
        showContact: true,
        showExperience: true,
        showSkills: true,
        showEducation: true,
        showDocuments: true,
      },
    });
    setIsViewModalOpen(true);
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
    fetchBenchList(page, rowsPerPage);
  };

  const handleDelete = (row) => {
    setCandidateToDelete(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const toastId = ToastService.loading('Deleting candidate...');
      await httpService.delete(`/candidate/bench/deletebench/${candidateToDelete.id}`);
      ToastService.update(toastId, 'Candidate deleted successfully!', 'success');
      fetchBenchList(page, rowsPerPage);
      setDeleteDialogOpen(false);
    } catch (error) {
      ToastService.error('Failed to delete candidate');
      console.error('Error deleting candidate:', error);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Bench ID',
      sortable: true,
      filterable: true,
      width: 120,
    },
    {
      key: 'fullName',
      label: 'Full Name',
      sortable: true,
      filterable: true,
      width: 180,
    },
    {
      key: 'technology',
      label: 'Technology',
      sortable: true,
      filterable: true,
      width: 180,
    },
    {
      key: 'skills',
      label: 'Skills',
      sortable: true,
      filterable: true,
      width: 260,
      render: (row) =>
        !row.skills || row.skills.length === 0 ? (
          'N/A'
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
          'Invalid Data'
        ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      width: 220,
    },
    {
      key: 'contactNumber',
      label: 'Contact Number',
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: 'referredBy',
      label: 'Referred By',
      sortable: true,
      filterable: true,
      width: 180,
    },
    {
      key: 'totalExperience',
      label: 'Total Exp (Yrs)',
      sortable: true,
      filterable: true,
      width: 150,
      render: (row) => (
        <Chip
          label={row.totalExperience ?? 'N/A'}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      key: 'relevantExperience',
      label: 'Rel Exp (Yrs)',
      sortable: true,
      filterable: true,
      width: 150,
      render: (row) => (
        <Chip
          label={row.relevantExperience ?? 'N/A'}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ),
    },
    {
      key: 'remarks',
      label: 'Remarks',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 150,
      render: (row) => (
        <InternalFeedbackCell value={row.remarks} type="remarks" />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      filterable: false,
      width: 200,
      align: 'center',
      render: (row) => (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
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
            getDownloadUrl={(candidate, format) =>
              `${API_BASE_URL}/candidate/bench/download/${candidate.candidateId}?format=${format}`
            }
          />
        </Box>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
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

      {/* Data Table — server-side pagination, no search */}
      <DataTablePaginated
        data={benchData}
        columns={columns}
        title="Bench List"
        loading={loading}
        enableSelection={false}
        uniqueId="id"
        defaultSortColumn="id"
        defaultSortDirection="desc"
        defaultRowsPerPage={DEFAULT_ROWS_PER_PAGE}
        // Server-side pagination config
        serverSide={true}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        enableLocalFiltering={true}
        enableServerSideFiltering={true}
        refreshData={() => fetchBenchList(page, rowsPerPage)}
      />

      {/* Add / Edit Form */}
      <BenchCandidateForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        id={editCandidateId}
        initialData={
          editCandidateId
            ? benchData.find((item) => item.id === editCandidateId)
            : null
        }
      />

      {/* View Modal */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Candidate Details — {selectedCandidate?.fullName}
        </DialogTitle>
        <DialogContent dividers>
          {selectedCandidate ? (
            <CandidateDetails candidate={selectedCandidate} />
          ) : (
            <Skeleton variant="rectangular" width="100%" height={400} />
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
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
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