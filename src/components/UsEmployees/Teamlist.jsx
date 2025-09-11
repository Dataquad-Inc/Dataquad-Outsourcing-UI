import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from "@mui/material";
import { Edit, Trash2 as Delete, Users as Group } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const Teamlist = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  // Fetch Teams
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://mymulya.com/users/AllAssociatedUsers");
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="primary">
          Teams
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ width: "100%", mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {teams.length > 0 ? (
        <Grid container spacing={3}>
          {teams.map((team, index) => {
            const recruiters = team.recruiters || [];
            const salesExecs = team.salesExecutives || [];
            const membersCount = recruiters.length + salesExecs.length;

            return (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardHeader
                    title={team.teamName || "Unnamed Team"}
                    subheader={`Team Lead: ${
                      team.teamLeadName || "Not Assigned"
                    }`}
                    action={
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit Team">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              navigate("/dashboard/us-employees/editteam", {
                                state: { team },
                              })
                            }
                          >
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Team">
                          <IconButton size="small" color="error">
                            <Delete size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  />
                  <Divider />
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Recruiters */}
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Recruiters
                    </Typography>
                    {recruiters.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                        {recruiters.map((r, i) => (
                          <Chip
                            key={i}
                            label={r.userName}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        None
                      </Typography>
                    )}

                    {/* Sales Executives */}
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Sales Executives
                    </Typography>
                    {salesExecs.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                        {salesExecs.map((s, i) => (
                          <Chip
                            key={i}
                            label={s.userName}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        None
                      </Typography>
                    )}

                    {/* Members Count */}
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Members Count
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {membersCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        !loading && (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              backgroundColor: "grey.50",
              borderRadius: 3,
              mt: 2,
            }}
          >
            <Group
              size={56}
              color={theme.palette.grey[400]}
              style={{ margin: "0 auto 16px" }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Teams Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start building your organization by creating a new team
            </Typography>
            <Button variant="contained" sx={{ mt: 3, borderRadius: 2 }}>
              Create Team
            </Button>
          </Box>
        )
      )}
    </Box>
  );
};

export default Teamlist;
