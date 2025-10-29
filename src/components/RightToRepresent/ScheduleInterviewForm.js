import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { rightToRepresentAPI } from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";

const ScheduleInterviewForm = ({ open, onClose, rtrId, consultantName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    interviewLevel: "",
    interviewDateTime: null,
    interviewerEmailId: "",
    zoomLink: "",
  });

  const [errors, setErrors] = useState({});

  const interviewLevels = [
    "L1 - Technical Screening",
    "L2 - Technical Deep Dive",
    "L3 - Managerial Round",
    "L4 - HR Round",
    "Final - Client Round"
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.interviewLevel.trim()) {
      newErrors.interviewLevel = "Interview level is required";
    }

    if (!formData.interviewDateTime) {
      newErrors.interviewDateTime = "Interview date and time is required";
    } else if (new Date(formData.interviewDateTime) <= new Date()) {
      newErrors.interviewDateTime = "Interview date must be in the future";
    }

    if (!formData.interviewerEmailId.trim()) {
      newErrors.interviewerEmailId = "Interviewer email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.interviewerEmailId)) {
      newErrors.interviewerEmailId = "Please enter a valid email address";
    }

    if (formData.duration) {
      const durationNum = Number(formData.duration);        
      if (isNaN(durationNum) || durationNum <= 0) {
        newErrors.duration = "Please enter a valid duration";
      }
    }

    if (!formData.zoomLink.trim()) {
      newErrors.zoomLink = "Zoom link is required";
    } else if (!formData.zoomLink.startsWith('http')) {
      newErrors.zoomLink = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const payload = {
        rtrId: rtrId,
        interviewLevel: formData.interviewLevel,
        interviewDateTime: formData.interviewDateTime.toISOString(),
        interviewerEmailId: formData.interviewerEmailId,
        zoomLink: formData.zoomLink
      };

      const result = await rightToRepresentAPI.moveRtrToInterviews(payload);
      
      showSuccessToast(result.message || "Interview scheduled successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error scheduling interview:", error);
      showErrorToast(error.response?.data?.message || "Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      interviewLevel: "",
      interviewDateTime: null,
      interviewerEmailId: "",
      zoomLink: "",
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Schedule Interview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consultant: {consultantName}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* Interview Level */}
            <FormControl fullWidth error={!!errors.interviewLevel}>
              <InputLabel>Interview Level *</InputLabel>
              <Select
                value={formData.interviewLevel}
                label="Interview Level *"
                onChange={(e) => handleChange("interviewLevel", e.target.value)}
              >
                {interviewLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
              {errors.interviewLevel && (
                <Typography variant="caption" color="error">
                  {errors.interviewLevel}
                </Typography>
              )}
            </FormControl>

            {/* Interview Date & Time */}
            <DateTimePicker
              label="Interview Date & Time *"
              value={formData.interviewDateTime}
              onChange={(newValue) => handleChange("interviewDateTime", newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.interviewDateTime,
                  helperText: errors.interviewDateTime
                }
              }}
              minDateTime={new Date()}
            />

            {/* Interviewer Email */}
            <TextField
              label="Interviewer Email *"
              type="email"
              value={formData.interviewerEmailId}
              onChange={(e) => handleChange("interviewerEmailId", e.target.value)}
              error={!!errors.interviewerEmailId}
              helperText={errors.interviewerEmailId}
              fullWidth
            />
            <TextField
              label="Duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
              error={!!errors.duration}
              helperText={errors.duration}
              fullWidth
            />

            {/* Zoom Link */}
            <TextField
              label="Zoom Meeting Link *"
              value={formData.zoomLink}
              onChange={(e) => handleChange("zoomLink", e.target.value)}
              error={!!errors.zoomLink}
              helperText={errors.zoomLink}
              fullWidth
              placeholder="https://zoom.us/j/..."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ScheduleInterviewForm;