import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Computer,
  Storage,
  Code,
  Cloud,
  Security,
  DataUsage,
  AccountTree,
  Search as SearchIcon,
  Clear as ClearIcon,
  SearchOff as SearchOffIcon,
  OpenInNew as OpenInNewIcon,
  People as PeopleIcon,
} from "@mui/icons-material";

// ─── Icon picker by tag name ───────────────────────────────────────────────────
function getTechIcon(techName, theme) {
  const name = (techName || "").toLowerCase();
  if (name.includes("java"))                        return <Code      sx={{ color: "#f89820"                         }} />;
  if (name.includes("react") || name.includes("frontend")) return <Storage sx={{ color: "#61dafb"                   }} />;
  if (name.includes("sap"))                         return <DataUsage sx={{ color: "#0f7e3f"                         }} />;
  if (name.includes("cloud") || name.includes("aws")) return <Cloud   sx={{ color: "#ff9900"                         }} />;
  if (name.includes("security"))                    return <Security  sx={{ color: "#d32f2f"                         }} />;
  if (name.includes("full stack"))                  return <AccountTree sx={{ color: "#9c27b0"                       }} />;
  return                                                    <Computer sx={{ color: theme.palette.primary.main        }} />;
}

// ─── Skeleton placeholder cards ───────────────────────────────────────────────
function CardSkeletons() {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="60%" height={28} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── Empty / no-search-results state ─────────────────────────────────────────
function EmptyState({ keyword, onClear }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: "center",
        py: 8,
        px: 3,
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <SearchOffIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {keyword ? "No matching technologies found" : "No technology tags found"}
      </Typography>
      {keyword && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No results for{" "}
            <Box component="span" sx={{ color: "error.main", fontWeight: 600 }}>
              "{keyword}"
            </Box>
            . Try a different term or clear the search.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <IconButton onClick={onClear} color="primary">
              <ClearIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Paper>
  );
}

// ─── TechSummaryCards ─────────────────────────────────────────────────────────
/**
 * Props:
 *   techSummary   – [{ tagName, count }]
 *   loading       – boolean
 *   onCardClick   – fn(tech) called when a card is clicked
 */
const TechSummaryCards = ({ techSummary = [], loading = false, onCardClick }) => {
  const theme = useTheme();
  const [keyword, setKeyword] = React.useState("");

  const filteredSummary = React.useMemo(() => {
    if (!keyword.trim()) return techSummary;
    return techSummary.filter((t) =>
      t.tagName.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [techSummary, keyword]);

  if (loading) return <CardSkeletons />;

  return (
    <Box>
      {/* Search bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Search technologies… (e.g. Java, React, Python)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: keyword && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setKeyword("")}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        />
      </Box>

      {/* Cards grid or empty state */}
      {filteredSummary.length === 0 ? (
        <EmptyState keyword={keyword} onClear={() => setKeyword("")} />
      ) : (
        <Grid container spacing={3}>
          {filteredSummary.map((tech, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: theme.shadows[6] },
                }}
              >
                <CardActionArea
                  onClick={() => onCardClick?.(tech)}
                  sx={{ height: "100%", borderRadius: 3 }}
                >
                  <CardContent>
                    {/* Icon + name row */}
                    <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                        }}
                      >
                        {getTechIcon(tech.tagName, theme)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {tech.tagName}
                        </Typography>
                      </Box>
                      <OpenInNewIcon
                        fontSize="small"
                        sx={{ color: "action.active", opacity: 0.45, flexShrink: 0 }}
                      />
                    </Stack>

                    {/* Count row */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mt: 1 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PeopleIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          Candidates
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        {tech.count}
                      </Typography>
                    </Stack>

                    {/* Click hint */}
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ mt: 1.5, display: "block", opacity: 0.75 }}
                    >
                      Click to view list →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TechSummaryCards;