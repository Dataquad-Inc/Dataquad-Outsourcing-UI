import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Grid,
  Box,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Divider,
  TextField,
  useTheme,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const IndTeamList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    member: null,
    team: null,
    type: "",
  });

  useEffect(() => {
    axios
      .get("https://mymulya.com/users/AllAssociatedUsers?entity=IN")
      .then((res) => {
        setTeams(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Debounced search handler
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setSearchLoading(true);
      const timer = setTimeout(() => {
        setSearchLoading(false);
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    } else {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleEditClick = (team) => {
    navigate(`/dashboard/ind-team/edit-team/${team.teamLeadId}`, {
      state: { teamData: team },
    });
  };

  const handleDeleteClick = (member, team, type) => {
    setDeleteDialog({ open: true, member, team, type });
  };

  const handleDeleteConfirm = async () => {
    const { member, team } = deleteDialog;

    try {
      const response = await fetch(
        `https://mymulya.com/users/team/${team.teamLeadId}/user/${
          member.employeeId || member.userId
        }`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setTeams((prevTeams) =>
          prevTeams
            .map((t) => {
              if (t.teamLeadId === team.teamLeadId) {
                return {
                  ...t,
                  employees: t.employees.filter(
                    (e) => e.userId !== member.userId
                  ),
                  coordinators: t.coordinators.filter(
                    (c) => c.userId !== member.userId
                  ),
                  bdms: t.bdms.filter((b) => b.userId !== member.userId),
                  teamLeads: t.teamLeads.filter((tl) => tl.userId !== member.userId),
                };
              }
              return t;
            })
            // filter out teams with no members left
            .filter(
              (t) =>
                (t.employees && t.employees.length > 0) ||
                (t.coordinators && t.coordinators.length > 0) ||
                (t.bdms && t.bdms.length > 0) ||
                (t.teamLeads && t.teamLeads.length > 0)
            )
        );

        setSnackbar({
          open: true,
          message: "Member deleted successfully",
          severity: "success",
        });
      } else {
        throw new Error("Failed to delete member");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete member",
        severity: "error",
      });
    }

    setDeleteDialog({ open: false, member: null, team: null, type: "" });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, member: null, team: null, type: "" });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event, value) => {
    setSearchQuery(value || "");
  };

  const handleTeamSelect = (event, value) => {
    if (value) {
      setSearchQuery(value.teamName);
    } else {
      setSearchQuery("");
    }
  };

  // Get unique team names for Autocomplete options
  const teamOptions = teams
    .filter(
      (team) =>
        (team.employees && team.employees.length > 0) ||
        (team.coordinators && team.coordinators.length > 0) ||
        (team.bdms && team.bdms.length > 0) ||
        (team.teamLeads && team.teamLeads.length > 0)
    )
    .map((team) => ({
      id: team.teamLeadId,
      teamName: team.teamName || 'Unnamed Team',
      teamLeadName: team.teamLeadName,
      superAdminName: team.superAdminName,
    }))
    .filter(team => team.teamName);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Filter teams based on search query - FIXED VERSION
  const filteredTeams = teams
    .filter(
      (team) =>
        (team.employees && team.employees.length > 0) ||
        (team.coordinators && team.coordinators.length > 0) ||
        (team.bdms && team.bdms.length > 0) ||
        (team.teamLeads && team.teamLeads.length > 0)
    )
    .filter((team) => {
      // Handle null or undefined team names
      if (!team.teamName) return searchQuery === ""; // Show teams with no name only when not searching
      
      return team.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <Box
      sx={{
        padding: 2,
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Search Field */}
      <Box
        sx={{
          mb: 3,
          px: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          Team Management
        </Typography>
        <Box sx={{ position: "relative", width: "350px" }}>
          <Autocomplete
            freeSolo
            options={teamOptions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.teamName
            }
            value={searchQuery}
            onInputChange={handleSearchChange}
            onChange={handleTeamSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search or Select Team"
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {option.teamName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team Lead: {option.teamLeadName}
                    {option.superAdminName &&
                      ` • Super Admin: ${option.superAdminName}`}
                  </Typography>
                </Box>
              </li>
            )}
            groupBy={(option) => (option.teamName && option.teamName.charAt(0).toUpperCase()) || 'U'}
            loading={searchLoading}
          />
          {searchLoading && (
            <CircularProgress
              size={20}
              sx={{
                position: "absolute",
                right: 40,
                top: "50%",
                transform: "translateY(-50%)",
                color: theme.palette.primary.main,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Search Loading Indicator */}
      {searchLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <CircularProgress size={30} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Searching teams...
          </Typography>
        </Box>
      )}

      {filteredTeams.map((team) => (
        <Card
          key={team.teamLeadId}
          elevation={3}
          sx={{
            mb: 3,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: 3,
            },
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent>
            {/* Header Section with Edit Icon */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Team Name
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="primary.main"
                  >
                    {team.teamName || 'Unnamed Team'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Primary Team Lead
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {team.teamLeadName}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4} sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClick(team)}
                    sx={{
                      "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                        color: "white",
                      },
                    }}
                  >
                    Edit Team
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Members Section - Four Columns */}
            <Grid container spacing={3}>
              {/* Team Leads Column */}
              {team.teamLeads && team.teamLeads.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 1,
                      p: 2,
                      height: "100%",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Team Leads
                      </Typography>
                      <Chip
                        label={team.teamLeads.length}
                        size="small"
                        color="warning"
                      />
                    </Box>
                    <List dense sx={{ pt: 0 }}>
                      {team.teamLeads.map((teamLead) => (
                        <ListItem
                          key={teamLead.userId}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            "&:last-child": { borderBottom: "none" },
                            px: 0,
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2">
                            {teamLead.userName}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDeleteClick(teamLead, team, "teamLead")
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              )}

              {/* Employees Column */}
              {team.employees && team.employees.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 1,
                      p: 2,
                      height: "100%",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Employees
                      </Typography>
                      <Chip
                        label={team.employees.length}
                        size="small"
                        color="primary"
                      />
                    </Box>
                    <List dense sx={{ pt: 0 }}>
                      {team.employees.map((emp) => (
                        <ListItem
                          key={emp.userId}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            "&:last-child": { borderBottom: "none" },
                            px: 0,
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2">
                            {emp.userName}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDeleteClick(emp, team, "employee")
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              )}

              {/* Coordinators Column */}
              {team.coordinators && team.coordinators.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 1,
                      p: 2,
                      height: "100%",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Coordinators
                      </Typography>
                      <Chip
                        label={team.coordinators.length}
                        size="small"
                        color="secondary"
                      />
                    </Box>
                    <List dense sx={{ pt: 0 }}>
                      {team.coordinators.map((coord) => (
                        <ListItem
                          key={coord.userId}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            "&:last-child": { borderBottom: "none" },
                            px: 0,
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2">
                            {coord.userName}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDeleteClick(coord, team, "coordinator")
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              )}

              {/* BDMs Column */}
              {team.bdms && team.bdms.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 1,
                      p: 2,
                      height: "100%",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        BDMs
                      </Typography>
                      <Chip
                        label={team.bdms.length}
                        size="small"
                        color="success"
                      />
                    </Box>
                    <List dense sx={{ pt: 0 }}>
                      {team.bdms.map((bdm) => (
                        <ListItem
                          key={bdm.userId}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            "&:last-child": { borderBottom: "none" },
                            px: 0,
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2">
                            {bdm.userName}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(bdm, team, "bdm")}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      ))}

      {/* No Results Message */}
      {!searchLoading && filteredTeams.length === 0 && searchQuery && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ py: 4 }}
        >
          <Typography variant="h6" color="text.secondary">
            No teams found matching "{searchQuery}"
          </Typography>
        </Box>
      )}

      {/* Show all teams when no search query */}
      {!searchLoading && filteredTeams.length === 0 && !searchQuery && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ py: 4 }}
        >
          <Typography variant="h6" color="text.secondary">
            No teams available
          </Typography>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.grey[50] }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleteDialog.member?.userName}</strong> from the team?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IndTeamList;