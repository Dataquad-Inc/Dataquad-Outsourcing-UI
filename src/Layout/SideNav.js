import React, { useState, useEffect } from "react";
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
  Collapse,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { logoutAsync } from "../redux/authSlice";
import { inNavItems } from "../routes/navItems";
import { usNavItems } from "../routes/UsNavItems";

const drawerWidth = 240;
const collapsedWidth = 65;

const HEADER_HEIGHT = 64;
const FOOTER_HEIGHT = 50;

const SideNav = ({ handleDrawerToggle, isCollapsed, isMobile }) => {
  const location = useLocation();
  const theme = useTheme();
  const dispatch = useDispatch();

  const { userId, role, entity, userName } = useSelector((state) => state.auth);

  // Track which parent items are expanded (keyed by item.path)
  const [expandedItems, setExpandedItems] = useState({});

  const handleLogout = () => {
    dispatch(logoutAsync(userId));
  };

  let combinedNavItems = [];
  if (entity === "US") {
    combinedNavItems = usNavItems(role);
  } else if (entity === "IN") {
    combinedNavItems = [...inNavItems];
  }

  const filteredNavItems = combinedNavItems.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.entities && !item.entities.includes(entity)) return false;
    return true;
  });

  // Auto-expand parent if a child route is currently active
  useEffect(() => {
    const newExpanded = {};
    filteredNavItems.forEach((item) => {
      if (item.children) {
        const childActive = item.children.some((child) =>
          location.pathname.includes(child.path)
        );
        if (childActive) {
          newExpanded[item.path] = true;
        }
      }
    });
    setExpandedItems((prev) => ({ ...prev, ...newExpanded }));
  }, [location.pathname]); // eslint-disable-line

  const isItemActive = (itemPath) =>
    location.pathname === itemPath ||
    location.pathname.startsWith(itemPath + "/");

  const isChildActive = (item) =>
    item.children?.some((child) => isItemActive(child.path));

  const handleParentClick = (item) => {
    if (item.children) {
      if (isCollapsed) {
        // In collapsed mode just navigate to default child (first child)
        return;
      }
      setExpandedItems((prev) => ({
        ...prev,
        [item.path]: !prev[item.path],
      }));
    }
  };

  // ── Renders a single nav button (used for both parents and children) ────────
  const renderNavButton = (item, isChild = false) => {
    const active = isItemActive(item.path);
    const hasChildren = !!item.children;
    const childrenActive = hasChildren && isChildActive(item);
    const isExpanded = expandedItems[item.path];

    const highlighted = active || childrenActive;

    return (
      <ListItemButton
        component={hasChildren ? "div" : Link}
        to={hasChildren ? undefined : item.path}
        onClick={hasChildren ? () => handleParentClick(item) : undefined}
        sx={{
          minHeight: isChild ? 34 : 38,
          justifyContent: isCollapsed ? "center" : "flex-start",
          px: isCollapsed ? 2 : isChild ? 3 : 2.5,
          borderRadius: "5px",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          background: highlighted
            ? `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                isChild ? 0.1 : 0.15
              )} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`
            : "transparent",
          border: highlighted
            ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            : "1px solid transparent",
          color: highlighted
            ? theme.palette.primary.main
            : theme.palette.text.primary,
          "&::before": highlighted
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
                boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            : {},
          "&:hover": {
            background: highlighted
              ? `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.2
                )} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
              : alpha(theme.palette.action.hover, 0.08),
            transform: "translateX(2px)",
            border: `1px solid ${alpha(
              theme.palette.primary.main,
              highlighted ? 0.3 : 0.1
            )}`,
            borderLeft: `7px solid ${theme.palette.primary.main}`,
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Icon */}
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isCollapsed ? 0 : 3,
            justifyContent: "center",
            color: highlighted
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            "& svg": {
              fontSize: isChild ? 18 : 22,
              filter: highlighted
                ? `drop-shadow(0 0 4px ${alpha(theme.palette.primary.main, 0.4)})`
                : "none",
            },
            transition: "all 0.3s ease",
          }}
        >
          {item.icon}
        </ListItemIcon>

        {/* Label */}
        <Fade in={!isCollapsed} timeout={200}>
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontWeight: highlighted ? 600 : 500,
              fontSize: isChild ? "0.82rem" : "0.9rem",
              color: highlighted
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

        {/* Expand/collapse arrow for parents with children */}
        {hasChildren && !isCollapsed && (
          <Box
            sx={{
              color: highlighted
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
              display: "flex",
              alignItems: "center",
              transition: "transform 0.2s ease",
              transform: isExpanded ? "rotate(0deg)" : "rotate(0deg)",
            }}
          >
            {isExpanded ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </Box>
        )}
      </ListItemButton>
    );
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
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
                  Menu
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

      {/* User Info */}
      {!isCollapsed && (
        <Fade in={!isCollapsed} timeout={400}>
          <Box
            sx={{
              px: 3,
              py: 2,
              background: alpha(theme.palette.primary.main, 0.03),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
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

      {/* Nav Items */}
      <List
        sx={{
          flexGrow: 1,
          pt: 1,
          pb: 2,
          px: isCollapsed ? 1 : 2,
          overflow: "hidden",
          "&:hover": {
            overflow: "auto",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
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
        {filteredNavItems.map((item) => {
          const hasChildren = !!item.children;
          const isExpanded = expandedItems[item.path];

          // Filter children by role
          const visibleChildren = hasChildren
            ? item.children.filter(
                (child) => !child.roles || child.roles.includes(role)
              )
            : [];

          return (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
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
                  <Box sx={{ width: "100%" }}>
                    {renderNavButton(item, false)}
                  </Box>
                </Tooltip>
              </ListItem>

              {/* Children (sub-items) — only shown when expanded and not collapsed sidebar */}
              {hasChildren && !isCollapsed && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, mb: 0.5 }}>
                    {/* Vertical connector line */}
                    <Box
                      sx={{
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 16,
                          top: 0,
                          bottom: 0,
                          width: 1.5,
                          background: alpha(theme.palette.primary.main, 0.2),
                          borderRadius: 1,
                        },
                      }}
                    >
                      {visibleChildren.map((child) => (
                        <ListItem
                          key={child.text}
                          disablePadding
                          sx={{ mb: 0.25, pl: 1 }}
                        >
                          <Box sx={{ width: "100%" }}>
                            {renderNavButton(child, true)}
                          </Box>
                        </ListItem>
                      ))}
                    </Box>
                  </List>
                </Collapse>
              )}

              {/* In collapsed mode: show children as tooltips on hover (via wrapping in a Tooltip each) */}
              {hasChildren && isCollapsed && (
                <List disablePadding>
                  {visibleChildren.map((child) => (
                    <ListItem key={child.text} disablePadding sx={{ mb: 0.25 }}>
                      <Tooltip
                        title={child.text}
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
                        <Box sx={{ width: "100%" }}>
                          {renderNavButton(child, true)}
                        </Box>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
              )}
            </React.Fragment>
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

      {/* Logout */}
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
          height: `calc(100vh - ${HEADER_HEIGHT + FOOTER_HEIGHT}px)`,
          top: HEADER_HEIGHT,
          bottom: FOOTER_HEIGHT,
          position: "fixed",
          overflowY: "auto",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SideNav;