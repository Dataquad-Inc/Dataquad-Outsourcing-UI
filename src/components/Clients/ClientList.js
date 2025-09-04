import React, { useState, useEffect, useCallback, useMemo } from "react";
import DataTable from "../muiComponents/DataTabel";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Drawer,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Refresh,
  CloudDownload,
  Close,
  Edit,
  Delete,
  Feedback,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllClients,
  downloadClientDocs,
  updateClient,
  deleteClient,
  createClient,
  resetStatus,
} from "../../redux/clientsSlice";
import { showToast } from "../../utils/ToastNotification";
import ToastNotification from "../../utils/ToastNotification";
import ComponentTitle from "../../utils/ComponentTitle";
import OnBoardClient from "./OnBoardClient";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { id } from "date-fns/locale";
import InternalFeedbackCell from "../Interviews/FeedBack";

const ClientList = () => {
  const dispatch = useDispatch();
  const {
    list: clients,
    loading,
    error,
    downloadStatus,
    updateStatus,
    deleteStatus,
    createStatus,
  } = useSelector((state) => state.clients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDocsDialog, setOpenDocsDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [levelFilter, setLevelFilter] = useState("ALL");

  useEffect(() => {
    dispatch(fetchAllClients());
  }, [dispatch]);

  useEffect(() => {
    if (downloadStatus === "succeeded") {
      dispatch(resetStatus());
    } else if (downloadStatus === "failed" && error) {
      dispatch(resetStatus());
    }
  }, [downloadStatus, error, dispatch]);

  useEffect(() => {
    if (
      updateStatus === "succeeded" ||
      createStatus === "succeeded" ||
      deleteStatus === "succeeded"
    ) {
      dispatch(resetStatus());
      setDrawerOpen(false);
      setCurrentClient(null);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } else if (
      updateStatus === "failed" ||
      createStatus === "failed" ||
      (deleteStatus === "failed" && error)
    ) {
      dispatch(resetStatus());
    }
  }, [updateStatus, createStatus, deleteStatus, error, dispatch]);

  const handleDownloadDocs = (clientId) => {
    dispatch(downloadClientDocs(clientId))
      .unwrap()
      .then((result) => {
        const blob = new Blob([result.data], { type: "application/zip" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `client_documents_${clientId}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((rejectedValue) => {
        // Error is handled in the slice
      });
  };

  const handleStatusFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleClientsByStatus = (clients) => {
    if (!clients) return [];
    if (levelFilter === "ALL") return clients;

    return clients.filter((client) => {
      if (levelFilter === "ACTIVE") return client.status === "ACTIVE";
      if (levelFilter === "INACTIVE") return client.status !== "ACTIVE";
      return false;
    });
  };

  const renderStatus = (status) => {
    let color = "default";
    const statusLower = status?.toLowerCase();

    switch (statusLower) {
      case "active":
        color = "success";
        break;
      case "inactive":
        color = "error";
        break;
      default:
        color = "default";
    }

    return <Chip label={status || "Unknown"} size="small" color={color} />;
  };

  const handleViewDocs = (client) => {
    setSelectedClient(client);
    setOpenDocsDialog(true);
  };

  const handleEditClick = (clientId) => {
    const clientToEdit = clients.find((client) => client.id === clientId);
    if (clientToEdit) {
      setCurrentClient(clientToEdit);
      setDrawerOpen(true);
    } else {
      showToast("Client not found", "error");
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setCurrentClient(null);
  };

  const handleClientSubmit = (formData, isEdit) => {
    if (isEdit && currentClient) {
      dispatch(
        updateClient({ clientId: currentClient.id, updatedData: formData })
      );
    } else {
      dispatch(createClient(formData));
    }
  };

  const handleDeleteClick = (clientId) => {
    const client = clients.find((client) => client.id === clientId);
    if (client) {
      setClientToDelete(client);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      dispatch(deleteClient(clientToDelete.id));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleDocsDialogClose = () => {
    setOpenDocsDialog(false);
    setSelectedClient(null);
  };

  const fetchClients = useCallback(() => {
    dispatch(fetchAllClients());
  }, [dispatch]);

  const generateColumns = useCallback(
    (data) => {
      if (!data || data.length === 0) return [];

      return [
        {
          key: "id",
          label: "Client ID",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="text" width={80} height={24} />
            ) : (
              row.id
            ),
        },
        {
          key: "clientName",
          label: "Client Name",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="text" width={120} height={24} />
            ) : (
              row.clientName || "N/A"
            ),
        },
        {
          key: "onBoardedBy",
          label: "BDM",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="text" width={100} height={24} />
            ) : (
              row.onBoardedBy || "N/A"
            ),
        },
        {
          key: "clientSpocName",
          label: "Contact Person",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="text" width={150} height={24} />
            ) : row.clientSpocName && Array.isArray(row.clientSpocName) ? (
              row.clientSpocName.filter(Boolean).join(", ") || "N/A"
            ) : (
              "N/A"
            ),
        },
        {
          key: "positionType",
          label: "Position Type",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="rectangular" width={100} height={32} />
            ) : (
              <Chip
                label={row.positionType || "Not specified"}
                color={row.positionType ? "primary" : "default"}
                variant="outlined"
                size="small"
              />
            ),
        },
        {
          key: "netPayment",
          label: "Net Payment",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="text" width={80} height={24} />
            ) : row.currency ? (
              `${row.currency} ${row.netPayment}`
            ) : (
              row.netPayment || "N/A"
            ),
        },
        {
          key: "supportingCustomers",
          label: "Supporting Customers",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="text" width={150} height={24} />
            ) : row.supportingCustomers &&
              Array.isArray(row.supportingCustomers) ? (
              <Tooltip
                title={row.supportingCustomers.filter(Boolean).join(", ")}
                arrow
              >
                <Typography variant="body2" noWrap>
                  {row.supportingCustomers.filter(Boolean).join(", ") || "None"}
                </Typography>
              </Tooltip>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
              >
                None
              </Typography>
            ),
        },
        {
          key: "status",
          label: "Status",
          align: "center",
          
          render: (row) =>
            loading ? (
              <Skeleton variant="rectangular" width={100} height={32} />
            ) : (
              renderStatus(row.status)
            ),
        },
        {
          key: "feedBack",
          label: "FeedBack",
          align: "center",
          render: (row) =>
            loading ? (
              <Skeleton variant="rectangular" width={100} height={32} />
            ) : (
              <InternalFeedbackCell value={row.feedBack} />
            ),
        },
        {
          key: "numberOfRequirements",
          label: "Requirements",
          align: "center",
          render: (row) => {
            if (loading) {
              return <Skeleton variant="rectangular" width={100} height={32} />;
            }

            return row.numberOfRequirements ? (
              <Chip
                label={row.numberOfRequirements}
                color="primary"
                variant="outlined"
                size="small"
              />
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
              >
                -
              </Typography>
            );
          },
        },
        {
          key: "actions",
          label: "Actions",
          render: (row) =>
            loading ? (
              <Box display="flex" gap={1}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            ) : (
              <Box display="flex" gap={1}>
                <Tooltip title="Edit Client">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEditClick(row.id)}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Documents">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleDownloadDocs(row.id)}
                  >
                    <CloudDownload />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Client">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(row.id)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
        },
      ];
    },
    [loading]
  );

  const columns = useMemo(
    () => generateColumns(clients),
    [clients, generateColumns]
  );

  return (
    <>
      <ToastNotification />

      {/* <ComponentTitle title="Client Management">
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchClients}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button 
          variant="contained"
          color="primary"
          onClick={() => setDrawerOpen(true)}
        >
          Add New Client
        </Button>
      </ComponentTitle> */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          mb: 3,
          justifyContent: "space-between",
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" color="primary">
          Clients Management
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ ml: "auto" }}
        >
          <DateRangeFilter component="Clients" />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setDrawerOpen(true)}
          >
            Add New Client
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: "flex", justifyContent: "start" }}>
        <ToggleButtonGroup
          value={levelFilter}
          exclusive
          onChange={handleStatusFilterChange}
          aria-label="client status filter"
          sx={{
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1,
            "& .MuiToggleButton-root": {
              px: 2,
              py: 1,
              borderRadius: 1,
              border: "1px solid rgba(25, 118, 210, 0.5)",
              "&.Mui-selected": {
                backgroundColor: "#1976d2",
                color: "white",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              },
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            },
          }}
        >
          {/* <ToggleButton value="ALL" aria-label="all clients" >
              ALL
            </ToggleButton>
          */}

          <ToggleButton value="ACTIVE" aria-label="active clients">
            ACTIVE
          </ToggleButton>

          <ToggleButton value="INACTIVE" aria-label="inactive clients">
            INACTIVE
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <DataTable
        data={handleClientsByStatus(clients)}
        columns={columns}
        title={
          levelFilter === "ALL"
            ? "Clients"
            : levelFilter === "ACTIVE"
            ? "Active"
            : "InActive"
        }
        loading={loading}
        enableSelection={false}
        defaultSortColumn="clientName"
        defaultSortDirection="asc"
        defaultRowsPerPage={10}
        refreshData={fetchClients}
        primaryColor="#1976d2"
        secondaryColor="#f5f5f5"
        uniqueId="id"
      />

      {/* Client Form Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: "80%", md: "60%" },
            maxWidth: "1000px",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">
            {currentClient ? "Edit Client" : "Add New Client"}
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ overflowY: "auto" }}>
          <OnBoardClient
            initialData={currentClient}
            onSubmit={handleClientSubmit}
            isEdit={!!currentClient}
            onCancel={handleDrawerClose}
            showToast={showToast}
          />
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {clientToDelete
              ? `Are you sure you want to delete the client "${clientToDelete.clientName}"? This action cannot be undone.`
              : "Are you sure you want to delete this client? This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteStatus === "loading"}
          >
            {deleteStatus === "loading" ? (
              <CircularProgress size={24} />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Documents Dialog */}
      <Dialog
        open={openDocsDialog}
        onClose={handleDocsDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedClient
            ? `Documents for ${selectedClient.clientName}`
            : "Client Documents"}
          <IconButton
            aria-label="close"
            onClick={handleDocsDialogClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedClient?.supportingDocuments &&
          selectedClient.supportingDocuments.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {selectedClient.supportingDocuments.map((doc, index) => (
                <Chip
                  key={index}
                  label={doc}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
              <Button
                startIcon={<CloudDownload />}
                variant="contained"
                onClick={() => handleDownloadDocs(selectedClient.id)}
                sx={{ mt: 2, alignSelf: "flex-start" }}
                disabled={downloadStatus === "loading"}
              >
                {downloadStatus === "loading" ? (
                  <CircularProgress size={24} />
                ) : (
                  "Download All Documents"
                )}
              </Button>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No documents available for this client.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientList;
