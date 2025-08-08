// src/components/CustomToast.jsx
import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

const iconMap = {
  success: <CheckCircleIcon color="success" />,
  error: <ErrorIcon color="error" />,
  info: <InfoIcon color="info" />,
  warning: <WarningIcon color="warning" />,
};

const CustomToast = ({ message, type = "info" }) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {iconMap[type]}
      <Typography variant="body2" sx={{ color: 'text.primary' }}>
        {message}
      </Typography>
    </Stack>
  );
};

export default CustomToast;
