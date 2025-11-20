import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { interviewsAPI } from '../../utils/api';
import {
  showSuccessToast,
  showErrorToast,
  showLoadingToast,
  dismissToast
} from '../../utils/toastUtils';

// Validation Schema
const validationSchema = Yup.object({
  interviewStatus: Yup.string().required('Interview status is required'),
  interviewLevel: Yup.string().required('Interview level is required'),
  interviewDateTime: Yup.date().nullable(),
  interviewerEmailId: Yup.string()
    .email('Invalid email format')
    .required('Interviewer email is required'),
  zoomLink: Yup.string().url('Invalid URL format').nullable(),
  duration: Yup.number()
    .min(0, 'Duration cannot be negative')
    .integer('Duration must be a whole number')
    .nullable()
});

const EditInterviewFormForUs = ({ interview, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userId } = useSelector(state => state.auth);

  const formik = useFormik({
    initialValues: {
      interviewId: '',
      interviewStatus: '',
      interviewLevel: '',
      interviewDateTime: '',
      interviewerEmailId: '',
      zoomLink: '',
      duration: 0
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const loadingToastId = showLoadingToast('Updating interview...');
      setLoading(true);
      setError('');

      try {
        // Convert datetime to ISO format
        const submitData = {
          ...values,
          interviewDateTime: values.interviewDateTime ?
            new Date(values.interviewDateTime).toISOString() : null
        };

        const response = await interviewsAPI.updateInterviews(userId, submitData);

        if (response.success) {
          dismissToast(loadingToastId);
          showSuccessToast('Interview updated successfully!');
          onSave(response.data);
          onClose();
        } else {
          dismissToast(loadingToastId);
          showErrorToast(response.message || 'Failed to update interview');
          setError(response.message || 'Failed to update interview');
        }
      } catch (error) {
        console.error('Error updating interview:', error);
        dismissToast(loadingToastId);
        const errorMessage = 'An error occurred while updating the interview';
        setError(errorMessage);
        showErrorToast(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  });

  // Update form values when interview prop changes
  useEffect(() => {
    if (interview) {
      // Format date for datetime-local input
      const interviewDate = interview.interviewDateTime ?
        new Date(interview.interviewDateTime).toISOString().slice(0, 16) : '';

      formik.setValues({
        interviewId: interview.interviewId || '',
        interviewStatus: interview.interviewStatus || '',
        interviewLevel: interview.interviewLevel || '',
        interviewDateTime: interviewDate,
        interviewerEmailId: interview.interviewerEmailId || '',
        zoomLink: interview.zoomLink || '',
        duration: interview.duration || 0
      });
    }
  }, [interview]);

  if (!interview) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          fontWeight: 'bold',
          py: 2
        }}
      >
        Edit Interview
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Interview Status */}
            <FormControl fullWidth error={formik.touched.interviewStatus && Boolean(formik.errors.interviewStatus)}>
              <InputLabel>Interview Status</InputLabel>
              <Select
                name="interviewStatus"
                value={formik.values.interviewStatus}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Interview Status"
              >
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Rescheduled">Rescheduled</MenuItem>
              </Select>
              {formik.touched.interviewStatus && formik.errors.interviewStatus && (
                <FormHelperText>{formik.errors.interviewStatus}</FormHelperText>
              )}
            </FormControl>

            {/* Interview Level */}
            <FormControl fullWidth error={formik.touched.interviewLevel && Boolean(formik.errors.interviewLevel)}>
              <InputLabel>Interview Level</InputLabel>
              <Select
                name="interviewLevel"
                value={formik.values.interviewLevel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Interview Level"
              >
                <MenuItem value="Technical Assessment (Test)">Technical Assessment (Test)</MenuItem>
                <MenuItem value="Technical Screening">Technical Screening</MenuItem>
                <MenuItem value="L1 - Vendor Round">L1 - Vendor Round</MenuItem>
                <MenuItem value="L2 - Vendor Round">L2 - Vendor Round</MenuItem>
                <MenuItem value="C1 - Client Round">C1 - Client Round</MenuItem>
                <MenuItem value="C2 - Client Round">C2 - Client Round</MenuItem>
                <MenuItem value="F - Final Client Round">F - Final Client Round</MenuItem>
                <MenuItem value="HM - HR Round">HM - HR Round</MenuItem>
              </Select>
              {formik.touched.interviewLevel && formik.errors.interviewLevel && (
                <FormHelperText>{formik.errors.interviewLevel}</FormHelperText>
              )}
            </FormControl>

            {/* Interview Date & Time */}
            <TextField
              fullWidth
              type="datetime-local"
              name="interviewDateTime"
              label="Interview Date & Time"
              value={formik.values.interviewDateTime}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.interviewDateTime && Boolean(formik.errors.interviewDateTime)}
              helperText={formik.touched.interviewDateTime && formik.errors.interviewDateTime}
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Interviewer Email */}
            <TextField
              fullWidth
              type="email"
              name="interviewerEmailId"
              label="Interviewer Email"
              value={formik.values.interviewerEmailId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.interviewerEmailId && Boolean(formik.errors.interviewerEmailId)}
              helperText={formik.touched.interviewerEmailId && formik.errors.interviewerEmailId}
              required
            />

            {/* Zoom Link */}
            <TextField
              fullWidth
              type="url"
              name="zoomLink"
              label="Zoom Link"
              value={formik.values.zoomLink}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.zoomLink && Boolean(formik.errors.zoomLink)}
              helperText={formik.touched.zoomLink && formik.errors.zoomLink}
              placeholder="https://zoom.us/j/..."
            />

            {/* Duration */}
            <TextField
              fullWidth
              type="number"
              name="duration"
              label="Duration (minutes)"
              value={formik.values.duration}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.duration && Boolean(formik.errors.duration)}
              helperText={formik.touched.duration && formik.errors.duration}
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            disabled={loading}
            sx={{
              minWidth: 100,
              borderRadius: 1
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formik.isValid}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              minWidth: 120,
              borderRadius: 1
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditInterviewFormForUs;