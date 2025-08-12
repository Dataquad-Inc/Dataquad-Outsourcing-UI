import React, { useState, useMemo } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Stack,
  Drawer,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  NotificationsOutlined as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { useDispatch, useSelector } from "react-redux";
import { logoutAsync, setEntity } from "../redux/authSlice";
import logoOrg from "../assets/dashbaordLogo.svg";
import ApplyLeave from "../components/LeaveCalender/ApplyLeave";
import { useNavigate } from "react-router-dom";
import EntityToggle from "../utils/EntityToggle";

// Dark color palette for user avatars
const darkColorPalette = [
  "#1A237E",
  "#311B92",
  "#01579B",
  "#004D40",
  "#1B5E20",
  "#33691E",
  "#4A148C",
  "#880E4F",
  "#3E2723",
  "#263238",
  "#BF360C",
  "#827717",
];

const Header = ({
  handleDrawerToggle,
  isCollapsed,
  drawerWidth,
  collapsedWidth,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);

  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userId, userName, email, role, logInTimeStamp, entity } = useSelector(
    (state) => state.auth
  );

  // Generate a stable color for each user based on their userId
  const userColor = useMemo(() => {
    if (!userId) return darkColorPalette[0];
    const hashCode = String(userId)
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colorIndex = Math.abs(hashCode) % darkColorPalette.length;
    return darkColorPalette[colorIndex];
  }, [userId]);

  // Format login timestamp
  const formattedLoginTime = useMemo(() => {
    if (!logInTimeStamp) return "N/A";
    try {
      const formattedTimestamp = logInTimeStamp.split(".")[0];
      const utcDate = new Date(formattedTimestamp + "Z");

      if (isNaN(utcDate.getTime())) return "Invalid Date";

      return (
        <>
          {utcDate.toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })}{" "}
          -{" "}
          {utcDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}
        </>
      );
    } catch (error) {
      return "Error Parsing Date";
    }
  }, [logInTimeStamp]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleOpenLeaveDrawer = () => {
    setLeaveDrawerOpen(true);
    handleMenuClose();
  };

  const handleCloseLeaveDrawer = () => {
    setLeaveDrawerOpen(false);
  };

  const handleLogout = () => {
    dispatch(logoutAsync(userId));
    handleMenuClose();
  };

  const handleEntityToggle = (event) => {
    const newEntity = event.target.checked ? "US" : "IN";
    if (role === "SUPERADMIN") {
      dispatch(setEntity(newEntity));

      // Redirect based on newEntity value
      if (newEntity === "IN") {
        navigate("/dashboard/home", { replace: true });
      } else if (newEntity === "US") {
        navigate("/dashboard/us-home", { replace: true });
      }
    }
  };

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchor);

  const menuId = "primary-account-menu";
  const notificationsId = "notifications-menu";

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          width: 200,
          borderRadius: 2,
          overflow: "visible",
          filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.15))",
          "&:before": {
            content: '""',
            display: "block",
            position: "absolute",
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: "background.paper",
            transform: "translateY(-50%) rotate(45deg)",
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          ID: {userId || "N/A"}
        </Typography>
      </Box>

      <Divider />
      <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
        <AccountIcon sx={{ mr: 2 }} /> Profile
      </MenuItem>
      <MenuItem onClick={handleOpenLeaveDrawer} sx={{ py: 1.5 }}>
        <EventAvailableIcon sx={{ mr: 2 }} /> Apply Leave
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <LogoutIcon sx={{ mr: 2 }} /> Logout
      </MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = (
    <Menu
      anchorEl={notificationsAnchor}
      id={notificationsId}
      keepMounted
      open={isNotificationsOpen}
      onClose={handleNotificationsClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          width: 320,
          maxHeight: 400,
          borderRadius: 2,
          overflow: "visible",
          filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.15))",
          "&:before": {
            content: '""',
            display: "block",
            position: "absolute",
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: "background.paper",
            transform: "translateY(-50%) rotate(45deg)",
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Notifications
        </Typography>
      </Box>
      <MenuItem onClick={handleNotificationsClose} sx={{ py: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            New submission received
          </Typography>
          <Typography variant="caption" color="text.secondary">
            5 minutes ago
          </Typography>
        </Box>
      </MenuItem>
      <MenuItem onClick={handleNotificationsClose} sx={{ py: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            Interview scheduled
          </Typography>
          <Typography variant="caption" color="text.secondary">
            1 hour ago
          </Typography>
        </Box>
      </MenuItem>
      <Divider />
      <Box sx={{ p: 1, textAlign: "center" }}>
        <Typography variant="body2" color="primary">
          View all notifications
        </Typography>
      </Box>
    </Menu>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width:"100%",
          ml: { sm: `${isCollapsed ? collapsedWidth : drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
          background: theme.palette.background.default,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo on the left side */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: "none" }, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              component="img"
              src={logoOrg}
              alt="Company Logo"
              sx={{ height: 50, width: 160 }}
            />
          </Box>

          {/* User details and actions on the right side */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                p: 1,
                borderRadius: 2,
                flexWrap: "wrap",
                mr: 2,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  USER ID: {userId || "N/A"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.65rem", md: "0.95rem" },
                    color: "primary.main",
                    fontWeight: "200",
                  }}
                >
                  Logged in at: {formattedLoginTime}
                </Typography>
              </Box>
            </Stack>

            {role === "SUPERADMIN" && (
              <EntityToggle
                role={role}
                entity={entity}
                handleEntityToggle={handleEntityToggle}
              />
            )}

            {/* Notifications IconButton */}
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationsOpen}
              aria-controls={notificationsId}
              aria-haspopup="true"
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* User Avatar IconButton */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: userColor,
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {renderMenu}
      {renderNotificationsMenu}

      {/* Leave Application Drawer */}
      <Drawer
        anchor="right"
        open={leaveDrawerOpen}
        onClose={handleCloseLeaveDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", md: "40%" },
            boxSizing: "border-box",
            borderRadius: 3,
          },
        }}
      >
        <Box sx={{ p: 3, pt: 8 }}>
          <ApplyLeave onCancel={handleCloseLeaveDrawer} />
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
