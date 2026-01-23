import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Paper } from "@mui/material";
import AdminSubmissions from "./AdminSubmissions";
import TeamLeadSubmissions from "./TeamLeadSubmissions";
import RecruiterSubmissions from "./RecruiterSubmissions";

const Submission = () => {
  const { role } = useSelector((state) => state.auth);

  const renderComponent = () => {
    switch (role) {
      case "SUPERADMIN":
      case "COORDINATOR":
      case "ADMIN":
        return <AdminSubmissions />;
      
      case "TEAMLEAD":
        return <TeamLeadSubmissions />;
      
      case "EMPLOYEE":
      case "BDM":
        return <RecruiterSubmissions />;
      
      default:
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '60vh',
              p: 3 
            }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                maxWidth: 500,
                borderRadius: 2
              }}
            >
              <Typography variant="h5" color="error" gutterBottom>
                Access Denied
              </Typography>
              <Typography variant="body1" color="textSecondary">
                You don't have permission to access this page.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Current Role: {role || "Unknown"}
              </Typography>
            </Paper>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {renderComponent()}
    </Box>
  );
};

export default Submission;