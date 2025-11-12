import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import CustomDataTable from '../../ui-lib/CustomDataTable';
import { interviewsAPI } from '../../utils/api';
import ColumnsForInterviews from './ColumnsForInterviews';
import EditInterviewFormForUs from './EditInterviewFormForUs';
import { 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast,
  showLoadingToast,
  dismissToast 
} from '../../utils/toastUtils';

const SalesInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [editingInterview, setEditingInterview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { userId } = useSelector(state => state.auth);

  const columns = ColumnsForInterviews({
    onEdit: setEditingInterview,
    onDelete: setDeleteConfirm,
    showActions: true
  });

  const fetchInterviews = useCallback(async (currentPage = page, currentRowsPerPage = rowsPerPage, searchTerm = search, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        size: currentRowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...currentFilters
      };

      const response = await interviewsAPI.getSalesInterviews(userId, params);
      
      if (response.success) {
        setInterviews(response.data.content || []);
        setTotal(response.data.totalElements || 0);
      } else {
        setError(response.message || 'Failed to fetch interviews');
        showErrorToast(response.message || 'Failed to fetch your interviews');
        setInterviews([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      const errorMessage = 'An error occurred while fetching your interviews';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setInterviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filters, userId]);

  // Handle edit save
  const handleEditSave = async (updatedInterview) => {
    const loadingToastId = showLoadingToast('Updating interview...');
    
    try {
      setInterviews(prev => prev.map(interview => 
        interview.interviewId === updatedInterview.interviewId ? updatedInterview : interview
      ));
      
      dismissToast(loadingToastId);
      showSuccessToast('Interview updated successfully!');
      fetchInterviews();
    } catch (error) {
      dismissToast(loadingToastId);
      showErrorToast('Failed to update interview');
    }
  };

  // Handle delete
  const handleDelete = async (interview) => {
    const loadingToastId = showLoadingToast('Deleting interview...');
    
    try {
      setLoading(true);
      const response = await interviewsAPI.deleteInterviews(interview.interviewId,userId);
      
      if (response.success) {
        setInterviews(prev => prev.filter(i => i.interviewId !== interview.interviewId));
        setTotal(prev => prev - 1);
        setDeleteConfirm(null);
        dismissToast(loadingToastId);
        showSuccessToast('Interview deleted successfully!');
      } else {
        dismissToast(loadingToastId);
        showErrorToast(response.message || 'Failed to delete interview');
        setError(response.message || 'Failed to delete interview');
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      dismissToast(loadingToastId);
      const errorMessage = 'An error occurred while deleting the interview';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh with toast
  const handleRefresh = () => {
    showInfoToast('Refreshing your interviews...');
    fetchInterviews();
  };

  // Handle search clear with toast
  const handleSearchClear = () => {
    setSearch('');
    showInfoToast('Search cleared');
  };

  // Handle filters change with toast
  const handleFiltersChange = (newFilters) => {
    const filterCount = Object.keys(newFilters).length;
    setFilters(newFilters);
    setPage(0);
    
    if (filterCount > 0) {
      showInfoToast(`${filterCount} filter${filterCount > 1 ? 's' : ''} applied`);
    } else {
      showInfoToast('All filters cleared');
    }
  };

  // Initial fetch and when dependencies change
  useEffect(() => {
    if (userId) {
      fetchInterviews();
    }
  }, [fetchInterviews, userId]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userId) {
        setPage(0);
        fetchInterviews(0, rowsPerPage, search, filters);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, fetchInterviews, rowsPerPage, filters, userId]);

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    showInfoToast(`Showing ${newRowsPerPage} interviews per page`);
  };

  // Handle search change
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const transformedRows = interviews.map(interview => ({
    ...interview,
  }));

  return (
    <Box sx={{ padding: 2 }}>
      <CustomDataTable
        title="My Interviews"
        columns={columns}
        rows={transformedRows}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={loading}
        filters={filters}
        filterStorageKey="salesInterviewFilters"
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onRefresh={handleRefresh}
        onFiltersChange={handleFiltersChange}
      />
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Edit Form Modal */}
      {editingInterview && (
        <EditInterviewFormForUs
          interview={editingInterview}
          onClose={() => setEditingInterview(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Dialog
          open={true}
          onClose={() => setDeleteConfirm(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6" component="span">
                Confirm Delete
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography textAlign="center">
              Are you sure you want to delete interview <strong>{deleteConfirm.interviewId}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', gap: 1, pb: 3 }}>
            <Button
              onClick={() => setDeleteConfirm(null)}
              variant="outlined"
              color="inherit"
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(deleteConfirm)}
              variant="contained"
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
              sx={{ minWidth: 100 }}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SalesInterviews;