import { Box, Button } from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const RequirementProfile = () => {
  // Destructure jobId from params
  const { jobId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      RequirementProfile for Job ID: {jobId}
      <Box>
        <Button onClick={() => navigate("/dashboard/us-requirements")}>Back To Requirements</Button>
      </Box>
    </div>
  );
};

export default RequirementProfile;