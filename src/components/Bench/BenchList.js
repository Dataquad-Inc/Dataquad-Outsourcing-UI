import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { filterBenchListByDateRange, setFilteredDataRequested } from '../../redux/benchSlice';
import { User2Icon } from 'lucide-react';
import InternalFeedbackCell from '../Interviews/FeedBack';

const BenchList = () => {
  const [benchData, setBenchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [downloadingResume, setDownloadingResume] = useState(false);

  // Form handling states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');

  const { isFilteredDataRequested, filteredBenchList } = useSelector((state) => state.bench);

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const dispatch = useDispatch();
  const isUpdating = useRef(false);


  const fetchBenchList = useCallback(async (currentPage, currentRowsPerPage, search) => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        size: currentRowsPerPage,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      console.log('Fetching bench list with params:', params);
      const response = await httpService.get('/candidate/bench/getBenchList', params);

      const data = response.data.data || [];
      const total = response.data.totalItems || 0;

      console.log('Received data:', { dataLength: data.length, total, currentPage });

      setBenchData(data);
      setTotalCount(total);
      ToastService.success(`Loaded ${data?.length || 0} bench candidates (Total: ${total})`);
    } catch (error) {
      console.error('Failed to fetch bench list:', error);
      ToastService.error('Failed to load bench candidates');
      setBenchData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUpdating.current) return;

    isUpdating.current = true;

    fetchBenchList(page, rowsPerPage, searchKeyword);

    setTimeout(() => {
      isUpdating.current = false;
    }, 0);
  }, [page, rowsPerPage, searchKeyword]);

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
    fetchBenchList(page, rowsPerPage, searchKeyword);
  };

  const handleDelete = (row) => {
    setCandidateToDelete(row);
    setDeleteDialogOpen(true);
    ToastService.warning(`Preparing to delete ${row.fullName}`);
  };

  const confirmDelete = async () => {
    try {
      const toastId = ToastService.loading('Deleting candidate...');
      await httpService.delete(`/candidate/bench/deletebench/${candidateToDelete.id}`);
      ToastService.update(toastId, 'Candidate deleted successfully!', 'success');
      fetchBenchList(page, rowsPerPage, searchKeyword);
      setDeleteDialogOpen(false);
    } catch (error) {
      ToastService.error('Failed to delete candidate');
      console.error('Error deleting candidate:', error);
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    console.log('Page changed:', newPage, 'RowsPerPage:', newRowsPerPage);
    setPage(newPage);
    if (newRowsPerPage !== undefined && newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    console.log('RowsPerPage changed:', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page on rows-per-page change
  };

  const handleSearch = (keyword) => {
    console.log('Search keyword:', keyword);
    setSearchKeyword(keyword);
    setPage(0); // Reset to first page on new search
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
      key: 'remarks',
      label: 'Remarks',
      type: 'text',
      align: 'center',
      render: (row) => (
        <InternalFeedbackCell value={row.remarks} type='remarks' />
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
          <Button variant="text" color="primary" onClick={handleAdd} disabled={loading}>
            <Add /> <User2Icon />
          </Button>
        </Stack>
      </Stack>

      <DataTablePaginated
        data={benchData || []}
        columns={generateColumns(loading)}
        title="Bench List"
        loading={loading}
        enableSelection={false}
        uniqueId="id"
        defaultSortColumn="id"
        defaultSortDirection="desc"
        defaultRowsPerPage={rowsPerPage}
        serverSide={true}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[10, 20, 40, 60, 80, 100]}
        refreshData={() => fetchBenchList(page, rowsPerPage, searchKeyword)}
        onSearchChange={handleSearch}
        searchValue={searchKeyword}
        enableLocalFiltering={false}
        enableServerSideFiltering={false}
      />

      {/* Add / Edit Form */}
      <BenchCandidateForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        id={editCandidateId}
        initialData={
          editCandidateId ? benchData.find((item) => item.id === editCandidateId) : null
        }
      />

      {/* View Modal */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          ToastService.info('Closed candidate details view');
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
            <strong>{candidateToDelete?.fullName}</strong> from the bench list? This action
            cannot be undone.
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