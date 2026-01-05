import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Avatar,
  Stack,
  useTheme,
  Chip,
  Grow,
  Fade,
  Button,
  alpha,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  CardHeader,
} from "@mui/material";
import {
  Group as GroupIcon,
  UploadFile as UploadFileIcon,
  CalendarMonth as CalendarMonthIcon,
  TrendingUp as TrendingUpIcon,
  ChevronRight as ChevronRightIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  ContentPaste as ContentPasteIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Diversity3 as Diversity3Icon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdroitHome = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [animatedValues, setAnimatedValues] = useState({});
  const [cardsVisible, setCardsVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user data from Redux
  const { role, userId, entity } = useSelector((state) => state.auth);
  const userRole = role || "SUPERADMIN";
  const userEntity = entity || "US";

  // Role configurations
  const roleConfig = {
    SUPERADMIN: {
      name: "Super Admin",
      color: theme.palette.error.main,
      permissions: ["all"],
      dashboardView: "full",
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    ADMIN: {
      name: "Admin",
      color: theme.palette.warning.main,
      permissions: ["view", "create", "edit", "reports"],
      dashboardView: "full",
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    TEAMLEAD: {
      name: "Team Lead",
      color: theme.palette.info.main,
      permissions: ["view", "create", "edit", "team_reports"],
      dashboardView: "team",
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    RECRUITER: {
      name: "Recruiter",
      color: theme.palette.success.main,
      permissions: ["view", "create", "manage_candidates"],
      dashboardView: "personal",
      canCreate: true,
      canEdit: false,
      canDelete: false,
    },
    SALESEXECUTIVE: {
      name: "Sales Executive",
      color: theme.palette.secondary.main,
      permissions: ["view", "create", "manage_clients"],
      dashboardView: "sales",
      canCreate: true,
      canEdit: false,
      canDelete: false,
    },
    GRANDSALES: {
      name: "Grand Sales",
      color: theme.palette.primary.main,
      permissions: ["view", "create", "manage_clients", "reports"],
      dashboardView: "full",
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    EMPLOYEE: {
      name: "Employee",
      color: theme.palette.grey[600],
      permissions: ["view"],
      dashboardView: "limited",
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  };

  // Current role configuration
  const currentRoleConfig = roleConfig[userRole] || roleConfig.EMPLOYEE;

  // US Quick Actions
  const quickActions = [
    {
      title: "Add New Consultant",
      icon: PersonAddIcon,
      color: theme.palette.primary.main,
      path: "/dashboard/hotlist/create",
      description: "Add a new consultant to the US hotlist",
      roles: ["SUPERADMIN", "ADMIN", "TEAMLEAD", "RECRUITER", "GRANDSALES"],
      entity: "US",
    },
    {
      title: "Create Requirement",
      icon: AssignmentIcon,
      color: theme.palette.success.main,
      path: "/dashboard/us-requirements/create-requirement",
      description: "Create a new US requirement",
      roles: [
        "SUPERADMIN",
        "ADMIN",
        "TEAMLEAD",
        "SALESEXECUTIVE",
        "GRANDSALES",
      ],
      entity: "US",
    },
    {
      title: "Add Client",
      icon: BusinessIcon,
      color: theme.palette.info.main,
      path: "/dashboard/us-clients/us-create",
      description: "Add a new US client",
      roles: ["SUPERADMIN", "ADMIN", "SALESEXECUTIVE", "GRANDSALES"],
      entity: "US",
    },
    {
      title: "Create Submission",
      icon: UploadFileIcon,
      color: theme.palette.warning.main,
      path: "/dashboard/us-submissions/create-submission",
      description: "Create a new US submission",
      roles: ["SUPERADMIN", "ADMIN", "TEAMLEAD", "RECRUITER", "GRANDSALES"],
      entity: "US",
    },
    {
      title: "View Hotlist",
      icon: PeopleIcon,
      color: theme.palette.secondary.main,
      path: "/dashboard/hotlist/consultants",
      description: "View US consultants hotlist",
      roles: [
        "SUPERADMIN",
        "ADMIN",
        "TEAMLEAD",
        "RECRUITER",
        "SALESEXECUTIVE",
        "GRANDSALES",
        "EMPLOYEE",
      ],
      entity: "US",
    },
    {
      title: "RTR Form",
      icon: ContentPasteIcon,
      color: theme.palette.error.main,
      path: "/dashboard/rtr/rtr-form",
      description: "Create Right to Represent form",
      roles: ["SUPERADMIN", "ADMIN", "TEAMLEAD", "RECRUITER", "GRANDSALES"],
      entity: "US",
    },
    {
      title: "View Requirements",
      icon: AssignmentIcon,
      color: theme.palette.success.dark,
      path: "/dashboard/us-requirements",
      description: "View US requirements list",
      roles: [
        "SUPERADMIN",
        "ADMIN",
        "TEAMLEAD",
        "RECRUITER",
        "SALESEXECUTIVE",
        "GRANDSALES",
        "EMPLOYEE",
      ],
      entity: "US",
    },
    {
      title: "View Submissions",
      icon: DescriptionIcon,
      color: theme.palette.info.dark,
      path: "/dashboard/us-submissions/submissions-list",
      description: "View US submissions list",
      roles: [
        "SUPERADMIN",
        "ADMIN",
        "TEAMLEAD",
        "RECRUITER",
        "SALESEXECUTIVE",
        "GRANDSALES",
        "EMPLOYEE",
      ],
      entity: "US",
    },
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://mymulya.com/api/us/requirements/dashboard/get-all"
      );

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", responseText);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      console.log("Dashboard data received:", data);
      setDashboardData(data);

      // Trigger card animations after data is loaded
      setTimeout(() => {
        setCardsVisible(true);
        const values = {};
        const cards = getCardDataFromAPI(data);
        cards.forEach((card) => {
          values[card.id] = card.value;
        });
        setAnimatedValues(values);
      }, 100);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Initial load on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getCardDataFromAPI = (data) => {
    if (!data) return [];

    const baseCards = [
      {
        id: "totalHotlistExceptFullTime",
        title: "Total Hotlist (Excl. Full Time)",
        value: parseInt(data.totalHotlistExceptFullTime) || 0,
        icon: GroupIcon,
        color: theme.palette.primary.main,
        bgColor: alpha(theme.palette.primary.main, 0.1),
        change: "+5%",
        changeType: "positive",
        description: "Total consultants available for US projects",
        roles: [
          "SUPERADMIN",
          "ADMIN",
          "TEAMLEAD",
          "RECRUITER",
          "SALESEXECUTIVE",
          "GRANDSALES",
        ],
        suffix: "",
        navigateTo: "/dashboard/hotlist/consultants",
      },
      {
        id: "w2HotlistCount",
        title: "W2 Hotlist Count",
        value: parseInt(data.w2HotlistCount) || 0,
        icon: PersonIcon,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
        change: "+2%",
        changeType: "positive",
        description: "W2 employees available in US",
        roles: ["SUPERADMIN", "ADMIN", "TEAMLEAD", "RECRUITER", "GRANDSALES"],
        suffix: "",
        navigateTo: "/dashboard/hotlist/w2",
      },
      {
        id: "rtrMonthlyCount",
        title: "RTR Monthly Count",
        value: parseInt(data.rtrMonthlyCount) || 0,
        icon: Diversity3Icon,
        color: theme.palette.secondary.main,
        bgColor: alpha(theme.palette.secondary.main, 0.1),
        change: "+12%",
        changeType: "positive",
        description: "Ready to recruit this month in US",
        roles: ["SUPERADMIN", "ADMIN", "TEAMLEAD", "RECRUITER", "GRANDSALES"],
        suffix: "",
        navigateTo: "/dashboard/rtr/rtr-list",
      },
      {
        id: "currentMonthInterview",
        title: "Current Month Interviews",
        value: parseInt(data.currentMonthInterview) || 0,
        icon: CalendarMonthIcon,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        change: "+15%",
        changeType: "positive",
        description: "Interviews scheduled this month in US",
        roles: [
          "SUPERADMIN",
          "ADMIN",
          "TEAMLEAD",
          "RECRUITER",
          "SALESEXECUTIVE",
          "GRANDSALES",
        ],
        suffix: "",
        navigateTo: "/dashboard/us-interviews",
      },
      {
        id: "currentMonthRequirements",
        title: "Current Month Requirements",
        value: parseInt(data.currentMonthRequirements) || 0,
        icon: AssignmentIcon,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        change: "+8%",
        changeType: "positive",
        description: "New requirements this month in US",
        roles: [
          "SUPERADMIN",
          "ADMIN",
          "TEAMLEAD",
          "SALESEXECUTIVE",
          "GRANDSALES",
        ],
        suffix: "",
        navigateTo: "/dashboard/us-requirements",
      },
      {
        id: "currentMonthSubmissions",
        title: "Current Month Submissions",
        value: parseInt(data.currentMonthSubmissions) || 0,
        icon: UploadFileIcon,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        change: "+10%",
        changeType: "positive",
        description: "Submissions made this month in US",
        roles: ["SUPERADMIN", "ADMIN", "TEAMLEAD", "RECRUITER", "GRANDSALES"],
        suffix: "",
        navigateTo: "/dashboard/us-submissions/submissions-list",
      },
    ];

    if (
      data.totalPlacementsCurrentMonth !== null ||
      data.totalPlacementsOverall !== null
    ) {
      baseCards.push(
        {
          id: "totalPlacementsCurrentMonth",
          title: "This Month Placements",
          value: parseInt(data.totalPlacementsCurrentMonth) || 0,
          icon: CheckCircleIcon,
          color: theme.palette.success.dark,
          bgColor: alpha(theme.palette.success.dark, 0.1),
          change: "+25%",
          changeType: "positive",
          description: "Placements made this month in US",
          roles: [
            "SUPERADMIN",
            "ADMIN",
            "TEAMLEAD",
            "RECRUITER",
            "SALESEXECUTIVE",
            "GRANDSALES",
          ],
          suffix: "",
          navigateTo:
            "/dashboard/us-submissions/submissions-list?status=Placed",
        },
        {
          id: "totalPlacementsOverall",
          title: "Total Placements",
          value: parseInt(data.totalPlacementsOverall) || 0,
          icon: AssignmentTurnedInIcon,
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1),
          change: "+18%",
          changeType: "positive",
          description: "All-time US placements",
          roles: [
            "SUPERADMIN",
            "ADMIN",
            "TEAMLEAD",
            "RECRUITER",
            "SALESEXECUTIVE",
            "GRANDSALES",
          ],
          suffix: "",
          navigateTo:
            "/dashboard/us-submissions/submissions-list?status=Placed",
        }
      );
    }

    // Filter cards based on role and limit to 6
    return baseCards
      .filter((card) => !card.roles || card.roles.includes(userRole))
      .slice(0, 6);
  };

  const cardData = dashboardData ? getCardDataFromAPI(dashboardData) : [];

  const AnimatedNumber = ({ value, id, suffix = "" }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (animatedValues[id] !== undefined) {
        const targetValue = animatedValues[id];
        const duration = 1000;
        const steps = 60;
        const increment = targetValue / steps;
        let current = 0;
        let step = 0;

        const animate = () => {
          current += increment;
          step++;

          if (step >= steps) {
            setDisplayValue(targetValue);
          } else {
            setDisplayValue(Math.floor(current));
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }
    }, [animatedValues, id]);

    return (
      <span>
        {displayValue.toLocaleString()}
        {suffix}
      </span>
    );
  };

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getFilteredQuickActions = () => {
    return quickActions.filter(
      (action) =>
        action.roles.includes(userRole) &&
        (!action.entity || action.entity === userEntity)
    );
  };

  const renderStatsCard = (card, index) => {
    const IconComponent = card.icon;
    const isPositive = card.changeType === "positive";

    return (
      <Grid item xs={12} sm={6} md={4} lg={4} key={card.id}>
        <Grow in={cardsVisible} timeout={400 + index * 100}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: theme.palette.background.paper,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: `0 12px 24px ${alpha(card.color, 0.15)}`,
                borderColor: alpha(card.color, 0.3),
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${card.color}, ${alpha(
                  card.color,
                  0.7
                )})`,
                opacity: 0,
                transition: "opacity 0.3s ease",
              },
              "&:hover::before": {
                opacity: 1,
              },
            }}
            onClick={() => {
              if (card.navigateTo) {
                navigate(card.navigateTo);
              }
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Tooltip title={card.description} arrow>
                <Avatar
                  sx={{
                    bgcolor: card.bgColor,
                    color: card.color,
                    width: 48,
                    height: 48,
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <IconComponent />
                </Avatar>
              </Tooltip>
              <Chip
                label={card.change}
                size="small"
                icon={<TrendingUpIcon />}
                sx={{
                  backgroundColor: isPositive
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                  color: isPositive
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                }}
              />
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 1 }}
            >
              {card.title}
            </Typography>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: "auto" }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: "'Roboto Mono', monospace" }}
              >
                <AnimatedNumber
                  value={card.value}
                  id={card.id}
                  suffix={card.suffix || ""}
                />
              </Typography>
              <ChevronRightIcon
                sx={{
                  color: "text.secondary",
                  opacity: 0.5,
                  transition: "transform 0.3s ease",
                  ".MuiCard-root:hover &": {
                    transform: "translateX(4px)",
                    opacity: 1,
                  },
                }}
              />
            </Stack>
          </Card>
        </Grow>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 4,
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ mb: 3, color: currentRoleConfig.color }}
        />
        <Typography variant="h6" color="text.secondary">
          Loading dashboard data...
        </Typography>

        <LinearProgress
          sx={{
            width: "300px",
            mt: 2,
            borderRadius: 5,
            height: 6,
            backgroundColor: alpha(currentRoleConfig.color, 0.1),
            "& .MuiLinearProgress-bar": {
              backgroundColor: currentRoleConfig.color,
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 4,
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          currentRoleConfig.color,
          0.02
        )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      }}
    >
      {/* Header with Role Badge */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h4" fontWeight="bold">
                US Dashboard Overview
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh Dashboard">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  backgroundColor: alpha(currentRoleConfig.color, 0.1),
                  "&:hover": {
                    backgroundColor: alpha(currentRoleConfig.color, 0.2),
                  },
                }}
              >
                <RefreshIcon sx={{ color: currentRoleConfig.color }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardData && cardData.length > 0 ? (
          cardData.map((card, index) => renderStatsCard(card, index))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              No dashboard data available. Please check your connection or
              permissions.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Quick Actions */}
      {getFilteredQuickActions().length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Fade in timeout={800}>
              <Card
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <CardHeader
                  title="US Quick Actions"
                  subheader={`Frequently used actions for ${currentRoleConfig.name}`}
                  titleTypographyProps={{
                    sx: { color: currentRoleConfig.color },
                  }}
                  action={
                    dashboardData && (
                      <Typography variant="caption" color="text.secondary">
                        Live US Data
                      </Typography>
                    )
                  }
                />
                <Stack spacing={1}>
                  {getFilteredQuickActions().map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                      <Button
                        key={index}
                        fullWidth
                        variant="text"
                        onClick={() => handleQuickAction(action.path)}
                        startIcon={
                          <Avatar
                            sx={{
                              bgcolor: alpha(action.color, 0.1),
                              color: action.color,
                              width: 36,
                              height: 36,
                            }}
                          >
                            <IconComponent fontSize="small" />
                          </Avatar>
                        }
                        endIcon={<ChevronRightIcon />}
                        sx={{
                          justifyContent: "flex-start",
                          textAlign: "left",
                          p: 2,
                          borderRadius: 2,
                          textTransform: "none",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: alpha(action.color, 0.08),
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <Box sx={{ flexGrow: 1, ml: 2 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {action.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Stack>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      )}

      {/* Role-specific information */}
      {userRole === "RECRUITER" && (
        <Fade in timeout={1000}>
          <Alert severity="info" sx={{ mt: 3 }} icon={<PeopleIcon />}>
            <Typography variant="body2">
              <strong>US Recruiter Focus:</strong> You have access to{" "}
              {dashboardData?.totalHotlistExceptFullTime || "0"} consultants in
              the US hotlist. Focus on increasing your submission to interview
              conversion rate.
            </Typography>
          </Alert>
        </Fade>
      )}

      {userRole === "SALESEXECUTIVE" && (
        <Fade in timeout={1000}>
          <Alert severity="info" sx={{ mt: 3 }} icon={<BusinessIcon />}>
            <Typography variant="body2">
              <strong>US Sales Focus:</strong> There are{" "}
              {dashboardData?.currentMonthRequirements || "0"} active
              requirements this month. Focus on converting requirements to
              submissions and building client relationships.
            </Typography>
          </Alert>
        </Fade>
      )}

      {userRole === "TEAMLEAD" && (
        <Fade in timeout={1000}>
          <Alert severity="info" sx={{ mt: 3 }} icon={<PeopleIcon />}>
            <Typography variant="body2">
              <strong>US Team Lead Focus:</strong> Your team has made{" "}
              {dashboardData?.currentMonthSubmissions || "0"} submissions this
              month. Monitor team performance and provide guidance where needed.
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Footer Status */}
      <Fade in timeout={1000}>
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {dashboardData ? "Data fetched from US API" : "Waiting for data"} •
            Role: {currentRoleConfig.name} • Entity: {userEntity} • Last
            refresh: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default AdroitHome;
