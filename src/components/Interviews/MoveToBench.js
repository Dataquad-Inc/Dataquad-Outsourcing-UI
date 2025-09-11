import React, { useState, useCallback } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography
} from '@mui/material';
import httpService from '../../Services/httpService';
import { showToast } from '../../utils/ToastNotification';
import { useSelector } from 'react-redux';

const MoveToBench = ({ row, onSuccess, isLoading }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedCandidate, setMatchedCandidate] = useState(null);
  
  const { userId, role } = useSelector((state) => state.auth);
  const [duplicateError, setDuplicateError] = useState("");


  // Fetch and match candidate by fullName
 const fetchAndMatchCandidate = useCallback(async () => {
  try {
    const candidateName = row.candidateFullName || row.fullName;
    if (!candidateName) {
      throw new Error("Candidate name not found");
    }

    // Fetch data based on role
    let response = await httpService.get(
      role === "TEAMLEAD"
        ? `/candidate/interviews/teamlead/${userId}`
        : `/candidate/interviews/interviewsByUserId/${userId}`
    );

    if (!response.data) {
      throw new Error("No candidates data found");
    }

    // Normalize response data to array
    let candidatesArray = (() => {
  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.candidates)) return data.candidates;
  if (Array.isArray(data.submissions)) return data.submissions;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.selfInterviews)) return data.selfInterviews;
  if (Array.isArray(data.teamInterviews)) return data.teamInterviews;

  console.error("⚠️ Unknown response format:", data);  // This line is essential
  throw new Error("Invalid response format: expected array or array property");
})();

    // Final safety check
    if (!Array.isArray(candidatesArray)) {
      console.error("Unexpected response structure:", response.data);
      throw new Error("Expected an array of candidates, got something else");
    }

    // Match by candidate name (case insensitive)
    const foundCandidate = candidatesArray.find(candidate =>
      candidate.fullName?.toLowerCase() === candidateName.toLowerCase() ||
      candidate.candidateFullName?.toLowerCase() === candidateName.toLowerCase()
    );

    if (!foundCandidate) {
      throw new Error(`Candidate "${candidateName}" not found in records`);
    }

    setMatchedCandidate(foundCandidate);

  } catch (error) {
    console.error("Error matching candidate:", error);
    showToast(error.message, "error");

    // Only show duplicate error if it's something you want to explicitly notify
    if (typeof duplicateError === "string" && duplicateError !== error.message) {
      showToast(duplicateError);
    }
  }
}, [row.candidateFullName, row.fullName, userId, role]);

  const handleOpen = (e) => {
    e.stopPropagation();
    console.log("Opening dialog for candidate:", row.candidateFullName || row.fullName);
    setOpenDialog(true);
    fetchAndMatchCandidate();
  };

  const handleClose = () => {
    console.log("Closing dialog");
    setOpenDialog(false);
    setFeedback('');
    setMatchedCandidate(null);
    setDuplicateError("");
  };

  const getCompleteCandidateData = useCallback(() => {
    // Priority: matched candidate data > row data
    const source = matchedCandidate || row;
    
    return {
      fullName: source.fullName || source.candidateFullName || "",
      emailId: source.email || source.emailId || source.candidateEmailId || "",
      contactNumber: source.contactNumber || source.candidateContactNo || "",
      relevantExperience: source.relevantExperience || "0",
      totalExperience: source.totalExperience || "0",
      skills: Array.isArray(source.skills) ? source.skills : 
             typeof source.skills === 'string' ? source.skills.split(',') : [],
      userEmail: source.userEmail || "",
      linkedin: source.linkedin || "",
      submissionId: source.submissionId || null,
      candidateId: source.candidateId || null,
      jobId: source.jobId || null,
      technology:source.technology||null,
      // Include any other relevant fields
      ...(matchedCandidate || {}),
      ...(row || {})
    };
  }, [matchedCandidate, row]);

const handleMoveToBench = async (e) => {
  e.stopPropagation();
  setIsSubmitting(true);
  
  try {
    const candidate = getCompleteCandidateData();
    
    if (!candidate.fullName || !candidate.emailId) {
      throw new Error("Candidate name and email are required");
    }

    const formData = new FormData();
    
    // Required fields
    formData.append("fullName", candidate.fullName);
    formData.append("email", candidate.emailId);
    formData.append("contactNumber", candidate.contactNumber || "");

    // Experience
    formData.append("relevantExperience", candidate.relevantExperience);
    formData.append("totalExperience", candidate.totalExperience);

    // Skills (ensure array format)
    const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : 
                      [candidate.skills].filter(Boolean);
    formData.append("skills", JSON.stringify(skillsArray));

    // Optional fields
    formData.append("linkedin", candidate.linkedin || "");
    formData.append("referredBy", candidate.recruiterName || "");
    formData.append("remarks", feedback || "");
    formData.append("technology", candidate.technology || "");

    // Move to bench
    const response = await httpService.post("/candidate/bench/save", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Delete submission if exists
    if (candidate.submissionId) {
      try {
        await httpService.delete(`/candidate/deletesubmission/${candidate.submissionId}`);
      } catch (deleteError) {
        console.error("Error deleting submission:", deleteError);
      }
    }

    showToast(`${candidate.fullName} moved to bench successfully!`, "success");
    onSuccess?.(candidate);
    handleClose();

  } catch (error) {
    console.error("Error moving to bench:", error);
    
    let errorMessage = "Failed to move candidate to bench";
    
    if (error.response) {
      const apiMessage = error.response.data?.message || error.response.data?.error || error.message;
      
      // Check for duplicate/already exists errors
      if (apiMessage?.toLowerCase().includes("already exists") || 
          apiMessage?.toLowerCase().includes("duplicate entry") ||
          apiMessage?.toLowerCase().includes("already in bench") ||
          apiMessage?.toLowerCase().includes("duplicate")) {
        errorMessage = apiMessage;
        
         setDuplicateError(errorMessage);
        // DON'T close the dialog for duplicate errors
      } else {
        errorMessage = apiMessage;
        handleClose(); // Close dialog for other API errors
      }
    } else if (error.message) {
      errorMessage = error.message;
      handleClose(); // Close dialog for general errors
    }

    // Show error message
    showToast(errorMessage, "error");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="primary"
        onClick={handleOpen}
        disabled={isLoading}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          px: 2,
          py: 0.5,
          "&:hover": {
            backgroundColor: "secondary.light",
            color: "secondary.contrastText",
          },
        }}
      >
        {isLoading ? <CircularProgress size={20} /> : "To Bench"}
      </Button>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Move to Bench</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {matchedCandidate ? (
              `Moving ${matchedCandidate.fullName || row.candidateFullName} to bench`
            ) : (
              `Preparing to move ${row.candidateFullName} to bench`
            )}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            type="text"
            fullWidth
            variant="outlined"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            multiline
            rows={4}
            required
            sx={{ mt: 2 }}
          />
          {duplicateError && (
  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
    {duplicateError}
  </Typography>
)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleMoveToBench}
            disabled={isSubmitting || !feedback.trim()}
            color="primary"
            variant="contained"
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm Move"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(MoveToBench);