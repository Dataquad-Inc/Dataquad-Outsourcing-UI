import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box
} from '@mui/material';
import { Warning, Error, Info, CheckCircle } from '@mui/icons-material';

const iconMap = {
  warning: Warning,
  error: Error,
  info: Info,
  success: CheckCircle,
};

const colorMap = {
  warning: 'warning.main',
  error: 'error.main',
  info: 'info.main',
  success: 'success.main',
};

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
  ...props
}) => {
  const IconComponent = iconMap[type];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      {...props}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <IconComponent sx={{ color: colorMap[type], fontSize: 28 }} />
          {title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={type === 'error' ? 'error' : 'primary'}
          loading={loading}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};