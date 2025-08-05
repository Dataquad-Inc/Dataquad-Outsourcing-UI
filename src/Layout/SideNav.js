import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useTheme,
  Typography,
  IconButton,
  alpha,
  Fade,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { logoutAsync } from "../redux/authSlice";
import { inNavItems } from "../routes/navItems";
import { usNavItems } from "../routes/UsNavItems";

const drawerWidth = 240;
const collapsedWidth = 72;

const SideNav = ({ handleDrawerToggle, isCollapsed, isMobile }) => {
  const location = useLocation();
  const theme = useTheme();
  const dispatch = useDispatch();

  const { userId, role, entity, userName } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutAsync(userId));
  };

  // Choose nav items based on entity only
  let combinedNavItems = [];
  if (entity === "US") {
    combinedNavItems = [...usNavItems];
  } else if (entity === "IN") {
    combinedNavItems = [...inNavItems];
  }

  // Filter by role and optional explicit entity restriction per item
  const filteredNavItems = combinedNavItems.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.entities && !item.entities.includes(entity)) return false;
    return true;
  });

  const isItemActive = (itemPath) => {
    return (
      location.pathname === itemPath ||
      location.pathname.startsWith(itemPath + "/")
    );
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header Section */}
      <Box
        sx={{
          height: 86,
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          px: isCollapsed ? 1 : 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <Fade in={!isCollapsed} timeout={300}>
          <Box sx={{ display: "flex", alignItems: "center", zIndex: 1 }}>
            {!isCollapsed && (
              <>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <DashboardIcon
                    sx={{
                      color: theme.palette.primary.contrastText,
                      fontSize: 24,
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.contrastText,
                    fontSize: "1.1rem",
                    letterSpacing: "0.5px",
                  }}
                >
                  Dashboard
                </Typography>
              </>
            )}
          </Box>
        </Fade>

        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: theme.palette.primary.contrastText,
            zIndex: 1,
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: alpha(theme.palette.primary.contrastText, 0.1),
            border: `1px solid ${alpha(
              theme.palette.primary.contrastText,
              0.2
            )}`,
            "&:hover": {
              background: alpha(theme.palette.primary.contrastText, 0.2),
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* User Info Section */}
      {!isCollapsed && (
        <Fade in={!isCollapsed} timeout={400}>
          <Box
            sx={{
              px: 3,
              py: 2,
              background: alpha(theme.palette.primary.main, 0.03),
              borderBottom: `1px solid ${alpha(
                theme.palette.primary.main,
                0.1
              )}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 2,
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "white",
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: "0.9rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userName || "User"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                  }}
                >
                  {role || "Member"} • {entity || "Global"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      <Divider
        sx={{
          borderColor: alpha(theme.palette.primary.main, 0.1),
          mx: isCollapsed ? 1 : 2,
          my: 1,
        }}
      />

      {/* Navigation Items */}
      <List
        sx={{
          flexGrow: 1,
          pt: 1,
          pb: 2,
          px: isCollapsed ? 1 : 2,
          overflow: "hidden",
          "&:hover": {
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(theme.palette.primary.main, 0.3),
              borderRadius: "2px",
              "&:hover": {
                background: alpha(theme.palette.primary.main, 0.5),
              },
            },
          },
        }}
      >
        {filteredNavItems.map((item, index) => {
          const active = isItemActive(item.path);

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={isCollapsed ? item.text : ""}
                placement="right"
                arrow
                PopperProps={{
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: theme.palette.grey[800],
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    },
                    "& .MuiTooltip-arrow": {
                      color: theme.palette.grey[800],
                    },
                  },
                }}
              >
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 38,
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    px: isCollapsed ? 2 : 2.5,
                    borderRadius: "5px",
                    position: "relative",
                    overflow: "hidden",
                    background: active
                      ? `linear-gradient(135deg, ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
                      : "transparent",
                    border: active
                      ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      : "1px solid transparent",

                    color: active
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    "&::before": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: "60%",
                          background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                          borderRadius: "0 2px 2px 0",
                          boxShadow: `0 0 8px ${alpha(
                            theme.palette.primary.main,
                            0.4
                          )}`,
                        }
                      : {},
                    "&:hover": {
                      background: active
                        ? `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.2
                          )} 0%, ${alpha(
                            theme.palette.primary.main,
                            0.12
                          )} 100%)`
                        : alpha(theme.palette.action.hover, 0.08),
                      transform: "translateX(2px)",
                      border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        active ? 0.3 : 0.1
                      )}`,
                      borderLeft: `7px solid ${theme.palette.primary.main}`,
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isCollapsed ? 0 : 3,
                      justifyContent: "center",
                      color: active
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      "& svg": {
                        fontSize: 22,
                        filter: active
                          ? `drop-shadow(0 0 4px ${alpha(
                              theme.palette.primary.main,
                              0.4
                            )})`
                          : "none",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <Fade in={!isCollapsed} timeout={200}>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: "0.9rem",
                        color: active
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                        letterSpacing: "0.2px",
                      }}
                      sx={{
                        opacity: isCollapsed ? 0 : 1,
                        transition: "opacity 0.2s ease",
                      }}
                    />
                  </Fade>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider
        sx={{
          borderColor: alpha(theme.palette.primary.main, 0.1),
          mx: isCollapsed ? 1 : 2,
          mb: 1,
        }}
      />

      {/* Logout Button */}
      <Box sx={{ p: isCollapsed ? 1 : 2 }}>
        <Tooltip title={isCollapsed ? "Logout" : ""} placement="right" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              justifyContent: isCollapsed ? "center" : "flex-start",
              px: isCollapsed ? 2 : 2.5,
              borderRadius: "5px",
              color: theme.palette.error.main,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,

              background: alpha(theme.palette.error.main, 0.04),
              "&:hover": {
                background: alpha(theme.palette.error.main, 0.08),
                transform: "translateY(-1px)",
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
              },
              transition: "all 0.3s ease",
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isCollapsed ? 0 : 3,
                justifyContent: "center",
                color: theme.palette.error.main,
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <Fade in={!isCollapsed} timeout={200}>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: theme.palette.error.main,
                }}
                sx={{
                  opacity: isCollapsed ? 0 : 1,
                  transition: "opacity 0.2s ease",
                }}
              />
            </Fade>
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? "open" : true}
      onClose={isMobile ? handleDrawerToggle : undefined}
      sx={{
        width: isCollapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: isCollapsed ? collapsedWidth : drawerWidth,
          boxSizing: "border-box",
          border: "none",
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0 0 20px rgba(0,0,0,0.1)",
          transition: theme.transitions.create(["width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SideNav;
