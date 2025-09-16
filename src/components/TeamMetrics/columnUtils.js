
import React from 'react';
import { Chip, Skeleton } from '@mui/material';
import { number } from 'prop-types';

/**
 * Unified column generator for all user types (BDM, TEAMLEAD, EMPLOYEE, COORDINATOR)
 * @param {string} role User role (BDM, TEAMLEAD, EMPLOYEE, COORDINATOR)
 * @param {function} handleEmployeeClick Function to handle click on employee name/id
 * @param {boolean} loading Loading state for skeleton display
 * @returns {Array} Array of column configurations
 */
export const generateColumns = (role, handleEmployeeClick, loading = false) => {
  // Common base columns for all roles except COORDINATOR
  const baseColumns = role !== 'COORDINATOR' ? [
    {
      key: role === 'BDM' ? "employeeId" : "employeeId", // Key consistency
      label: role === 'BDM' ? "Employee ID" : "Employee ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: role === 'BDM' ? 120 : 120,
      render: (row) => loading ? (
        <Skeleton variant="text" width={100} height={24} />
      ) : (
        <span 
          style={{ 
            cursor: 'pointer', 
            color: '#1976d2',
            textDecoration: 'underline' 
          }}
          onClick={() => handleEmployeeClick(row.employeeId)}
        >
          {role === 'BDM' ? row.employeeId : row.employeeId}
        </span>
      ),
    },
    {
      key: "employeeName",
      label: "Employee Name",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: (row) => loading ? (
        <Skeleton variant="text" width={150} height={24} />
      ) : (
        row.employeeName
      ),
    }
  ] : [];

  // Special columns for COORDINATOR role
  const coordinatorColumns = role === 'COORDINATOR' ? [
    {
      key: "employeeId",
      label: "Employee ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: 120,
      render: (row) => loading ? (
        <Skeleton variant="text" width={100} height={24} />
      ) : (
        <span 
          style={{ 
            cursor: 'pointer', 
            color: '#1976d2',
          }}
          onClick={() =>row.employeeId}
        >
          {row.employeeId}
        </span>
      ),
    },
    {
      key: "employeeName",
      label: "Employee Name",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: (row) => loading ? (
        <Skeleton variant="text" width={150} height={24} />
      ) : (
        row.employeeName
      ),
    },
    {
      key: "employeeEmail",
      label: "Employee Email",
      type: "text",
      sortable: true,
      filterable: true,
      width: 200,
      render: (row) => loading ? (
        <Skeleton variant="text" width={180} height={24} />
      ) : (
        row.employeeEmail
      ),
    },
    {
      key: "getTotalInterviews",
      label: "Interviews",
      type: "number",
      sortable: true,
      filterable: true,
      width: 140,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={80} height={24} />
      ) : (
        <Chip
          label={row.getTotalInterviews || 0}
          size="small"
          sx={{
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
          }}
        />
      ),
    },
     {
      key: "totalScheduled",
      label: "Scheduled",
      type: "number",
      sortable: true,
      filterable: true,
      width: 140,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={80} height={24} />
      ) : (
        <Chip
          label={row.totalScheduled || 0}
          size="small"
          sx={{
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
          }}
        />
      ),
    },
    {
      key: "totalSelected",
      label: "Selected",
      type: "number",
      sortable: true,
      filterable: true,
      width: 130,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={80} height={24} />
      ) : (
        <Chip
          label={row.totalSelected || 0}
          size="small"
          sx={{
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      key: "totalRejected",
      label: "Rejected",
      type: "number",
      sortable: true,
      filterable: true,
      width: 130,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={80} height={24} />
      ) : (
        <Chip
          label={row.totalRejected || 0}
          size="small"
          sx={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            fontWeight: 600,
          }}
        />
      ),
    }
  ] : [];

  // Role-specific columns for non-coordinator roles
  const roleSpecificColumns = {
    BDM: [
      {
        key: "status",
        label: "Status",
        type: "select",
        sortable: true,
        filterable: true,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={80} height={24} />
        ) : (
          <Chip
            label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              fontWeight: 600,
              backgroundColor: row.status === 'ACTIVE' ? '#e8f5e9' : '#ffebee',
              color: row.status === 'ACTIVE' ? '#2e7d32' : '#c62828',
              '& .MuiChip-icon': {
                color: row.status === 'ACTIVE' ? '#4caf50' : '#f44336',
              }
            }}
            icon={
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: row.status === 'ACTIVE' ? '#4caf50' : '#f44336',
                marginRight: 4
              }} />
            }
          />
        ),
        width: 120,
        options: ["ACTIVE", "INACTIVE"],
      }
    ],
    TEAMLEAD: [
      {
        key: "role",
        label: "Role",
        type: "text",
        sortable: true,
        filterable: true,
        width: 100,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={80} height={24} />
        ) : (
          <Chip
            label="Team Lead"
            size="small"
            color="info"
            variant="outlined"
          />
        ),
      }
    ],
    EMPLOYEE: [
      {
        key: "role",
        label: "Role",
        type: "text",
        sortable: true,
        filterable: true,
        width: 100,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={80} height={24} />
        ) : (
          <Chip
            label="Employee"
            size="small"
            color="info"
            variant="outlined"
          />
        ),
      }
    ]
  };

  // Return early for COORDINATOR role with its specific columns
  if (role === 'COORDINATOR') {
    return coordinatorColumns;
  }

  // Common metrics columns based on role
  let metricsColumns = [];
  
  // For BDM, show all metrics
  if (role === 'BDM') {
    metricsColumns = [
      {
        key: "clientCount",
        label: "Clients",
        type: "number",
        sortable: true,
        filterable: true,
        width: 100,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.clientCount || 0}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        key: "requirementsCount",
        label: "Requirements",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.requirementsCount || 0}
            size="small"
            variant="outlined"
            color="primary"
          />
        ),
      },
      {
        key: "submissionCount",
        label: "Submissions",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.submissionCount || 0}
            size="small"
            variant="outlined"
            color="info"
          />
        ),
      },
      {
        key: "interviewCount",
        label: "Interviews",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.interviewCount || 0}
            size="small"
            sx={{
              backgroundColor: '#e3f2fd',
              color: '#1565c0',
            }}
          />
        ),
      },
      {
        key: "placementCount",
        label: "Placements",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.placementCount || 0}
            size="small"
            sx={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 600,
            }}
          />
        ),
      }
    ];
  } else if (role === 'EMPLOYEE') {
    // For Employee, show all metrics with different key names
    metricsColumns = [
      {
        key: "numberOfClients",
        label: "Clients",
        type: "number",
        sortable: true,
        filterable: true,
        width: 100,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfClients || 0}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        key: "numberOfRequirements",
        label: "Requirements",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfRequirements || 0}
            size="small"
            variant="outlined"
            color="primary"
          />
        ),
      },
      {
        key: "numberOfSubmissions",
        label: "Submissions",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfSubmissions || 0}
            size="small"
            variant="outlined"
            color="info"
          />
        ),
      },
      {
        key:"numberOfScreenRejects",
        label: "Screen Reject",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfScreenRejects || 0}
            size="small"
            variant="outlined"
            color="error"
          />
        )
      },
      {
        key: "numberOfInterviews",
        label: "Interviews",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfInterviews || 0}
            size="small"
            sx={{
              backgroundColor: '#e3f2fd',
              color: '#1565c0',
            }}
          />
        ),
      },
      {
        key: "numberOfPlacements",
        label: "Placements",
        type: "number",
        sortable: true,
        filterable: true,
        width: 110,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfPlacements || 0}
            size="small"
            sx={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 600,
            }}
          />
        ),
      }
    ];
  } else if (role === 'TEAMLEAD') {
    // For TEAMLEAD, just show clients and requirements, but not submissions, interviews, placements
    metricsColumns = [
      {
        key: "numberOfClients",
        label: "Clients",
        type: "number",
        sortable: true,
        filterable: true,
        width: 100,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfClients || 0}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        key: "numberOfRequirements",
        label: "Requirements",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.numberOfRequirements || 0}
            size="small"
            variant="outlined"
            color="primary"
          />
        ),
      }
    ];
  }

  // Team lead specific metrics - only shown for TEAMLEAD role
  const teamLeadExtras = role === 'TEAMLEAD' ? [
    {
      key: 'selfSubmissions',
      label: 'Self Submissions',
      type: 'number',
      sortable: true,
      filterable: true,
      width: 150,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={60} height={24} />
      ) : (
        <Chip
          label={row.selfSubmissions || 0}
          size="small"
          variant="outlined"
          color="info"
        />
      ),
    },
    {
        key:"teamScreenRejectCount",
        label: "Screen Reject",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => loading ? (
          <Skeleton variant="rectangular" width={60} height={24} />
        ) : (
          <Chip
            label={row.teamScreenRejectCount || 0}
            size="small"
            variant="outlined"
            color="error"
          />
        )
      },
    {
      key: 'selfInterviews',
      label: 'Self Interviews',
      type: 'number',
      sortable: true,
      filterable: true,
      width: 140,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={60} height={24} />
      ) : (
        <Chip
          label={row.selfInterviews || 0}
          size="small"
          variant="outlined"
          color="info"
        />
      ),
    },
    {
      key: 'selfPlacements',
      label: 'Self Placements',
      type: 'number',
      sortable: true,
      filterable: true,
      width: 140,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={60} height={24} />
      ) : (
        <Chip
          label={row.selfPlacements || 0}
          size="small"
          sx={{
            backgroundColor: '#f3e5f5',
            color: '#7b1fa2',
          }}
        />
      ),
    },
    {
      key: 'teamSubmissions',
      label: 'Team Submissions',
      type: 'number',
      sortable: true,
      filterable: true,
      width: 150,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={60} height={24} />
      ) : (
        <Chip
          label={row.teamSubmissions || 0}
          size="small"
          variant="outlined"
          color="warning"
        />
      ),
    },
    {
      key: 'teamInterviews',
      label: 'Team Interviews',
      type: 'number',
      sortable: true,
      filterable: true,
      width: 140,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={60} height={24} />
      ) : (
        <Chip
          label={row.teamInterviews || 0}
          size="small"
          variant="outlined"
          color="warning"
        />
      ),
    },
    {
      key: 'teamPlacements',
      label: 'Team Placements',
      type: 'number',
      sortable: true,
      filterable: true,
      width: 140,
      render: (row) => loading ? (
        <Skeleton variant="rectangular" width={60} height={24} />
      ) : (
        <Chip
          label={row.teamPlacements || 0}
          size="small"
          sx={{
            backgroundColor: '#fff8e1',
            color: '#ff8f00',
            fontWeight: 600,
          }}
        />
      ),
    }
  ] : [];

  // Combine all column types based on role
  return [
    ...baseColumns, 
    ...(roleSpecificColumns[role] || []), 
    ...metricsColumns,
    ...teamLeadExtras
  ];
};
