import React from 'react';

const ColumnsForInterviews = () => {
  const columns = [
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
    {
      id: 'interviewLevel',
      label: 'Level',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'L1', label: 'L1' },
        { value: 'L2', label: 'L2' },
        { value: 'L3', label: 'L3' },
        { value: 'Final', label: 'Final' },
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
        <span style={{ 
          color: value ? '#4caf50' : '#f44336',
          fontWeight: 'bold'
        }}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      id: 'zoomLink',
      label: 'Zoom Link',
      render: (value, row) => value ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: '#1976d2',
            textDecoration: 'none',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          Join Meeting
        </a>
      ) : 'Not Available',
    }
  ];

  return columns;
};

export default ColumnsForInterviews;