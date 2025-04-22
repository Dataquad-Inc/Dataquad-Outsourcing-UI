import React, { useState, useEffect } from "react";
import DataTable from "../muiComponents/DataTabel";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  Paper,
  AppBar,
  Toolbar,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from "@mui/material";
import { Refresh, Delete, Edit, PersonAdd, Close } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchEmployees,
  updateEmployee,
  deleteEmployee,
  resetUpdateStatus,
  resetDeleteStatus,
} from "../../redux/employeesSlice";
import { showToast } from "../../utils/ToastNotification";
import ToastNotification from "../../utils/ToastNotification";
import ComponentTitle from "../../utils/ComponentTitle";
import UserForm from "./UserForm";
import httpService from "../../Services/httpService";
import Registration from "../LogIn/Registration";
import DateRangeFilter from "../muiComponents/DateRangeFilter";

// Expanded content component for row details
const ExpandedUserContent = ({ row }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ color: "#757575", mb: 0.5 }}>
            Personal Information
          </Typography>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1">{formatDate(row.dob)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1">{row.gender || "-"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1">
                  {row.phoneNumber || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Personal Email
                </Typography>
                <Typography variant="body1">
                  {row.personalemail || "-"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ color: "#757575", mb: 0.5 }}>
            Employment Details
          </Typography>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Employee ID
                </Typography>
                <Typography variant="body1">{row.employeeId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Joining Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(row.joiningDate)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Designation
                </Typography>
                <Typography variant="body1">
                  {row.designation || "Software Engineer"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1">
                  {Array.isArray(row.roles) ? row.roles.join(", ") : row.roles}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [columns, setColumns] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openEditDrawer, setOpenEditDrawer] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [openAddDrawer, setOpenAddDrawer] = useState(false);

  const { isFilteredDataRequested } = useSelector((state) => state.bench);
    const {filteredUsers} = useSelector((state) => state.employee);

  const dispatch = useDispatch();
  const {
    employeesList,
    fetchStatus,
    fetchError,
    updateStatus,
    updateError,
    deleteStatus,
    deleteError,
  } = useSelector((state) => state.employee);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [refreshTrigger, dispatch]);

  useEffect(() => {
    if (employeesList) {
      const processedData = employeesList.map((user) => ({
        ...user,
        expandContent: <ExpandedUserContent row={user} />,
      }));
      setUsers(processedData);
      setColumns(generateColumns(employeesList));
    }
  }, [employeesList]);

  useEffect(() => {
    if (updateStatus === "succeeded") {
      showToast("User updated successfully!", "success");
      setOpenEditDrawer(false);
      dispatch(resetUpdateStatus());
      setRefreshTrigger((prev) => prev + 1);
    } else if (updateStatus === "failed") {
      showToast(updateError || "Failed to update user", "error");
    }
  }, [updateStatus, updateError, dispatch]);

  useEffect(() => {
    if (deleteStatus === "succeeded") {
      showToast("User deleted successfully!", "success");
      setOpenDeleteDialog(false);
      dispatch(resetDeleteStatus());
      setRefreshTrigger((prev) => prev + 1);
    } else if (deleteStatus === "failed") {
      showToast(deleteError || "Failed to delete user", "error");
    }
  }, [deleteStatus, deleteError, dispatch]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
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

  const handleEditUser = (user) => {
    // Fixed date formatting for the form inputs
    // Ensures dates are in YYYY-MM-DD format which is required by the date input
    const formattedUser = {
      ...user,
      // For string roles, keep as is; otherwise handle array
      roles: Array.isArray(user.roles) ? user.roles[0] : user.roles,
      // Properly format dates for the form inputs without time component
      dob: user.dob ? user.dob.split("T")[0] : "",
      joiningDate: user.joiningDate ? user.joiningDate.split("T")[0] : "",
    };

    setCurrentUser(formattedUser);
    setOpenEditDrawer(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      dispatch(deleteEmployee(userToDelete.employeeId));
    }
  };

  const handleSubmitEdit = (values, actions) => {
    dispatch(
      updateEmployee({
        employeeId: currentUser.employeeId,
        ...values,
      })
    ).finally(() => {
      actions.setSubmitting(false);
    });
  };

  const handleAddUser = () => {
    setOpenAddDrawer(true);
  };

  const handleSubmitNewUser = async (values, actions) => {
    try {
      // Call your API service to register a new user
      const response = await httpService.post("/auth/register", values);

      if (response.data.success) {
        showToast("Employee registered successfully!", "success");
        setOpenAddDrawer(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast(response.data.message || "Registration failed", "error");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to register employee",
        "error"
      );
    } finally {
      actions.setSubmitting(false);
    }
  };

  const buttonStyles = {
    minWidth: "130px",
    height: "40px",
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const generateColumns = (data) => {
    if (!data || data.length === 0) return [];

    return [
      {
        key: "employeeId",
        label: "Employee ID",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "userName",
        label: "User Name",
        type: "text",
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        key: "roles",
        label: "Roles",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) =>
          Array.isArray(row.roles) ? row.roles.join(", ") : row.roles,
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        sortable: true,
        filterable: true,
        width: 200,
      },
      {
        key: "designation",
        label: "Designation",
        type: "text",
        sortable: true,
        filterable: true,
        width: 150,
        render: (row) => row.designation,
      },
      {
        key: "joiningDate",
        label: "Joining Date",
        type: "date",
        sortable: true,
        filterable: true,
        width: 130,
        render: (row) =>
          row.joiningDate
            ? new Date(row.joiningDate).toLocaleDateString()
            : "-",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        sortable: true,
        filterable: true,
        render: (row) => renderStatus(row.status),
        width: 100,
        options: ["ACTIVE", "INACTIVE"],
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        width: 150,
        align: "center",
        render: (row) => (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            <Tooltip title="Edit User">
              <IconButton
                aria-label="edit"
                size="small"
                color="primary"
                sx={{
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.16)" },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUser(row);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete User">
              <IconButton
                aria-label="delete"
                size="small"
                color="error"
                sx={{
                  backgroundColor: "rgba(211, 47, 47, 0.08)",
                  "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.16)" },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(row);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ];
  };

  if (fetchStatus === "loading" && !users.length) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">Error loading users: {fetchError}</Typography>
        <Button
          variant="contained"
          onClick={refreshData}
          startIcon={<Refresh />}
          sx={{ ...buttonStyles, mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const drawerStyles = {
    "& .MuiDrawer-paper": {
      width: { xs: "100%", sm: "70%", md: "50%" },
      maxWidth: 600,
      boxSizing: "border-box",
      padding: 0,
    },
  };

  return (
    <>
     

      <Stack direction="row" alignItems="center" spacing={2}
              sx={{
                flexWrap: 'wrap',
                mb: 3,
                justifyContent: 'space-between',
                p: 2,
                backgroundColor: '#f9f9f9',
                borderRadius: 2,
                boxShadow: 1,
      
              }}>
      
              <Typography variant='h6' color='primary'>Users Management</Typography>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 'auto' }}>
              <DateRangeFilter component="Users"/>
      
              
              <Button variant="contained" color="primary" onClick={handleAddUser}>
          Add User
        </Button>
        </Stack>
            </Stack>

      <DataTable
      
        data={isFilteredDataRequested ?  filteredUsers : users || []}
        columns={columns}
        title=""
        loading={fetchStatus === "loading"}
        enableSelection={false}
        defaultSortColumn="userName"
        defaultSortDirection="asc"
        defaultRowsPerPage={10}
        refreshData={refreshData}
        primaryColor="#1976d2"
        secondaryColor="#e0f2f1"
        customStyles={{
          headerBackground: "#1976d2",
          rowHover: "#e0f2f1",
          selectedRow: "#b2dfdb",
        }}
        uniqueId="employeeId" // Specify that employeeId should be used as the unique identifier
      />

      {/* Edit User Drawer with UserForm component */}
      <Drawer
        anchor="right"
        open={openEditDrawer}
        onClose={() => setOpenEditDrawer(false)}
        sx={drawerStyles}
      >
        <AppBar position="static" sx={{ backgroundColor: "#00796b" }}>
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Edit fontSize="small" />
              Edit User Details
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setOpenEditDrawer(false)}
              aria-label="close"
            >
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3, overflowY: "auto" }}>
          {currentUser && (
            <UserForm
              initialValues={currentUser}
              onSubmit={handleSubmitEdit}
              isEditMode={true}
              loading={updateStatus === "loading"}
            />
          )}
        </Box>
      </Drawer>

      {/* Add User Drawer with UserForm component */}
      <Drawer
        anchor="right"
        open={openAddDrawer}
        onClose={() => setOpenAddDrawer(false)}
        sx={drawerStyles}
      >
        <AppBar position="static" sx={{ backgroundColor: "#00796b" }}>
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PersonAdd fontSize="small" />
              Register New Employee
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setOpenAddDrawer(false)}
              aria-label="close"
            >
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3, overflowY: "auto" }}>
          {/* <UserForm onSubmit={handleSubmitNewUser} isEditMode={false} /> */}
          <Registration />
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{ backgroundColor: "#f44336", color: "white", fontWeight: 600 }}
        >
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3, minWidth: 400 }}>
          <Typography>
            Are you sure you want to delete user{" "}
            <strong>{userToDelete?.userName}</strong>?
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              ...buttonStyles,
              color: "#757575",
              borderColor: "#bdbdbd",
              "&:hover": { borderColor: "#757575", backgroundColor: "#f5f5f5" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteStatus === "loading"}
            startIcon={
              deleteStatus === "loading" ? (
                <CircularProgress size={20} />
              ) : (
                <Delete />
              )
            }
            sx={{
              ...buttonStyles,
              ml: 2,
              backgroundColor: "#f44336",
              "&:hover": { backgroundColor: "#d32f2f" },
            }}
          >
            {deleteStatus === "loading" ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </Dialog>

      <ToastNotification />
    </>
  );
};

export default UsersList;
