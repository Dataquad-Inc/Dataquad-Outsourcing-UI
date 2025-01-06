import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  CircularProgress,
  Box,
  Button,
  Typography,
  ButtonGroup,
  Container,
  useTheme,
  useMediaQuery
} from "@mui/material";
import ReusableTable from "../ReusableTable";
import BASE_URL from "../../redux/apiConfig";

const INTERVIEW_LEVELS = {
  ALL: 'all',
  INTERNAL: 'Internal',
  EXTERNAL: 'External'
};

const Interview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterLevel, setFilterLevel] = useState(INTERVIEW_LEVELS.ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { user } = useSelector((state) => state.auth);
  const userId = user;

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(false);
        
        const response = await axios.get(`${BASE_URL}/candidate/interviews/${userId}`);
        const interviewData = response.data || [];
        
        setData(interviewData);
        applyFilter(interviewData, INTERVIEW_LEVELS.ALL);
      } catch (err) {
        console.error("Failed to fetch interview details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewDetails();
  }, [userId]);

  const filterDataWithValidSchedule = (interviews) => {
    return interviews.filter((interview) => {
      // Ensure the interview has a valid scheduled time, duration, and zoom link
      return interview.interviewDateTime && interview.duration && interview.zoomLink;
    });
  };

  const applyFilter = (interviews, level) => {
    let filtered = [];

    if (level === INTERVIEW_LEVELS.ALL) {
      filtered = filterDataWithValidSchedule(interviews);
    } else {
      filtered = interviews.filter((interview) =>
        interview.interviewLevel === level && interview.interviewDateTime && interview.duration && interview.zoomLink
      );
    }

    setFilteredData(filtered);
    setPage(0); // Reset to first page when filter changes
  };

  const handleFilterChange = (level) => {
    setFilterLevel(level);
    applyFilter(data, level);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page change
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    try {
      return new Date(dateTime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  const onCellRender = (row, header) => {
    switch (header) {
      case "interviewDateTime":
      case "interviewScheduledTimestamp":
        return formatDateTime(row[header]);
      case "duration":
        return row[header] ? `${row[header]} minutes` : ''; // Return an empty string instead of 'N/A'
      case "zoomLink":
        return row[header] ? (
          <Button
            variant="contained"
            size="small"
            href={row[header]}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textTransform: 'none',
              minWidth: '100px',
              fontSize: '0.875rem'
            }}
          >
            Join Meeting
          </Button>
        ) : ''; // Return an empty string instead of 'N/A'
      case "candidateContactNo":
        return row[header] ? (
          <a href={`tel:${row[header]}`} style={{ textDecoration: 'none', color: theme.palette.primary.main }}>
            {row[header]}
          </a>
        ) : ''; // Return an empty string instead of 'N/A'
      case "candidateEmailId":
      case "userEmail":
      case "clientEmail":
        return row[header] ? (
          <a href={`mailto:${row[header]}`} style={{ textDecoration: 'none', color: theme.palette.primary.main }}>
            {row[header]}
          </a>
        ) : ''; // Return an empty string instead of 'N/A'
      default:
        return row[header] || ''; // Return an empty string instead of 'N/A'
    }
  };

  const FilterButtonGroup = () => (
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: 'flex-start',
        width: '100%',
        mb: 1 ,
        ml:1,
      }}
    >
      <ButtonGroup
        variant="contained"
        sx={{
          '& .MuiButton-root': {
            minWidth: { xs: '90px', sm: '120px' },
            height: '40px',
            textTransform: 'none',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&.active': {
              backgroundColor: 'primary.dark',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
            },
          },
        }}
      >
        {Object.entries(INTERVIEW_LEVELS).map(([key, value]) => (
          <Button
            key={key}
            className={filterLevel === value ? 'active' : ''}
            onClick={() => handleFilterChange(value)}
            sx={{
              bgcolor: filterLevel === value ? 'primary.dark' : 'primary.main',
            }}
          >
            {key === 'ALL' ? 'All' : value}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );

  // Ensure filteredData is not empty and pagination doesn't throw NaN
  const totalFilteredDataCount = filteredData.length;
  const totalPages = Math.ceil(totalFilteredDataCount / rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", padding: 4, color: 'error.main' }}>
        Failed to load interviews. Please try again later.
      </Box>
    );
  }

  const headers = data.length > 0 
    ? Object.keys(data[0])
    : [];

  const emptyRow = headers.reduce((acc, header) => {
    acc[header] = '';
    return acc;
  }, {});

  // Apply pagination to the filtered data
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" maxHeight="100vh" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '88vh', 
      }}>
        {/* Header Section */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 },
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0, // Prevent header from shrinking
        }}>
          <Typography 
            variant="h5" 
            component="h1"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600,
              mb: 2
            }}
          >
            Interview Schedule
          </Typography>
          
          {data.length > 0 && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Total Records {filteredData.length} {filterLevel !== 'all' ? filterLevel : ''} interview{filteredData.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Filter Buttons */}
        <FilterButtonGroup />

        {/* Table Section */}
        <Box sx={{ 
          p: { xs: 1, sm: 2 },
          flexGrow: 1, // Allow table section to take available space
          overflowY: 'auto', // Enable vertical scrolling
          maxHeight: 'calc(100vh - 230px)', // Adjusted height for the table to fit within the view
        }}>
          {filteredData.length === 0 ? (
            <Typography 
              variant="body1" 
              sx={{ 
                textAlign: "center", 
                py: 4,
                color: 'text.secondary'
              }}
            >
              No interview data available.
            </Typography>
          ) : (
            <ReusableTable
              data={paginatedData}
              headers={headers}
              emptyRow={emptyRow}
              onCellRender={onCellRender}
              rowsPerPage={rowsPerPage}
              page={page}
              handlePageChange={handlePageChange}
              handleRowsPerPageChange={handleRowsPerPageChange}
              totalCount={totalFilteredDataCount}
              totalPages={totalPages}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Interview;
