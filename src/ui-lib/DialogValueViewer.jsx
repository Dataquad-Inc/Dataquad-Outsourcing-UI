import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import { useState } from "react";

const DialogValueViewer = ({
  value,
  label = "Details",
  chip = true,
  maxWidth = "xs",
}) => {
  const [open, setOpen] = useState(false);

  if (!value) return "-";

  return (
    <>
      {/* Compact Table View */}
      {chip ? (
        <Chip
          label={value}
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            maxWidth: 120,
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />
      ) : (
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: 120, cursor: "pointer" }}
          onClick={() => setOpen(true)}
        >
          {value}
        </Typography>
      )}

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={maxWidth}
        fullWidth
      >
        <DialogTitle>{label}</DialogTitle>

        <DialogContent>
          <Box mt={1}>
            {/* ✅ FULL DATA, NO CHIP */}
            <Typography variant="body1">
              {value}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DialogValueViewer;
