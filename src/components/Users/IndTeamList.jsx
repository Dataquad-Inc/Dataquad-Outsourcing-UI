import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Grid,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

const IndTeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(
          "https://mymulya.com/users/AllAssociatedUsers?entity=IN"
        );
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        India Teams
      </Typography>

      <Grid container spacing={3}>
        {teams.map((team, idx) => (
          <Grid item xs={12} md={6} lg={4} key={idx}>
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}
            >
              <CardContent>
                {/* Team Lead Info */}
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{team.teamLeadName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {team.teamLeadId}
                    </Typography>
                  </Box>
                </Box>

                {/* Team Name */}
                <Chip
                  label={team.teamName || "No Team Name"}
                  color={team.teamName ? "success" : "default"}
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ mb: 2 }} />

                {/* Employees */}
                {team.employees?.length > 0 && (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <GroupsIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle1" ml={1}>
                        Employees
                      </Typography>
                    </Box>
                    <List dense>
                      {team.employees.map((emp) => (
                        <ListItem key={emp.userId} disableGutters>
                          <ListItemText
                            primary={emp.userName}
                            secondary={emp.userId}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Coordinators */}
                {team.coordinators?.length > 0 && (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <SupervisorAccountIcon fontSize="small" color="secondary" />
                      <Typography variant="subtitle1" ml={1}>
                        Coordinators
                      </Typography>
                    </Box>
                    <List dense>
                      {team.coordinators.map((co) => (
                        <ListItem key={co.userId} disableGutters>
                          <ListItemText
                            primary={co.userName}
                            secondary={co.userId}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* BDMs */}
                {team.bdms?.length > 0 && (
                  <Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <BusinessCenterIcon fontSize="small" color="action" />
                      <Typography variant="subtitle1" ml={1}>
                        BDMs
                      </Typography>
                    </Box>
                    <List dense>
                      {team.bdms.map((bdm) => (
                        <ListItem key={bdm.userId} disableGutters>
                          <ListItemText
                            primary={bdm.userName}
                            secondary={bdm.userId}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default IndTeamList;
