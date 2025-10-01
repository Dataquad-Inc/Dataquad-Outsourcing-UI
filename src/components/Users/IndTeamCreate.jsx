import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Button,
  Grid,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import {
  Save,
  Cancel,
  Groups,
  AdminPanelSettings,
  Engineering,
  Business,
  Person,
  Add,
  Edit,
  Delete,
  Visibility,
  Refresh,
  Search,
  ArrowBack,
} from "@mui/icons-material";

// Enhanced team filtering function
const isValidTeam = (team) => {
  // Check if team has essential properties
  const hasTeamName = team.teamName && team.teamName.trim() !== "";
  const hasTeamLead = team.teamLeadName && team.teamLeadId;

  // Check if team has at least one member in any category
  const hasMembers =
    (team.employees && team.employees.length > 0) ||
    (team.coordinators && team.coordinators.length > 0) ||
    (team.bdms && team.bdms.length > 0);

  // Exclude teams with default/placeholder names
  const isNotPlaceholder =
    !team.teamName?.includes("Unnamed") &&
    !team.teamName?.includes("Default") &&
    team.teamName !== "No Team Name";

  return hasTeamName && hasTeamLead && hasMembers && isNotPlaceholder;
};

// Team Card Component
const TeamCard = ({ team, onEdit, onDelete, onViewDetails }) => {
  const getTotalMembers = () => {
    return (
      (team.employees?.length || 0) +
      (team.coordinators?.length || 0) +
      (team.bdms?.length || 0)
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-2px)",
        },
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Team Header */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Groups color="primary" />
          <Typography variant="h6" component="h2" noWrap fontWeight="bold">
            {team.teamName}
          </Typography>
        </Box>

        {/* Team Lead Info */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Team Lead
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {team.teamLeadName}
          </Typography>
          <Chip
            label={`ID: ${team.teamLeadId}`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Member Counts */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Team Composition
        </Typography>

        <Stack spacing={1}>
          {team.employees?.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Person fontSize="small" color="primary" />
              <Typography variant="body2">
                {team.employees.length} Employee
                {team.employees.length > 1 ? "s" : ""}
              </Typography>
            </Box>
          )}

          {team.coordinators?.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <AdminPanelSettings fontSize="small" color="secondary" />
              <Typography variant="body2">
                {team.coordinators.length} Coordinator
                {team.coordinators.length > 1 ? "s" : ""}
              </Typography>
            </Box>
          )}

          {team.bdms?.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Business fontSize="small" color="success" />
              <Typography variant="body2">
                {team.bdms.length} BDM{team.bdms.length > 1 ? "s" : ""}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Total Members */}
        <Box mt={2}>
          <Chip
            label={`${getTotalMembers()} Total Members`}
            color={
              getTotalMembers() > 10
                ? "success"
                : getTotalMembers() > 5
                ? "primary"
                : "default"
            }
            size="small"
          />
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onViewDetails(team)}
          variant="outlined"
        >
          View Details
        </Button>

        <Box>
          <IconButton size="small" onClick={() => onEdit(team)} color="primary">
            <Edit />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(team)} color="error">
            <Delete />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

// Team Form Component
const TeamForm = ({ teamData = null, onSave, onCancel, mode = "create" }) => {
  const [formData, setFormData] = useState({
    teamName: "",
    superAdmin: "",
    teamLead: "",
    employees: [],
    bdms: [],
    coordinators: [],
  });

  const [availableUsers, setAvailableUsers] = useState({
    superAdmins: [],
    teamLeads: [],
    employees: [],
    bdms: [],
    coordinators: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://mymulya.com/users/employee");
        const users = await response.json();

        // Add your user to the teamLeads array
        const customTeamLead = {
          userName: "KolanupakaRaghava",
          employeeId: "ADRTIN025",
          roles: "TEAMLEAD",
          designation: "BDM & TL", // Add appropriate designation
        };

        const categorized = {
          superAdmins: users.filter((user) => user.roles === "SUPERADMIN"),
          teamLeads: [
            ...users.filter((user) => user.roles === "TEAMLEAD"),
            customTeamLead,
          ],
          employees: users.filter((user) => user.roles === "EMPLOYEE"),
          bdms: users.filter((user) => user.roles === "BDM"),
          coordinators: users.filter((user) => user.roles === "COORDINATOR"),
        };

        setAvailableUsers(categorized);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (teamData && mode === "edit") {
      setFormData({
        teamName: teamData.teamName || "",
        superAdmin: teamData.superAdminId || teamData.superAdmin || "",
        teamLead: teamData.teamLeadId || teamData.teamLead || "",
        employees:
          teamData.employees?.map((emp) => emp.userId || emp.employeeId) || [],
        bdms: teamData.bdms?.map((bdm) => bdm.userId || bdm.employeeId) || [],
        coordinators:
          teamData.coordinators?.map(
            (coord) => coord.userId || coord.employeeId
          ) || [],
      });
    }
  }, [teamData, mode]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleMultiSelect = (field, userId, isChecked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: isChecked
        ? [...prev[field], userId]
        : prev[field].filter((id) => id !== userId),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.teamName.trim()) newErrors.teamName = "Team name is required";
    if (!formData.superAdmin) newErrors.superAdmin = "Super Admin is required";
    if (!formData.teamLead) newErrors.teamLead = "Team Lead is required";

    // Validate at least one team member is selected
    const totalMembers =
      formData.employees.length +
      formData.bdms.length +
      formData.coordinators.length;
    if (totalMembers === 0) {
      newErrors.members = "At least one team member must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = `https://mymulya.com/users/assignTeamLead/${formData.superAdmin}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      onSave(data);
    } catch (error) {
      console.error("Error saving team:", error);
      // You might want to show an error snackbar here
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading users...
        </Typography>
      </Box>
    );
  }

  return (
    <Card elevation={2}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Groups color="primary" />
            <Typography variant="h5">
              {mode === "create" ? "Create New Team" : "Edit Team"}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Name"
                value={formData.teamName}
                onChange={(e) => handleInputChange("teamName", e.target.value)}
                error={!!errors.teamName}
                helperText={errors.teamName}
                required
                variant="outlined"
                placeholder="Enter a descriptive team name"
              />
            </Grid>

            {/* Leadership Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.superAdmin}>
                <InputLabel>Super Admin *</InputLabel>
                <Select
                  value={formData.superAdmin}
                  onChange={(e) =>
                    handleInputChange("superAdmin", e.target.value)
                  }
                  label="Super Admin *"
                >
                  <MenuItem value="">Select Super Admin</MenuItem>
                  {availableUsers.superAdmins.map((user) => (
                    <MenuItem key={user.employeeId} value={user.employeeId}>
                      {user.userName} - {user.designation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.teamLead}>
                <InputLabel>Team Lead *</InputLabel>
                <Select
                  value={formData.teamLead}
                  onChange={(e) =>
                    handleInputChange("teamLead", e.target.value)
                  }
                  label="Team Lead *"
                >
                  <MenuItem value="">Select Team Lead</MenuItem>
                  {availableUsers.teamLeads.map((user) => (
                    <MenuItem key={user.employeeId} value={user.employeeId}>
                      {user.userName} - {user.designation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Team Members Selection */}
            <Grid item xs={12}>
              {errors.members && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.members}
                </Alert>
              )}
              <Typography variant="h6" gutterBottom>
                Select Team Members *
              </Typography>
            </Grid>

            {["employees", "bdms", "coordinators"].map((field) => (
              <Grid item xs={12} md={4} key={field}>
                <Paper
                  elevation={1}
                  sx={{ p: 2, maxHeight: 300, overflow: "auto" }}
                >
                  <Typography variant="h6" gutterBottom color="primary">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    <Chip
                      label={formData[field].length}
                      size="small"
                      color={formData[field].length > 0 ? "success" : "default"}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <FormGroup>
                    {availableUsers[field].map((user) => (
                      <FormControlLabel
                        key={user.employeeId}
                        control={
                          <Checkbox
                            checked={formData[field].includes(user.employeeId)}
                            onChange={(e) =>
                              handleMultiSelect(
                                field,
                                user.employeeId,
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">
                              {user.userName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.designation}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </Paper>
              </Grid>
            ))}

            {/* Actions */}
            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="flex-end"
                gap={2}
                sx={{ mt: 2 }}
              >
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  startIcon={<Cancel />}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : mode === "create"
                    ? "Create Team"
                    : "Update Team"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

// Team Details Component with Delete Member Functionality
const TeamDetails = ({
  team,
  onEdit,
  onBack,
  onDeleteMember,
  deletingMember,
}) => {
  if (!team) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Select a team to view details
        </Typography>
      </Paper>
    );
  }

  const getTotalMembers = () => {
    return (
      (team.employees?.length || 0) +
      (team.coordinators?.length || 0) +
      (team.bdms?.length || 0)
    );
  };

  const handleDeleteMember = (member, category) => {
    onDeleteMember(team, member, category);
  };

  return (
    <Card elevation={2}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={onBack}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5">{team.teamName}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Led by {team.teamLeadName} • {getTotalMembers()} Total Members
              </Typography>
            </Box>
          </Box>
        }
        action={
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => onEdit(team)}
          >
            Edit Team
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Team Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Team Name" secondary={team.teamName} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Team Lead"
                    secondary={team.teamLeadName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Team Lead ID"
                    secondary={team.teamLeadId}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Members"
                    secondary={getTotalMembers()}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Display team members by category with delete buttons */}
          {["employees", "coordinators", "bdms"].map((category) => (
            <Grid item xs={12} md={4} key={category}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {category.charAt(0).toUpperCase() + category.slice(1)}(
                  {team[category]?.length || 0})
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                  {team[category]?.length > 0 ? (
                    team[category].map((member) => (
                      <ListItem
                        key={member.userId || member.employeeId}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteMember(member, category)}
                            color="error"
                            size="small"
                            disabled={
                              deletingMember ===
                              (member.employeeId || member.userId)
                            }
                          >
                            {deletingMember ===
                            (member.employeeId || member.userId) ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Delete />
                            )}
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={member.userName}
                          secondary={member.userId || member.employeeId}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No members"
                        secondary={`No ${category.toLowerCase()} assigned to this team`}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Main Dashboard Component with Tabs
const TeamManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [currentView, setCurrentView] = useState("list");
  const [deletingMember, setDeletingMember] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://mymulya.com/users/AllAssociatedUsers?entity=IN"
      );
      const data = await response.json();

      // Filter to show only fully created teams
      const validTeams = data.filter(isValidTeam);

      console.log(
        `Total teams from API: ${data.length}, Valid teams: ${validTeams.length}`
      );

      setTeams(validTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      handleSnackbar("Error fetching teams", "error");
    } finally {
      setLoading(false);
    }
  };

  // Navigation helper function
  const navigateToTeamList = () => {
    setCurrentTab(0);
    setCurrentView("list");
    setSelectedTeam(null);
  };

  const handleSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setCurrentView("list");
    setSelectedTeam(null);
  };

  const handleCreateTeam = () => {
    setCurrentTab(1);
    setSelectedTeam(null);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setCurrentTab(1);
  };

  const handleDeleteTeam = async (team) => {
    if (
      window.confirm(`Are you sure you want to delete team "${team.teamName}"?`)
    ) {
      try {
        const response = await fetch(
          `https://mymulya.com/users/deleteTeam/${team.teamLeadId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          handleSnackbar("Team deleted successfully", "success");
          fetchTeams();
        } else {
          throw new Error("Failed to delete team");
        }
      } catch (error) {
        handleSnackbar("Error deleting team", "error");
      }
    }
  };

  const handleDeleteTeamMember = async (team, member, category) => {
    // Prevent deleting team lead through member deletion
    if (member.employeeId === team.teamLeadId) {
      handleSnackbar(
        "Cannot remove team lead. Please assign a new team lead first.",
        "warning"
      );
      return;
    }

    if (deletingMember === (member.employeeId || member.userId)) return;

    if (
      window.confirm(
        `Are you sure you want to remove ${member.userName} from the team?`
      )
    ) {
      setDeletingMember(member.employeeId || member.userId);

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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        handleSnackbar(
          `${member.userName} removed from team successfully`,
          "success"
        );

        // Optimistically update the UI without refetching all teams
        const updatedTeams = teams.map((t) => {
          if (t.teamLeadId === team.teamLeadId) {
            const updatedTeam = { ...t };
            updatedTeam[category] = updatedTeam[category].filter(
              (m) =>
                (m.userId || m.employeeId) !==
                (member.userId || member.employeeId)
            );
            return updatedTeam;
          }
          return t;
        });

        setTeams(updatedTeams);

        // Update selected team if currently viewing it
        if (selectedTeam && selectedTeam.teamLeadId === team.teamLeadId) {
          const updatedSelectedTeam = updatedTeams.find(
            (t) => t.teamLeadId === team.teamLeadId
          );
          setSelectedTeam(updatedSelectedTeam);
        }
      } catch (error) {
        console.error("Error removing team member:", error);
        handleSnackbar(error.message || "Error removing team member", "error");
        // Re-fetch to ensure data consistency
        fetchTeams();
      } finally {
        setDeletingMember(null);
      }
    }
  };

  const handleViewDetails = (team) => {
    setSelectedTeam(team);
    setCurrentView("details");
  };

  const handleSaveTeam = (teamData) => {
    handleSnackbar(
      `Team ${selectedTeam ? "updated" : "created"} successfully`,
      "success"
    );
    navigateToTeamList();
    fetchTeams();
  };

  const handleCancel = () => {
    navigateToTeamList();
  };

  const handleBackToList = () => {
    navigateToTeamList();
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.teamLeadName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      sx={{ width: "100%", bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: "primary.main", color: "white", p: 1, mb: 1 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Team Management
        </Typography>
      </Box>

      <Box sx={{ px: 3 }}>
        {/* Tabs Navigation */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab icon={<Groups />} label="Teams List" iconPosition="start" />
            <Tab
              icon={<Add />}
              label={selectedTeam ? "Edit Team" : "Create Team"}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Teams List Tab */}
        <TabPanel value={currentTab} index={0}>
          {currentView === "list" ? (
            <>
              {/* Stats and Action Bar */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Box display="flex" gap={2} alignItems="center">
                  <TextField
                    placeholder="Search teams or team leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 300 }}
                    InputProps={{
                      startAdornment: (
                        <Search sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                  <Chip
                    label={`${filteredTeams.length} Active Teams`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchTeams}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateTeam}
                  >
                    Create Team
                  </Button>
                </Box>
              </Box>

              {/* Teams Grid */}
              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="400px"
                >
                  <CircularProgress size={40} />
                  <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading teams...
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {filteredTeams.length === 0 ? (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 4, textAlign: "center" }}>
                        <Groups
                          sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          {searchTerm
                            ? "No teams found matching your search"
                            : "No complete teams found"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {searchTerm
                            ? "Try adjusting your search terms"
                            : "Create your first complete team with proper name and members"}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={handleCreateTeam}
                          sx={{ mt: 2 }}
                        >
                          Create Your First Team
                        </Button>
                      </Paper>
                    </Grid>
                  ) : (
                    filteredTeams.map((team, index) => (
                      <Grid item xs={12} md={6} lg={4} key={index}>
                        <TeamCard
                          team={team}
                          onEdit={handleEditTeam}
                          onDelete={handleDeleteTeam}
                          onViewDetails={handleViewDetails}
                        />
                      </Grid>
                    ))
                  )}
                </Grid>
              )}
            </>
          ) : (
            /* Team Details View within List Tab */
            <TeamDetails
              team={selectedTeam}
              onEdit={handleEditTeam}
              onBack={handleBackToList}
              onDeleteMember={handleDeleteTeamMember}
              deletingMember={deletingMember}
            />
          )}
        </TabPanel>

        {/* Create/Edit Team Tab */}
        <TabPanel value={currentTab} index={1}>
          <TeamForm
            teamData={selectedTeam}
            mode={selectedTeam ? "edit" : "create"}
            onSave={handleSaveTeam}
            onCancel={handleCancel}
          />
        </TabPanel>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default TeamManagement;
