import React, { useState, useEffect } from 'react'
import CustomDataTable from '../../ui-lib/CustomDataTable'
import { 
  Drawer, 
  IconButton, 
  Typography, 
  Box,
  Skeleton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material'
import { Close, CloudDownload, Delete, Download, Edit } from '@mui/icons-material'
import ClientForm from './OnBoardingClients'
import { useNavigate } from 'react-router-dom'
import httpService from '../../Services/httpService'

const UsClients = () => {
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [clientsData, setClientsData] = useState([])
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // State for table
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Fetch clients data
  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await httpService.get(`/api/us/requirements/client/getAll`);

      console.log('API Response:', result);
      
      if (result.data.success && result.data.data) {
        const dataArray = Array.isArray(result.data.data) ? result.data.data : [result.data.data];
        setClientsData(dataArray);
      } else {
        setError(result.data.message || 'Failed to fetch clients');
        setClientsData([]);
      }
    } catch (error) {
      console.error("API call failed:", error);
      setError(error.message);
      setClientsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Download all documents for a client
  const handleDownloadAllDocuments = async (clientId, clientName) => {
    try {
      const response = await httpService.get(`/api/us/requirements/ClientsDocuments/downloadAll/${clientId}`, {
        responseType: 'blob'
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documents-${clientName}-${clientId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar('Documents downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading documents:', error);
      showSnackbar('Error downloading documents', 'error');
    }
  }

  const columns = [
    {
      id: 'clientName',
      label: 'Client Name',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value, row) => value || 'N/A'
    },
    {
      id: 'positionType',
      label: 'Position Type',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'Full-Time', label: 'Full-Time' },
        { value: 'Part-Time', label: 'Part-Time' },
        { value: 'Contract', label: 'Contract' },
        { value: 'Internship', label: 'Internship' }
      ],
      sortable: true,
      render: (value, row) => value || 'N/A'
    },
    {
      id: 'netPayment',
      label: 'Net Payment',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value, row) => value ? `${value} Days` : '0 Days'
    },
    {
      id: 'clientWebsiteUrl',
      label: 'Website',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value, row) => (
        value && value.startsWith('http') ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            Visit Website
          </a>
        ) : (
          <span style={{ color: '#999' }}>Not provided</span>
        )
      )
    },
    {
      id: 'clientLinkedInUrl',
      label: 'LinkedIn',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value, row) => (
        value && value.startsWith('http') ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            LinkedIn
          </a>
        ) : (
          <span style={{ color: '#999' }}>Not provided</span>
        )
      )
    },
    {
      id: 'onBoardedBy',
      label: 'Onboarded By',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value, row) => value || 'N/A'
    },
    {
      id: 'status',
      label: 'Status',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'PENDING', label: 'Pending' }
      ],
      sortable: true,
      render: (value) => {
        const statusValue = value || 'PENDING';
        return (
          <Box
            sx={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: 
                statusValue === 'ACTIVE' ? '#e8f5e8' :
                statusValue === 'INACTIVE' ? '#ffe8e8' :
                '#fff3cd',
              color: 
                statusValue === 'ACTIVE' ? '#2e7d32' :
                statusValue === 'INACTIVE' ? '#d32f2f' :
                '#856404',
            }}
          >
            {statusValue}
          </Box>
        )
      }
    },
    {
      id: 'numberOfRequirements',
      label: 'Requirements',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value) => (value || 0)
    },
    {
      id: 'supportingCustomers',
      label: 'Supporting Customers',
      applyFilter: false,
      sortable: false,
      render: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'No customers';
        }
        
        return (
          <Box>
            {value.map((customer, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                  fontSize: '0.875rem',
                  width:170
                }}
              >
                <span>{customer.customerName || 'Unnamed Customer'}</span>
                <span style={{ color: '#666', marginLeft: '8px' }}>
                  {customer.netPayment?.toLocaleString() || '0'} Days
                </span>
              </Box>
            ))}
          </Box>
        );
      }
    },
    {
      id: 'supportingDocuments',
      label: 'Supporting Documents',
      applyFilter: false,
      sortable: false,
      render: (value, row) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'No documents';
        }
        
        return (
          <Box>
            {value.slice(0, 2).map((document, index) => (
              <Box 
                key={index}
                sx={{
                  display: 'block',
                  mb: 0.5,
                  fontSize: '0.75rem',
                  color: '#666',
                }}
              >
                {document.length > 30 ? document.substring(0, 30) + '...' : document}
              </Box>
            ))}
            {value.length > 2 && (
              <Typography variant="caption" color="primary">
                +{value.length - 2} more
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      applyFilter: false,
      sortable: false,
      render: (value, row) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Edit Client">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEditClient(row)}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download All Documents">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleDownloadAllDocuments(row.id, row.clientName)}
            >
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Client">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(row.id, row.clientName)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }
  ]

  const handleCreateClient = () => {
    navigate('/dashboard/us-clients/create')
  }

  const handleEditClient = (client) => {
    console.log('Editing client:', client);
    // Ensure the client data is properly structured for the form
    const formattedClient = {
      ...client,
      // Ensure arrays are properly formatted
      clientSpocName: Array.isArray(client.clientSpocName) ? client.clientSpocName : [client.clientSpocName || ""],
      clientSpocEmailid: Array.isArray(client.clientSpocEmailid) ? client.clientSpocEmailid : [client.clientSpocEmailid || ""],
      clientSpocMobileNumber: Array.isArray(client.clientSpocMobileNumber) ? client.clientSpocMobileNumber : [client.clientSpocMobileNumber || ""],
      clientSpocLinkedin: Array.isArray(client.clientSpocLinkedin) ? client.clientSpocLinkedin : [client.clientSpocLinkedin || ""],
      // Ensure supportingCustomers is properly formatted
      supportingCustomers: Array.isArray(client.supportingCustomers) 
        ? client.supportingCustomers.map(customer => 
            typeof customer === 'string' 
              ? { customerName: customer, netPayment: "" }
              : customer
          )
        : [],
    };
    
    setEditingClient(formattedClient);
    setIsDrawerOpen(true);
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setEditingClient(null)
  }

  const handleFormSubmit = async (formData, isEdit, result) => {
    try {
      console.log('Form submitted successfully:', result);
      handleCloseDrawer();
      // Refresh the data after form submission
      await fetchClients();
      showSnackbar(`Client ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
    } catch (error) {
      console.error('Form submission error:', error);
      showSnackbar(`Failed to ${isEdit ? 'update' : 'create'} client`, 'error');
    }
  }

  const handleDeleteClick = async (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      try {
        const response = await httpService.delete(`/api/us/requirements/client/delete/${clientId}`);

        if (response.data && response.data.success) {
          showSnackbar('Client deleted successfully', 'success');
          await fetchClients();
        } else {
          showSnackbar('Failed to delete client: ' + (response.data?.message || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error("Delete client failed:", error);
        showSnackbar('Error deleting client: ' + error.message, 'error');
      }
    }
  }

  // Table event handlers
  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(0)
  }

  const handleSearchClear = () => {
    setSearch('')
  }

  const handleRefresh = () => {
    fetchClients();
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  // Filter and search data
  const filteredData = clientsData.filter(row => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        (row.clientName?.toLowerCase() || '').includes(searchLower) ||
        (row.assignedTo?.toLowerCase() || '').includes(searchLower) ||
        (row.positionType?.toLowerCase() || '').includes(searchLower) ||
        (row.onBoardedBy?.toLowerCase() || '').includes(searchLower) ||
        (row.status?.toLowerCase() || '').includes(searchLower) ||
        (row.clientWebsiteUrl && row.clientWebsiteUrl.toLowerCase().includes(searchLower)) ||
        (row.clientLinkedInUrl && row.clientLinkedInUrl.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }

    // Column filters
    for (const [columnId, filter] of Object.entries(filters)) {
      const column = columns.find(col => col.id === columnId)
      if (!column || !filter.value) continue

      const cellValue = (row[columnId]?.toString().toLowerCase() || '')
      const filterValue = filter.value.toString().toLowerCase()

      switch (filter.type) {
        case 'text':
          if (!cellValue.includes(filterValue)) return false
          break
        case 'select':
          if (cellValue !== filterValue) return false
          break
        default:
          if (!cellValue.includes(filterValue)) return false
      }
    }

    return true
  })

  // Paginate data
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <CustomDataTable
        title="US Clients"
        columns={columns}
        rows={paginatedData}
        total={filteredData.length}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={loading}
        filters={filters}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onRefresh={handleRefresh}
        onFiltersChange={handleFiltersChange}
        onCreate={handleCreateClient}
        createButtonText="Create Client"
      />

      {/* Edit Client Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', md: '80%', lg: '70%' } }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            Edit Client
          </Typography>
          <IconButton onClick={handleCloseDrawer}>
            <Close />
          </IconButton>
        </Box>
        
        <ClientForm
          initialData={editingClient}
          onSubmit={handleFormSubmit}
          isEdit={true}
          onCancel={handleCloseDrawer}
        />
      </Drawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </>
  )
}

export default UsClients