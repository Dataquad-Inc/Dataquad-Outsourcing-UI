import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const LockConfirmDialog = ({
  open,
  title = "Are you sure?",
  content = "This action cannot be undone.",
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          px: 2,
          py: 1,
          backgroundColor: "#fff",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
        <WarningAmberIcon sx={{ color: "warning.main", mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText sx={{ color: "text.secondary" }}>
          {content}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "flex-end", px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ boxShadow: "none" }}
        >
          Lock
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LockConfirmDialog;
