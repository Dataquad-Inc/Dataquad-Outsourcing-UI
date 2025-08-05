import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  useTheme,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  Fade,
  Grow,
  alpha,
} from "@mui/material";
import {
  Group as GroupIcon,
  Business as BusinessIcon,
  UploadFile as UploadFileIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  PersonSearch as PersonSearchIcon,
  Diversity3 as Diversity3Icon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  RateReview as RateReviewIcon,
} from "@mui/icons-material";

const AdroitHome = () => {
  const theme = useTheme();
  const [animatedValues, setAnimatedValues] = useState({});
  const [cardsVisible, setCardsVisible] = useState(false);

  const cardData = [
    {
      id: "candidates",
      title: "Total Candidates",
      value: 1204,
      icon: GroupIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      change: "+12%",
      changeType: "positive",
    },
    {
      id: "submissions",
      title: "Active Submissions",
      value: 853,
      icon: UploadFileIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
      change: "+8%",
      changeType: "positive",
    },
    {
      id: "interviews",
      title: "Interviews Scheduled",
      value: 125,
      icon: EventAvailableIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      change: "+15%",
      changeType: "positive",
    },
    {
      id: "offers",
      title: "Offers Released",
      value: 57,
      icon: CheckCircleIcon,
      color: theme.palette.success.dark,
      bgColor: alpha(theme.palette.success.dark, 0.1),
      change: "+22%",
      changeType: "positive",
    },
    {
      id: "requirements",
      title: "Client Requirements",
      value: 42,
      icon: BusinessIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      change: "+5%",
      changeType: "positive",
    },
    {
      id: "bench",
      title: "Bench Candidates",
      value: 18,
      icon: Diversity3Icon,
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.1),
      change: "-3%",
      changeType: "negative",
    },
    {
      id: "screenings",
      title: "Screenings Pending",
      value: 37,
      icon: PersonSearchIcon,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
      change: "+7%",
      changeType: "positive",
    },
    {
      id: "placements",
      title: "Successful Placements",
      value: 89,
      icon: EmojiEventsIcon,
      color: "#ff9800",
      bgColor: alpha("#ff9800", 0.1),
      change: "+18%",
      changeType: "positive",
    },
  ];

  const quickActions = [
    { title: "Post New Job", icon: AddIcon, color: theme.palette.primary.main },
    {
      title: "Schedule Interview",
      icon: ScheduleIcon,
      color: theme.palette.success.main,
    },
    {
      title: "Review Applications",
      icon: RateReviewIcon,
      color: theme.palette.secondary.main,
    },
    {
      title: "Send Offers",
      icon: CheckCircleIcon,
      color: theme.palette.success.dark,
    },
  ];

  const recentActivities = [
    {
      action: "New application received",
      candidate: "Sarah Johnson",
      position: "Senior Developer",
      time: "2 minutes ago",
      type: "application",
      color: theme.palette.primary.main,
    },
    {
      action: "Interview scheduled",
      candidate: "Michael Chen",
      position: "Product Manager",
      time: "1 hour ago",
      type: "interview",
      color: theme.palette.success.main,
    },
    {
      action: "Offer accepted",
      candidate: "Emma Davis",
      position: "UX Designer",
      time: "3 hours ago",
      type: "offer",
      color: theme.palette.success.dark,
    },
    {
      action: "Screening completed",
      candidate: "Robert Wilson",
      position: "Data Analyst",
      time: "5 hours ago",
      type: "screening",
      color: theme.palette.info.main,
    },
  ];

  useEffect(() => {
    setCardsVisible(true);
    const timer = setTimeout(() => {
      const values = {};
      cardData.forEach((card) => {
        values[card.id] = card.value;
      });
      setAnimatedValues(values);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const AnimatedNumber = ({ value, id }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (animatedValues[id]) {
        const increment = animatedValues[id] / 40;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= animatedValues[id]) {
            setDisplayValue(animatedValues[id]);
            clearInterval(timer);
          } else {
            setDisplayValue(Math.floor(current));
          }
        }, 40);
        return () => clearInterval(timer);
      }
    }, [animatedValues, id]);

    return <span>{displayValue.toLocaleString()}</span>;
  };

  return (
    <Box
      sx={{
        p: 4,
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.02
        )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      }}
    >
      {/* Header */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  mb: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Recruiting Portal
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Welcome back! Here's your recruitment overview
              </Typography>
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.success.main,
                    width: 40,
                    height: 40,
                  }}
                >
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Overall Performance
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="success.main"
                  >
                    +14.2%
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardData.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
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
                      background: `linear-gradient(90deg, ${
                        card.color
                      }, ${alpha(card.color, 0.7)})`,
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                    },
                    "&:hover::before": {
                      opacity: 1,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    sx={{ mb: 2 }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: card.bgColor,
                        color: card.color,
                        width: 48,
                        height: 48,
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <IconComponent />
                    </Avatar>
                    <Chip
                      label={card.change}
                      size="small"
                      sx={{
                        backgroundColor:
                          card.changeType === "positive"
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                        color:
                          card.changeType === "positive"
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                        fontWeight: "bold",
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {card.title}
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      <AnimatedNumber value={card.value} id={card.id} />
                    </Typography>
                    <ChevronRightIcon
                      sx={{ color: "text.secondary", opacity: 0.5 }}
                    />
                  </Stack>
                </Card>
              </Grow>
            </Grid>
          );
        })}
      </Grid>

      {/* Quick Actions and Recent Activity */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Fade in timeout={800}>
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: "fit-content",
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={index}
                      fullWidth
                      variant="text"
                      startIcon={
                        <Avatar
                          sx={{
                            bgcolor: alpha(action.color, 0.1),
                            color: action.color,
                            width: 32,
                            height: 32,
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
                        "&:hover": {
                          backgroundColor: alpha(action.color, 0.04),
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{ flexGrow: 1, ml: 2 }}
                      >
                        {action.title}
                      </Typography>
                    </Button>
                  );
                })}
              </Stack>
            </Card>
          </Fade>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <Fade in timeout={1000}>
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Activity
              </Typography>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        backgroundColor: alpha(activity.color, 0.04),
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: alpha(activity.color, 0.1),
                          color: activity.color,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {activity.type === "application" && (
                          <UploadFileIcon fontSize="small" />
                        )}
                        {activity.type === "interview" && (
                          <EventAvailableIcon fontSize="small" />
                        )}
                        {activity.type === "offer" && (
                          <CheckCircleIcon fontSize="small" />
                        )}
                        {activity.type === "screening" && (
                          <PersonSearchIcon fontSize="small" />
                        )}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {activity.action}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {activity.candidate} • {activity.position}
                        </Typography>
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdroitHome;
