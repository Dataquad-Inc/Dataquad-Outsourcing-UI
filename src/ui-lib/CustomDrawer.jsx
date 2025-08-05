import React from "react";
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const drawerWidths = {
  xs: 300,
  sm: 350,
  md: 750,
  lg: 750,
  xl: 750,
  sn: 100,
};

const CustomDrawer = ({
  open,
  onClose,
  anchor = "left",
  title = "Drawer Title",
  width = "sm", // 👈 expects 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  topOffset = 66,
  bottomOffset = 5,
  children,
}) => {
  const theme = useTheme();

  // Evaluate current breakpoint
  const isXl = useMediaQuery(theme.breakpoints.only("xl"));
  const isLg = useMediaQuery(theme.breakpoints.only("lg"));
  const isMd = useMediaQuery(theme.breakpoints.only("md"));
  const isSm = useMediaQuery(theme.breakpoints.only("sm"));
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));

  const getResponsiveWidth = () => {
    // If the width prop is a string like 'sm', return corresponding drawer width
    if (typeof width === "string" && drawerWidths[width]) {
      return drawerWidths[width];
    }
    // Fallback to xs if no match
    return drawerWidths.xs;
  };

  const getBorderRadius = () => {
    switch (anchor) {
      case "right":
        return { borderTopLeftRadius: 16, borderBottomLeftRadius: 16 };
      case "left":
        return { borderTopRightRadius: 16, borderBottomRightRadius: 16 };
      case "top":
        return { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 };
      case "bottom":
        return { borderTopLeftRadius: 16, borderTopRightRadius: 16 };
      default:
        return {};
    }
  };

  const isVertical = anchor === "top" || anchor === "bottom";
  const isHorizontal = anchor === "left" || anchor === "right";

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isHorizontal ? getResponsiveWidth() : "100%",
          height:
            isVertical || isHorizontal
              ? `calc(100% - ${topOffset + bottomOffset}px)`
              : "100%",
          marginTop: anchor === "top" ? `${topOffset}px` : 0,
          top: isHorizontal ? `${topOffset}px` : undefined,
          marginBottom: anchor === "bottom" ? `${bottomOffset}px` : 0,
          ...getBorderRadius(),
          padding: 2,
          overflow: "auto",
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ textAlign: "center", width: "100%" }}>
  {title}
</Typography>
        <Tooltip title="Close" arrow>
          <IconButton
            onClick={onClose}
            sx={{
              border: "1px solid rgba(0, 0, 0, 0.2)",
              borderRadius: "8px",
              padding: "4px",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <Box
        mt={2}
        sx={{
          maxHeight: `calc(100vh - ${topOffset + bottomOffset + 64}px)`,
          overflowY: "auto",
          pr: 1,
        }}
      >
        {children}
      </Box>
    </Drawer>
  );
};

export default CustomDrawer;
