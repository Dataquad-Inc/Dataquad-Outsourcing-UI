import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from "@mui/material";
import {
  Edit,
  Trash2 as Delete,
  Users as Group,
  User as People,
  UserCog as SupervisorAccount,
} from "lucide-react";

const Teamlist = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Teams
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://mymulya.com/users/AllAssociatedUsers"
      );
      const data = await res.json();
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={2}>
        {teams.map((team, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                {/* Team Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Group size={18} /> {team.teamName}
                  </Typography>
                  <Box>
                    <Tooltip title="Edit Team">
                      <IconButton color="primary" size="small">
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Team">
                      <IconButton color="error" size="small">
                        <Delete size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Team Lead & Superadmin */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  mt={1}
                ></Typography>
                <Typography variant="body2" color="text.secondary">
                  <People size={14} style={{ marginRight: 4 }} />
                  Team Lead: <strong>{team.teamLeadName || "N/A"}</strong>
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {/* Recruiters */}
                <Typography variant="subtitle2" gutterBottom>
                  Recruiters:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {team.recruiters?.length > 0 ? (
                    team.recruiters.map((rec) => (
                      <Chip
                        key={rec.userId}
                        label={rec.userName}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No Recruiters
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Sales Executives */}
                <Typography variant="subtitle2" gutterBottom>
                  Sales Executives:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {team.salesExecutives?.length > 0 ? (
                    team.salesExecutives.map((exec) => (
                      <Chip
                        key={exec.userId}
                        label={exec.userName}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No Sales Executives
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Typography align="center" color="text.secondary" mt={2}>
          Loading teams...
        </Typography>
      )}
    </Box>
  );
};

export default Teamlist;
