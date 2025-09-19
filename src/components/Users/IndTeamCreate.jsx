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
  Tooltip,
  Badge,
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
  FilterList,
} from "@mui/icons-material";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 3,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Team Header */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Groups color="primary" />
          <Typography variant="h6" component="h2" noWrap>
            {team.teamName || 'Unnamed Team'}
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
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Member Counts */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Team Members
        </Typography>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="primary" />
            <Typography variant="body2">
              {team.employees?.length || 0} Employees
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <AdminPanelSettings fontSize="small" color="secondary" />
            <Typography variant="body2">
              {team.coordinators?.length || 0} Coordinators
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <Business fontSize="small" color="success" />
            <Typography variant="body2">
              {team.bdms?.length || 0} BDMs
            </Typography>
          </Box>
        </Stack>

        {/* Total Members */}
        <Box mt={2}>
          <Chip 
            label={`${getTotalMembers()} Total Members`}
            color={getTotalMembers() > 10 ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onViewDetails(team)}
        >
          View
        </Button>
        
        <Box>
          <IconButton 
            size="small" 
            onClick={() => onEdit(team)}
            color="primary"
          >
            <Edit />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onDelete(team)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

// Demo component to show the card in action
const TeamCardDemo = () => {
  const sampleTeam = {
    teamName: "Development Team Alpha",
    teamLeadName: "John Smith",
    teamLeadId: "TL001",
    employees: [
      { userId: "E001", userName: "Alice Johnson" },
      { userId: "E002", userName: "Bob Wilson" },
      { userId: "E003", userName: "Carol Davis" }
    ],
    coordinators: [
      { userId: "C001", userName: "Dave Miller" }
    ],
    bdms: [
      { userId: "B001", userName: "Eva Brown" },
      { userId: "B002", userName: "Frank Garcia" }
    ]
  };

  const handleEdit = (team) => {
    console.log('Edit team:', team.teamName);
  };

  const handleDelete = (team) => {
    console.log('Delete team:', team.teamName);
  };

  const handleViewDetails = (team) => {
    console.log('View details:', team.teamName);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h5" gutterBottom>
        Simple Team Card
      </Typography>
      <TeamCard
        team={sampleTeam}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />
    </Box>
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
        const response = await fetch(
          "https://mymulya.com/users/employee?excludeRoleName=EMPLOYEE"
        );
        const users = await response.json();

        const categorized = {
          superAdmins: users.filter((user) => user.roles === "SUPERADMIN"),
          teamLeads: users.filter((user) => user.roles === "TEAMLEAD"),
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
      // Pre-populate form with team data
      setFormData({
        teamName: teamData.teamName || "",
        superAdmin: teamData.superAdminId || teamData.superAdmin || "",
        teamLead: teamData.teamLeadId || teamData.teamLead || "",
        employees: teamData.employees?.map(emp => emp.userId || emp.employeeId) || [],
        bdms: teamData.bdms?.map(bdm => bdm.userId || bdm.employeeId) || [],
        coordinators: teamData.coordinators?.map(coord => coord.userId || coord.employeeId) || [],
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = mode === "create" 
        ? `https://mymulya.com/users/assignTeamLead/${formData.teamLead}`
        : `https://mymulya.com/users/updateTeam/${teamData.teamLeadId}`;
        
      const method = mode === "create" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save team");
      
      const data = await response.json();
      onSave(data);
    } catch (error) {
      console.error("Error saving team:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading users...</Typography>
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
              />
            </Grid>

            {/* Leadership Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.superAdmin}>
                <InputLabel>Super Admin *</InputLabel>
                <Select
                  value={formData.superAdmin}
                  onChange={(e) => handleInputChange("superAdmin", e.target.value)}
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
                  onChange={(e) => handleInputChange("teamLead", e.target.value)}
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
            {["employees", "bdms", "coordinators"].map((field) => (
              <Grid item xs={12} md={4} key={field}>
                <Paper elevation={1} sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Typography>
                  <FormGroup>
                    {availableUsers[field].map((user) => (
                      <FormControlLabel
                        key={user.employeeId}
                        control={
                          <Checkbox
                            checked={formData[field].includes(user.employeeId)}
                            onChange={(e) =>
                              handleMultiSelect(field, user.employeeId, e.target.checked)
                            }
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{user.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">
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
              <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={onCancel} startIcon={<Cancel />}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving}
                >
                  {saving ? "Saving..." : mode === "create" ? "Create Team" : "Update Team"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const IndTeamCreate = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://mymulya.com/users/AllAssociatedUsers?entity=IN");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
      showSnackbar("Error fetching teams", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteTeam = async (team) => {
    if (window.confirm(`Are you sure you want to delete team "${team.teamName}"?`)) {
      try {
        const response = await fetch(`https://mymulya.com/users/deleteTeam/${team.teamLeadId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          showSnackbar("Team deleted successfully", "success");
          fetchTeams();
        } else {
          throw new Error("Failed to delete team");
        }
      } catch (error) {
        showSnackbar("Error deleting team", "error");
      }
    }
  };

  const handleViewDetails = (team) => {
    setSelectedTeam(team);
    setActiveTab(2); // Switch to details tab
  };

  const handleSaveTeam = (teamData) => {
    showSnackbar(
      `Team ${dialogMode === "create" ? "created" : "updated"} successfully`,
      "success"
    );
    setDialogOpen(false);
    fetchTeams();
  };

  const filteredTeams = teams.filter((team) =>
    team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.teamLeadName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ width: "100%", bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "primary.main", color: "white", p: 3, mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Team Management Dashboard
        </Typography>
        <Typography variant="subtitle1">
          Manage your teams and team members efficiently
        </Typography>
      </Box>

      <Box sx={{ px: 3 }}>
        {/* Tab Navigation */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              icon={<Groups />}
              label="All Teams"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<Add />}
              label="Create Team"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<Visibility />}
              label="Team Details"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {/* Search and Filter Bar */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <TextField
              placeholder="Search teams or team leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress size={40} />
              <Typography variant="h6" sx={{ ml: 2 }}>Loading teams...</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredTeams.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Groups sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {searchTerm ? "No teams found matching your search" : "No teams available"}
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
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TeamForm
            mode="create"
            onSave={handleSaveTeam}
            onCancel={() => setActiveTab(0)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {selectedTeam ? (
            <Card elevation={2}>
              <CardHeader
                title={`Team Details: ${selectedTeam.teamName}`}
                subheader={`Led by ${selectedTeam.teamLeadName}`}
                action={
                  <Button 
                    startIcon={<Edit />}
                    onClick={() => handleEditTeam(selectedTeam)}
                  >
                    Edit Team
                  </Button>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Team Information</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Team Name" secondary={selectedTeam.teamName} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Team Lead" secondary={selectedTeam.teamLeadName} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Team Lead ID" secondary={selectedTeam.teamLeadId} />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                  
                  {/* Display team members by category */}
                  {["employees", "coordinators", "bdms"].map((category) => (
                    <Grid item xs={12} md={4} key={category}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {category.charAt(0).toUpperCase() + category.slice(1)} 
                          ({selectedTeam[category]?.length || 0})
                        </Typography>
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                          {selectedTeam[category]?.length > 0 ? (
                            selectedTeam[category].map((member) => (
                              <ListItem key={member.userId || member.employeeId}>
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
                              <ListItemText primary="No members" />
                            </ListItem>
                          )}
                        </List>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Select a team to view details
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          scroll="paper"
        >
          <DialogTitle>
            {dialogMode === "create" ? "Create New Team" : "Edit Team"}
          </DialogTitle>
          <DialogContent dividers>
            <TeamForm
              teamData={selectedTeam}
              mode={dialogMode}
              onSave={handleSaveTeam}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default IndTeamCreate;