import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
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
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color:"primary"
          }}
        >
          Teams
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ width: "100%", mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {teams.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Team Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Team Lead</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Recruiters</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Sales Executives
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Members Count</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team, index) => {
                const recruiters =
                  team.recruiters?.map((r) => r.userName).join(", ") || "None";
                const salesExecs =
                  team.salesExecutives?.map((s) => s.userName).join(", ") ||
                  "None";
                const membersCount =
                  (team.recruiters?.length || 0) +
                  (team.salesExecutives?.length || 0);

                return (
                  <TableRow key={index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{team.teamName || "Unnamed Team"}</TableCell>
                    <TableCell>{team.teamLeadName || "Not Assigned"}</TableCell>
                    <TableCell>{recruiters}</TableCell>
                    <TableCell>{salesExecs}</TableCell>
                    <TableCell>{membersCount}</TableCell>
                    <TableCell align="right">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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
