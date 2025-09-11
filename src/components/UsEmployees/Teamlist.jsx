import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
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

  // Delete Team Member
  const handleDeleteMember = async (teamLeadId, memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(
        `https://mymulya.com/users/team/${teamLeadId}/user/${memberId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        alert("Member deleted successfully!");
        fetchTeams();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to delete member");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Something went wrong");
    }
  };

  // Helper to render member chips
  const renderMembers = (members, teamLeadId, label) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {label}
      </Typography>
      {members.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {members.map((m, i) => (
            <Chip
              key={i}
              label={m.userName}
              size="small"
              color="primary"
              variant="outlined"
              onDelete={() => handleDeleteMember(teamLeadId, m.userId)}
              deleteIcon={<Delete size={16} />}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          None
        </Typography>
      )}
    </Box>
  );

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

      {/* Loader */}
      {loading && (
        <Box sx={{ width: "100%", mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Team Cards */}
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
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {/* Header */}
                  <CardHeader
                    title={team.teamName || "Unnamed Team"}
                    subheader={`Team Lead: ${
                      team.teamLeadName || "Not Assigned"
                    }`}
                    action={
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
                    }
                  />
                  <Divider />

                  {/* Body */}
                  <CardContent sx={{ flexGrow: 1 }}>
                    {renderMembers(recruiters, team.teamLeadId, "Recruiters")}
                    {renderMembers(salesExecs, team.teamLeadId, "Sales Executives")}

                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Members Count
                      </Typography>
                      <Typography variant="body2">{membersCount}</Typography>
                    </Box>
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
