import React, { useState } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import { Visibility } from "@mui/icons-material";
import { CustomModal } from "../ui-lib/CustomModal";

/**
 * Reusable component to render truncated text with "More" button and modal
 * @param {string} value - The full text content
 * @param {string} label - Label for the modal title (e.g., "Overall Feedback", "Description")
 * @param {string} identifier - Identifier for the row (e.g., candidate name, job title)
 * @param {number} maxLength - Maximum characters to show before truncating (default: 50)
 * @param {number} maxWidth - Maximum width for the truncated text in pixels (default: 120)
 */
export const ViewMoreCell = ({ 
  value, 
  label = "Details", 
  identifier = "", 
  maxLength = 50,
  maxWidth = 120 
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (!value) {
    return <Typography variant="body2">-</Typography>;
  }

  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth }}>
          {value.length > maxLength ? `${value.substring(0, maxLength)}...` : value}
        </Typography>
        {value.length > maxLength && (
          <Button
            variant="text"
            size="small"
            color="primary"
            startIcon={<Visibility fontSize="small" />}
            onClick={handleOpen}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              minWidth: "auto",
            }}
          >
            More
          </Button>
        )}
      </Box>

      <CustomModal
        open={modalOpen}
        onClose={handleClose}
        title={identifier ? `${label} - ${identifier}` : label}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ pt: 1 }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              maxHeight: "60vh",
              overflow: "auto",
              p: 1,
              backgroundColor: "grey.50",
              borderRadius: 1,
            }}
          >
            {value}
          </Typography>
        </Box>
      </CustomModal>
    </>
  );
};

/**
 * Alternative: Icon-only version
 */
export const ViewMoreIconCell = ({ 
  value, 
  label = "Details", 
  identifier = "" 
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (!value) {
    return <Typography variant="body2">-</Typography>;
  }

  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </Typography>
        {value.length > 30 && (
          <IconButton
            size="small"
            color="primary"
            onClick={handleOpen}
            sx={{ p: 0.5 }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        )}
      </Box>

      <CustomModal
        open={modalOpen}
        onClose={handleClose}
        title={identifier ? `${label} - ${identifier}` : label}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ pt: 1 }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              maxHeight: "60vh",
              overflow: "auto",
              p: 1,
              backgroundColor: "grey.50",
              borderRadius: 1,
            }}
          >
            {value}
          </Typography>
        </Box>
      </CustomModal>
    </>
  );
};