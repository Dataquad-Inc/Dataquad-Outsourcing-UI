import React from 'react';
import {
  Link,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ColumnsForInterviews = ({ onEdit, onDelete, userRole = 'all', showActions = true } = {}) => {
  const safeOnEdit = onEdit || (() => console.log('Edit function not provided'));
  const safeOnDelete = onDelete || (() => console.log('Delete function not provided'));

  const baseColumns = [
    {
      id: 'interviewId',
      label: 'Interview ID',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'rtrId',
      label: 'RTR ID',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'consultantName',
      label: 'Consultant',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'consultantEmailId',
      label: 'Email',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'technology',
      label: 'Technology',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'clientName',
      label: 'Client',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'salesExecutive',
      label: 'Sales Executive',
      applyFilter: true,
      filterType: 'text',
    },
    // {
    //   id: 'interviewLevel',
    //   label: 'Level',
    //   applyFilter: true,
    //   filterType: 'select',
    //   filterOptions: [
    //     { value: 'L1', label: 'L1' },
    //     { value: 'L2', label: 'L2' },
    //     { value: 'L3', label: 'L3' },
    //     { value: 'Final', label: 'Final' },
    //   ],
    // },
    {
      id: 'interviewLevel',
      label: 'Level',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'Technical Assessment (Test)', label: 'Technical Assessment (Test)' },
        { value: 'Technical Screening', label: 'Technical Screening' },
        { value: 'L1 - Vendor Round', label: 'L1 - Vendor Round' },
        { value: 'L2 - Vendor Round', label: 'L2 - Vendor Round' },
        { value: 'C1 - Client Round', label: 'C1 - Client Round' },
        { value: 'C2 - Client Round', label: 'C2 - Client Round' },
        { value: 'F - Final Client Round', label: 'F - Final Client Round' },
        { value: 'HM - HR Round', label: 'HM - HR Round' },
      ],
    },
    {
      id: 'interviewStatus',
      label: 'Status',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: 'Rescheduled', label: 'Rescheduled' },
      ],
      render: (value) => (
        <Chip
          label={value}
          color={
            value === 'Completed' ? 'success' :
              value === 'Scheduled' ? 'primary' :
                value === 'Cancelled' ? 'error' :
                  value === 'Rescheduled' ? 'warning' : 'default'
          }
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      id: 'interviewDateTime',
      label: 'Interview Date',
      applyFilter: true,
      filterType: 'date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      id: 'interviewTime',
      label: 'Interview Time',
      render: (_, row) => row.interviewDateTime ? new Date(row.interviewDateTime).toLocaleTimeString() : '-',
    },
    {
      id: 'interviewerEmailId',
      label: 'Interviewer Email',
      applyFilter: true,
      filterType: 'text',
    },
    {
      id: 'duration',
      label: 'Duration (mins)',
      applyFilter: true,
      filterType: 'number',
      render: (value) => value ? `${value} mins` : '-',
    },
    {
      id: 'isPlaced',
      label: 'Placed',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      render: (value) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          color={value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      id: 'zoomLink',
      label: 'Zoom Link',
      render: (value) => value ? (
        <Link
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 500,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Join Meeting
        </Link>
      ) : 'Not Available',
    }
  ];

  // Add actions column only if showActions is true
  if (showActions) {
    baseColumns.push({
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit Interview">
            <IconButton
              onClick={() => safeOnEdit(row)}
              size="small"
              color="primary"
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Interview">
            <IconButton
              onClick={() => safeOnDelete(row)}
              size="small"
              color="error"
              sx={{
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'white'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    });
  }

  return baseColumns;
};

export default ColumnsForInterviews;