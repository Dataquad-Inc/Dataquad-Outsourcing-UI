import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
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
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Save,
  X as Cancel,
  Users as Groups,
  ShieldCheck as AdminPanelSettings,
  Wrench as Engineering,
  Briefcase as BusinessCenter,
  User as Person,
  MapPin as AddLocationAlt,
  MapPin as Map,
  Network as Hub,
  Network as ConnectWithoutContact,
  Briefcase as Business, // replaces Business
  MapPin as Coordinate,
} from "lucide-react";

const TeamManagementForm = ({
  teamData = null,
  onSave,
  onCancel,
  mode = "create",
}) => {
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

  // Initialize form data when component mounts or teamData changes
  useEffect(() => {
    if (teamData && mode === "edit") {
      setFormData({
        teamName: teamData.teamName || "",
        superAdmin: teamData.superAdmin || "",
        teamLead: teamData.teamLead || "",
        employees: teamData.employees || [],
        bdms: teamData.bdms || [],
        coordinators: teamData.coordinators || [],
      });
    }
  }, [teamData, mode]);

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://mymulya.com/users/employee?excludeRoleName=EMPLOYEE"
        );
        const users = await response.json();

        // Categorize users by role
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
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

    if (!formData.teamName.trim()) {
      newErrors.teamName = "Team name is required";
    }

    if (!formData.superAdmin) {
      newErrors.superAdmin = "Super Admin is required";
    }

    if (!formData.teamLead) {
      newErrors.teamLead = "Team Lead is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://mymulya.com/users/assignTeamLead/${formData.teamLead}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save team");
      }

      const data = await response.json();
      console.log("Team saved:", data);
    } catch (error) {
      console.error("Error saving team:", error);
    } finally {
      setSaving(false);
    }
  };

  const getUserName = (userId) => {
    const allUsers = [
      ...availableUsers.superAdmins,
      ...availableUsers.teamLeads,
      ...availableUsers.employees,
      ...availableUsers.bdms,
      ...availableUsers.coordinators,
    ];
    const user = allUsers.find((u) => u.employeeId === userId);
    return user ? user.userName : userId;
  };

  const renderUserSelection = (users, field, title, icon, multiple = true) => {
    if (multiple) {
      return (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", mb: 2 }}
          >
            {icon}
            <Box component="span" sx={{ ml: 1 }}>
              {title}
            </Box>
          </Typography>
          <FormGroup>
            {users.map((user) => (
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
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {user.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.designation} - {user.email}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
          {formData[field].length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selected ({formData[field].length}):
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData[field].map((userId) => (
                  <Chip
                    key={userId}
                    label={getUserName(userId)}
                    size="small"
                    onDelete={() => handleMultiSelect(field, userId, false)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      );
    }

    return (
      <FormControl fullWidth error={!!errors[field]} sx={{ mb: 2 }}>
        <InputLabel>{title}</InputLabel>
        <Select
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          label={title}
          startAdornment={icon}
        >
          <MenuItem value="">
            <em>Select {title}</em>
          </MenuItem>
          {users.map((user) => (
            <MenuItem key={user.employeeId} value={user.employeeId}>
              <Box>
                <Typography variant="body2">{user.userName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.designation} - {user.email}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
        {errors[field] && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            {errors[field]}
          </Typography>
        )}
      </FormControl>
    );
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
    <Box maxWidth="lg" mx="auto">
      <Card elevation={3}>
        <CardHeader
          avatar={<Groups color="primary" />}
          title={
            <Typography variant="h4" component="h1">
              {mode === "create" ? "Create New Team" : "Edit Team"}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {mode === "create"
                ? "Fill in the details to create a new team"
                : "Update team information and members"}
            </Typography>
          }
        />

        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Team Name"
                  value={formData.teamName}
                  onChange={(e) =>
                    handleInputChange("teamName", e.target.value)
                  }
                  error={!!errors.teamName}
                  helperText={errors.teamName}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Leadership */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Leadership
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                {renderUserSelection(
                  availableUsers.superAdmins,
                  "superAdmin",
                  "Super Admin *",
                  <AdminPanelSettings color="primary" sx={{ mr: 1 }} />,
                  false
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {renderUserSelection(
                  availableUsers.teamLeads,
                  "teamLead",
                  "Team Lead *",
                  <Engineering color="primary" sx={{ mr: 1 }} />,
                  false
                )}
              </Grid>

              {/* Team Members */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Team Members
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                {renderUserSelection(
                  availableUsers.employees,
                  "employees",
                  "Employees",
                  <Person color="action" sx={{ mr: 1 }} />
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                {renderUserSelection(
                  availableUsers.bdms,
                  "bdms",
                  "Business Development Managers",
                  <Business color="action" sx={{ mr: 1 }} />
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                {renderUserSelection(
                  availableUsers.coordinators,
                  "coordinators",
                  "Coordinators",
                  <Coordinate color="action" sx={{ mr: 1 }} />
                )}
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  gap={2}
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    startIcon={<Cancel />}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      saving ? <CircularProgress size={20} /> : <Save />
                    }
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

      {/* Summary Card */}
      {(formData.teamName ||
        formData.superAdmin ||
        formData.teamLead ||
        formData.employees.length > 0 ||
        formData.bdms.length > 0 ||
        formData.coordinators.length > 0) && (
        <Card elevation={2} sx={{ mt: 3 }}>
          <CardHeader
            title="Team Summary"
            subheader="Preview of your team configuration"
          />
          <CardContent>
            <List dense>
              {formData.teamName && (
                <ListItem>
                  <ListItemIcon>
                    <Groups color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Team Name"
                    secondary={formData.teamName}
                  />
                </ListItem>
              )}
              {formData.superAdmin && (
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Super Admin"
                    secondary={getUserName(formData.superAdmin)}
                  />
                </ListItem>
              )}
              {formData.teamLead && (
                <ListItem>
                  <ListItemIcon>
                    <Engineering color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Team Lead"
                    secondary={getUserName(formData.teamLead)}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText
                  primary="Total Members"
                  secondary={`${
                    formData.employees.length +
                    formData.bdms.length +
                    formData.coordinators.length
                  } members`}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TeamManagementForm;
