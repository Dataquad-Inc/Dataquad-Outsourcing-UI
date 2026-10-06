import React, { useState, useEffect } from 'react'
import CustomDataTable from '../../ui-lib/CustomDataTable'
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  Alert,
  Snackbar,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { Close, Download, Delete, Edit } from '@mui/icons-material'
import ClientForm from './OnBoardingClients'
import { useNavigate } from 'react-router-dom'
import httpService from '../../Services/httpService'
import DocumentViewDialog from './DocumentViewDialog'
import { toast, ToastContainer } from 'react-toastify'
import ToastService from '../../Services/toastService'
import axios from 'axios'

// ─── Invoice API endpoint ─────────────────────────────────────────────────────
const INVOICE_API_URL =
  'https://mymulya.com/api/us/requirements/usclient/invoice/yes'

// ─── Orange theme palette (aligned with table) ────────────────────────────────
const ORANGE = {
  main: '#ed6c02',       // primary orange
  dark: '#e65100',       // darker orange (hover/selected hover)
  light: 'rgba(237, 108, 2, 0.08)', // subtle bg on hover
  border: '#ed6c02',     // border color
  shadow: 'rgba(237, 108, 2, 0.35)',
  shadowHover: 'rgba(237, 108, 2, 0.2)',
}

const UsClients = () => {
  const navigate = useNavigate()

  // ─── Drawer / form state ────────────────────────────────────────────────────
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  // ─── Data state ─────────────────────────────────────────────────────────────
  const [clientsData, setClientsData] = useState([])
  const [invoiceClientsData, setInvoiceClientsData] = useState([])
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  // ─── Document viewer state ──────────────────────────────────────────────────
  const [viewDocumentOpen, setViewDocumentOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // ─── Table state ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)

  // ─── Tab state ──────────────────────────────────────────────────────────────
  const [selectedTab, setSelectedTab] = useState('ALL')

  // ─── Snackbar helpers ───────────────────────────────────────────────────────
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // ─── Fetch all clients ──────────────────────────────────────────────────────
  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await httpService.get(
        `/api/us/requirements/client/getAll`
      )

      console.log('API Response:', result)

      if (result.data.success && result.data.data) {
        const dataArray = Array.isArray(result.data.data)
          ? result.data.data
          : [result.data.data]
        setClientsData(dataArray)
      } else {
        setError(result.data.message || 'Failed to fetch clients')
        setClientsData([])
      }
    } catch (error) {
      console.error('API call failed:', error)
      setError(error.message)
      setClientsData([])
    } finally {
      setLoading(false)
    }
  }

  // ─── Fetch invoice vendors ──────────────────────────────────────────────────
  const fetchInvoiceClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await httpService.get(
        `/api/us/requirements/usclient/invoice/yes`
      )
      console.log('Invoice Clients API Response:', result)

      if (result.data.success && result.data.data) {
        const dataArray = Array.isArray(result.data.data)
          ? result.data.data
          : [result.data.data]
        setInvoiceClientsData(dataArray)
      } else {
        setError(result.data.message || 'Failed to fetch invoice clients')
        setInvoiceClientsData([])
      }
    } catch (error) {
      console.error('Invoice clients API call failed:', error)
      setError(error.message)
      setInvoiceClientsData([])
    } finally {
      setLoading(false)
    }
  }

  // ─── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchClients()
  }, [])

  // ─── Fetch invoice data when tab changes ────────────────────────────────────
  useEffect(() => {
    if (selectedTab === 'INVOICE VENDOR') {
      fetchInvoiceClients()
    }
  }, [selectedTab])

  // ─── Download all documents ─────────────────────────────────────────────────
  const handleDownloadAllDocuments = async (clientId, clientName) => {
    try {
      const cleanClientId = String(clientId).trim()
      const downloadUrl = `https://mymulya.com/api/us/requirements/ClientsDocuments/downloadAll/${cleanClientId}`

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `Client_${clientName}_Documents.zip`
      link.target = '_blank'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showSnackbar('Download started successfully!', 'success')
    } catch (error) {
      console.error('Error downloading documents:', error)
      try {
        const downloadUrl = `https://mymulya.com/api/us/requirements/ClientsDocuments/downloadAll/${clientId}`
        window.open(downloadUrl, '_blank')
        showSnackbar('Download opened in new tab!', 'info')
      } catch (fallbackError) {
        console.error('Fallback method failed:', fallbackError)
        showSnackbar('Error starting download', 'error')
      }
    }
  }

  // ─── View documents handler ─────────────────────────────────────────────────
  const handleViewDocuments = (client) => {
    setSelectedClient(client)

    let processedDocuments = []

    if (client.supportingDocuments && Array.isArray(client.supportingDocuments)) {
      processedDocuments = client.supportingDocuments
        .map((doc, index) => {
          if (typeof doc === 'string') {
            return { id: index, name: doc, type: getFileType(doc), size: 0 }
          } else if (typeof doc === 'object' && doc !== null) {
            return {
              id: doc.id || index,
              name: doc.fileName || doc.name || 'Unknown Document',
              filePath: doc.filePath,
              contentType: doc.contentType,
              size: doc.size || 0,
              uploadedAt: doc.uploadedAt,
              type: getFileType(doc.fileName || doc.name),
            }
          }
          return null
        })
        .filter(Boolean)
    }

    setSelectedClient({ ...client, processedDocuments })
    setViewDocumentOpen(true)
  }

  // ─── Helper: determine file type ────────────────────────────────────────────
  const getFileType = (fileName) => {
    if (!fileName) return 'other'
    const extension = fileName.split('.').pop().toLowerCase()
    if (['pdf'].includes(extension)) return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension))
      return 'image'
    if (['doc', 'docx'].includes(extension)) return 'word'
    if (['xls', 'xlsx'].includes(extension)) return 'excel'
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint'
    if (['txt', 'csv'].includes(extension)) return 'text'
    return 'other'
  }

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      id: 'clientName',
      label: 'Client Name',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value) => value || 'N/A',
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
        { value: 'Internship', label: 'Internship' },
      ],
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      id: 'netPayment',
      label: 'Net Payment',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value) => (value ? `${value} Days` : '0 Days'),
    },
    {
      id: 'clientWebsiteUrl',
      label: 'Website',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value) =>
        value && value.startsWith('http') ? (
          <Typography component="span">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ORANGE.main, textDecoration: 'none' }}
            >
              Visit Website
            </a>
          </Typography>
        ) : (
          <Typography component="span" sx={{ color: '#999' }}>
            Not provided
          </Typography>
        ),
    },
    {
      id: 'clientLinkedInUrl',
      label: 'LinkedIn',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value) =>
        value && value.startsWith('http') ? (
          <Typography component="span">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ORANGE.main, textDecoration: 'none' }}
            >
              LinkedIn
            </a>
          </Typography>
        ) : (
          <Typography component="span" sx={{ color: '#999' }}>
            Not provided
          </Typography>
        ),
    },
    {
      id: 'onBoardedByName',
      label: 'Onboarded By',
      applyFilter: true,
      filterType: 'text',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      id: 'status',
      label: 'Status',
      applyFilter: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'PENDING', label: 'Pending' },
      ],
      sortable: true,
      render: (value) => {
        const statusValue = value || 'PENDING'
        return (
          <Typography
            component="span"
            sx={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor:
                statusValue === 'ACTIVE'
                  ? '#e8f5e8'
                  : statusValue === 'INACTIVE'
                  ? '#ffe8e8'
                  : '#fff3cd',
              color:
                statusValue === 'ACTIVE'
                  ? '#2e7d32'
                  : statusValue === 'INACTIVE'
                  ? '#d32f2f'
                  : '#856404',
            }}
          >
            {statusValue}
          </Typography>
        )
      },
    },
    {
      id: 'supportingCustomers',
      label: 'Supporting Customers',
      applyFilter: false,
      sortable: false,
      render: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'No customers'
        }
        return (
          <Box sx={{ width: 170 }}>
            {value.map((customer, index) => {
              let netPaymentValue = '0'
              if (customer.netPayment !== null && customer.netPayment !== undefined) {
                if (typeof customer.netPayment === 'object') {
                  netPaymentValue =
                    customer.netPayment.value ||
                    customer.netPayment.amount ||
                    '0'
                } else {
                  netPaymentValue = customer.netPayment
                }
              }
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  <Typography variant="body2" component="span">
                    {customer.customerName || 'Unnamed Customer'}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ color: '#666', marginLeft: '8px' }}
                  >
                    {String(netPaymentValue).toLocaleString()} Days
                  </Typography>
                </Box>
              )
            })}
          </Box>
        )
      },
    },
    {
      id: 'supportingDocuments',
      label: 'Supporting Documents',
      applyFilter: false,
      sortable: false,
      render: (value, row) => {
        let documentNames = []
        if (value && Array.isArray(value)) {
          documentNames = value
            .map((doc) => {
              if (typeof doc === 'string') return doc
              if (typeof doc === 'object' && doc !== null)
                return doc.fileName || doc.name || 'Unknown Document'
              return 'Invalid Document'
            })
            .filter((name) => name !== 'Invalid Document')
        }

        if (documentNames.length === 0) return 'No documents'

        return (
          <Box>
            {documentNames.slice(0, 2).map((documentName, index) => (
              <Typography
                key={index}
                variant="body2"
                component="div"
                sx={{
                  display: 'block',
                  mb: 0.5,
                  fontSize: '0.75rem',
                  color: '#666',
                }}
              >
                {documentName.length > 30
                  ? documentName.substring(0, 30) + '...'
                  : documentName}
              </Typography>
            ))}
            {documentNames.length > 2 && (
              <Typography variant="caption" color="primary" component="span">
                +{documentNames.length - 2} more
              </Typography>
            )}
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="caption"
                color="primary"
                component="span"
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': { color: ORANGE.dark },
                }}
                onClick={() => handleViewDocuments(row)}
              >
                View All Documents
              </Typography>
            </Box>
          </Box>
        )
      },
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
          <Tooltip title="Download Documents">
            <IconButton
              size="small"
              color="secondary"
              onClick={() =>
                handleDownloadAllDocuments(row.clientId, row.clientName)
              }
            >
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Client">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(row.clientId, row.clientName)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  // ─── Create / Edit / Delete ─────────────────────────────────────────────────
  const handleCreateClient = () => {
    navigate('/dashboard/us-clients/create')
  }

  const handleEditClient = (client) => {
    const formattedClient = {
      ...client,
      clientSpocName: Array.isArray(client.clientSpocName)
        ? client.clientSpocName
        : [client.clientSpocName || ''],
      clientSpocEmailid: Array.isArray(client.clientSpocEmailid)
        ? client.clientSpocEmailid
        : [client.clientSpocEmailid || ''],
      clientSpocMobileNumber: Array.isArray(client.clientSpocMobileNumber)
        ? client.clientSpocMobileNumber
        : [client.clientSpocMobileNumber || ''],
      clientSpocLinkedin: Array.isArray(client.clientSpocLinkedin)
        ? client.clientSpocLinkedin
        : [client.clientSpocLinkedin || ''],
      supportingCustomers: Array.isArray(client.supportingCustomers)
        ? client.supportingCustomers.map((customer) =>
            typeof customer === 'string'
              ? { customerName: customer, netPayment: '' }
              : customer
          )
        : [],
    }
    setEditingClient(formattedClient)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setEditingClient(null)
  }

  const handleFormSubmit = async (formData, isEdit, result) => {
    try {
      handleCloseDrawer()
      await fetchClients()
      if (selectedTab === 'INVOICE VENDOR') {
        await fetchInvoiceClients()
      }
      ToastService.success(
        `Client ${isEdit ? 'updated' : 'created'} successfully!`
      )
      showSnackbar(
        `Client ${isEdit ? 'updated' : 'created'} successfully!`,
        'success'
      )
    } catch (error) {
      console.error('Form submission error:', error)
      ToastService.error(
        `Failed to ${isEdit ? 'update' : 'create'} client: ${error.message}`
      )
      showSnackbar(`Failed to ${isEdit ? 'update' : 'create'} client`, 'error')
    }
  }

  const handleDeleteClick = async (clientId, clientName) => {
    const idToDelete = clientId
    if (!idToDelete) {
      ToastService.error('Cannot delete: Client ID is missing')
      showSnackbar('Cannot delete: Client ID is missing', 'error')
      return
    }

    const displayName = clientName || 'this client'
    if (
      window.confirm(`Are you sure you want to delete client "${displayName}"?`)
    ) {
      try {
        const response = await httpService.delete(
          `/api/us/requirements/client/delete/${idToDelete}`
        )
        if (response.data && response.data.success) {
          ToastService.success('Client deleted successfully')
          showSnackbar('Client deleted successfully', 'success')
          await fetchClients()
          if (selectedTab === 'INVOICE VENDOR') {
            await fetchInvoiceClients()
          }
        } else {
          const errorMsg = response.data?.message || 'Unknown error'
          ToastService.error(`Failed to delete client: ${errorMsg}`)
          showSnackbar(`Failed to delete client: ${errorMsg}`, 'error')
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message
        ToastService.error(`Error deleting client: ${errorMsg}`)
        showSnackbar(`Error deleting client: ${errorMsg}`, 'error')
      }
    }
  }

  // ─── Table handlers ─────────────────────────────────────────────────────────
  const handlePageChange = (event, newPage) => setPage(newPage)
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }
  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(0)
  }
  const handleSearchClear = () => setSearch('')
  const handleRefresh = () => {
    if (selectedTab === 'INVOICE VENDOR') fetchInvoiceClients()
    else fetchClients()
  }
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  // ─── Tab change handler ─────────────────────────────────────────────────────
  const handleTabChange = (event, newTab) => {
    if (newTab !== null) {
      setSelectedTab(newTab)
      setPage(0)
      setSearch('')
      setFilters({})
    }
  }

  // ─── Base dataset based on selected tab ─────────────────────────────────────
  const getBaseData = () => {
    switch (selectedTab) {
      case 'ACTIVE':
        return clientsData.filter((client) => client.status === 'ACTIVE')
      case 'INACTIVE':
        return clientsData.filter((client) => client.status === 'INACTIVE')
      case 'INVOICE VENDOR':
        return invoiceClientsData
      case 'ALL':
      default:
        return clientsData
    }
  }

  // ─── Filtered + searched data ───────────────────────────────────────────────
  const filteredData = getBaseData().filter((row) => {
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        (row.clientName?.toLowerCase() || '').includes(searchLower) ||
        (row.assignedTo?.toLowerCase() || '').includes(searchLower) ||
        (row.positionType?.toLowerCase() || '').includes(searchLower) ||
        (row.onBoardedBy?.toLowerCase() || '').includes(searchLower) ||
        (row.status?.toLowerCase() || '').includes(searchLower) ||
        (row.clientWebsiteUrl &&
          row.clientWebsiteUrl.toLowerCase().includes(searchLower)) ||
        (row.clientLinkedInUrl &&
          row.clientLinkedInUrl.toLowerCase().includes(searchLower))
      if (!matchesSearch) return false
    }

    for (const [columnId, filter] of Object.entries(filters)) {
      const column = columns.find((col) => col.id === columnId)
      if (!column || !filter.value) continue
      const cellValue = row[columnId]?.toString().toLowerCase() || ''
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

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ─── Toggle Button Group (Orange theme) ─── */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'flex-start',
          p: 1,
          borderRadius: 2,
          overflowX: 'auto',
        }}
      >
        <ToggleButtonGroup
          value={selectedTab}
          exclusive
          onChange={handleTabChange}
          aria-label="client status tabs"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            '& .MuiToggleButtonGroup-grouped': {
              margin: '0 !important',
              border: `1px solid ${ORANGE.border} !important`,
              borderRadius: '8px !important',
              px: 2.5,
              py: 1,
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: 0.5,
              color: ORANGE.main,
              backgroundColor: '#ffffff',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease-in-out',
              '&:not(:first-of-type)': {
                borderLeft: `1px solid ${ORANGE.border} !important`,
                marginLeft: '0 !important',
              },
              '&:hover': {
                backgroundColor: ORANGE.light,
                transform: 'translateY(-1px)',
                boxShadow: `0 3px 8px ${ORANGE.shadowHover}`,
              },
              '&.Mui-selected': {
                backgroundColor: ORANGE.main,
                color: '#ffffff',
                borderColor: `${ORANGE.main} !important`,
                boxShadow: `0 4px 10px ${ORANGE.shadow}`,
                '&:hover': {
                  backgroundColor: ORANGE.dark,
                },
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            },
          }}
        >
          <ToggleButton value="ALL" aria-label="all clients">
            ALL
          </ToggleButton>
          {/* <ToggleButton value="ACTIVE" aria-label="active clients">
            ACTIVE
          </ToggleButton>
          <ToggleButton value="INACTIVE" aria-label="inactive clients">
            INACTIVE
          </ToggleButton> */}
          <ToggleButton value="INVOICE VENDOR" aria-label="invoice vendors">
            INVOICE VENDOR
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ─── Data Table ─── */}
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

      {/* ─── Edit Client Drawer ─── */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', md: '80%', lg: '70%' } },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5">Edit Client</Typography>
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

      {/* ─── Document Viewer ─── */}
      <DocumentViewDialog
        open={viewDocumentOpen}
        onClose={() => setViewDocumentOpen(false)}
        client={selectedClient}
        documents={selectedClient?.processedDocuments || []}
      />

      {/* ─── Snackbar ─── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default UsClients