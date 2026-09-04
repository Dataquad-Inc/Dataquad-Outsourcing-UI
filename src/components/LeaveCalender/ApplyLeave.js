import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchEmployees } from '../../redux/employeesSlice'; // Adjust path as needed
import DynamicForm from '../FormContainer/DynamicForm'; // Adjust path as needed
import httpService from '../../Services/httpService';
import ToastService from '../../Services/toastService';
import { 
  Box, 
  Typography, 
  Paper,
  IconButton,
  Divider 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const ApplyLeave = ({ onCancel }) => {
  const dispatch = useDispatch();
  const { employeesList } = useSelector((state) => state.employee);
  const { userId } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  
  // Fetch employees when component mounts
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);
  
  // Filter active managers (SUPERADMIN)
  const activeManagers = employeesList?.filter(
    (emp) =>
      (emp.roles === "ADMIN" || emp.roles === "SUPERADMIN") &&
      emp.status === "ACTIVE"
  ) || [];
  

  
  // Format managers for dropdown selection
  const managerOptions = activeManagers.map((manager) => ({
    value: manager.email,
    label: `${manager.email} [${manager.userName}]`
  }));
  
  // Leave type options
  const leaveTypeOptions = [
    { value: "CASUAL", label: "Casual Leave" },
    { value: "SICK", label: "Sick Leave" },
    { value: "ANNUAL", label: "Annual Leave" },
    { value: "MATERNITY", label: "Maternity Leave" },
    { value: "PATERNITY", label: "Paternity Leave" },
    { value: "OTHER", label: "Other" }
  ];
  
  // Form fields configuration
  const formFields = [
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      required: true,
      gridProps: { xs: 12, sm: 6 },
      sx: { mb: 2 },
      helperText: "Select the first day of leave"
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      required: true,
      gridProps: { xs: 12, sm: 6 },
      sx: { mb: 2 },
      helperText: "Select the last day of leave"
    },
    {
      name: "leaveType",
      label: "Leave Type",
      type: "select",
      options: leaveTypeOptions,
      required: true,
      gridProps: { xs: 12, sm: 6 },
      sx: { mb: 2 }
    },
    {
      name: "managerEmail",
      label: "Manager",
      type: "multiselect",
      options: managerOptions,
      required: true,
      gridProps: { xs: 12, sm: 6 },
      sx: { mb: 2 },
      helperText: "Select manager(s) for approval"
    },
    {
      name: "description",
      label: "Reason for Leave",
      type: "textarea",
      required: true,
      gridProps: { xs: 12 },
      sx: { mb: 2 },
      rows: 4,
      helperText: "Briefly describe the reason for your leave request"
    }
  ];
  
  // Initial form values
  const formInitialValues = {
    userId: userId || "",
    startDate: null,
    endDate: null,
    noOfDays: 0,
    leaveType: "",
    managerEmail: [],
    description: ""
  };
  
  // Calculate number of days between start and end dates
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
    
    return diffDays;
  };
  
  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Calculate number of days
      const noOfDays = calculateDays(values.startDate, values.endDate);
      
      // Prepare data for submission
      const leaveData = {
        ...values,
        noOfDays,
        userId: userId || "",
        // Convert managerEmail from array of objects to array of strings if needed
        managerEmail: Array.isArray(values.managerEmail) 
          ? values.managerEmail.map(manager => typeof manager === 'object' ? manager.value : manager)
          : values.managerEmail
      };
      
      // Show loading toast
      const toastId = ToastService.loading("Submitting leave request...");
      
      // Make API call
      const response = await httpService.post('/users/save', leaveData);
      
      // Update toast based on response
      if (response.data && response.data.success) {
        ToastService.update(toastId, "Leave request submitted successfully!", "success");
        // Close form
        if (onCancel && typeof onCancel === 'function') {
          onCancel();
        }
      } else {
        ToastService.update(toastId, response.data.message || "Failed to submit leave request", "error");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      ToastService.error(error.response?.data?.message || "An error occurred while submitting your leave request");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header with close button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',

        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid #eaeaea'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventAvailableIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            Apply for Leave
          </Typography>
        </Box>
        <IconButton onClick={onCancel} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Form content */}
      <Box sx={{ p: 3 }}>
        <DynamicForm
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={formInitialValues}
          submitButtonText="Submit Leave Request"
          cancelButtonText="Cancel"
          onCancel={onCancel}
          loading={loading}
          sx={{ mt: 2 }}
        />
      </Box>
    </Box>
  );
};

export default ApplyLeave;