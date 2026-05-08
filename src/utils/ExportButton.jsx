// components/muiComponents/ExportButton.jsx
import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  FileDownload,
  TableView,
  GridOn,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { exportFile } from "./exportFile";

/**
 * Reusable Export Button — drop into ANY component
 *
 * @param {String} apiUrl          - API endpoint to fetch export data from
 * @param {String} fileName        - Base file name (date appended automatically)
 * @param {Object} params          - Optional query params forwarded to the API
 * @param {Array}  selectedColumns - Optional: restrict which keys are exported
 * @param {String} label           - Button label  (default: "Export")
 * @param {String} size            - MUI size: "small" | "medium" | "large"
 * @param {String} color           - MUI color token  (default: "success")
 * @param {String} variant         - MUI variant: "contained" | "outlined" | "text"
 * @param {Object} sx              - Extra MUI sx styles
 *
 * Examples:
 *   <ExportButton apiUrl="/candidate/placement/placements-list" fileName="placements" />
 *
 *   <ExportButton
 *     apiUrl="/interviews/list"
 *     fileName="interviews"
 *     params={{ status: "Active" }}
 *     selectedColumns={["id", "candidateName", "interviewDate", "status"]}
 *     variant="outlined"
 *     size="small"
 *   />
 */
const ExportButton = ({
  apiUrl,
  fileName = "report",
  params = {},
  selectedColumns = null,
  label = "Export",
  size = "small",
  color = "success",
  variant = "contained",
  sx = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleExport = async (type) => {
    handleClose();
    setExporting(true);
    try {
      await exportFile(apiUrl, fileName, type, params, selectedColumns);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Tooltip title={`Export ${fileName} data`} arrow>
        {/* span keeps Tooltip working when button is disabled */}
        <span>
          <Button
            variant={variant}
            size={size}
            startIcon={
              exporting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <FileDownload fontSize="small" />
              )
            }
            endIcon={<KeyboardArrowDown fontSize="small" />}
            onClick={handleOpen}
            disabled={exporting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              letterSpacing: 0.3,
              backgroundColor: "#1976d2",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
              ...sx,
            }}
          >
            {exporting ? "Exporting…" : label}
          </Button>
        </span>
      </Tooltip>

      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => handleExport("csv")}>
          <ListItemText primary="Download CSV" />
        </MenuItem>

        <MenuItem onClick={() => handleExport("xlsx")}>
          <ListItemText primary="Download Excel" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;
