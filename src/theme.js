import { createTheme } from "@mui/material/styles";

// Define custom breakpoints for better responsive control
const customBreakpoints = {
  values: {
    xs: 0, // Mobile portrait
    sm: 600, // Mobile landscape / Small tablet
    md: 900, // Tablet
    lg: 1200, // Desktop
    xl: 1536, // Large desktop
  },
};

// Responsive typography that scales with screen size
const responsiveTypography = {
  fontFamily: `'Space Grotesk', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
  h1: {
    fontWeight: 700,
    fontSize: "2.5rem",
    "@media (max-width:600px)": {
      fontSize: "2rem",
    },
    "@media (max-width:480px)": {
      fontSize: "1.75rem",
    },
  },
  h2: {
    fontWeight: 600,
    fontSize: "2rem",
    "@media (max-width:600px)": {
      fontSize: "1.75rem",
    },
    "@media (max-width:480px)": {
      fontSize: "1.5rem",
    },
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.75rem",
    "@media (max-width:600px)": {
      fontSize: "1.5rem",
    },
    "@media (max-width:480px)": {
      fontSize: "1.25rem",
    },
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.5rem",
    "@media (max-width:600px)": {
      fontSize: "1.25rem",
    },
    "@media (max-width:480px)": {
      fontSize: "1.125rem",
    },
  },
  h5: {
    fontWeight: 600,
    fontSize: "1.25rem",
    "@media (max-width:600px)": {
      fontSize: "1.125rem",
    },
    "@media (max-width:480px)": {
      fontSize: "1rem",
    },
  },
  h6: {
    fontWeight: 600,
    fontSize: "1.125rem",
    "@media (max-width:600px)": {
      fontSize: "1rem",
    },
    "@media (max-width:480px)": {
      fontSize: "0.875rem",
    },
  },
  body1: {
    fontWeight: 400,
    fontSize: "1rem",
    "@media (max-width:600px)": {
      fontSize: "0.9rem",
    },
  },
  body2: {
    fontWeight: 400,
    fontSize: "0.875rem",
    "@media (max-width:600px)": {
      fontSize: "0.8rem",
    },
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    "@media (max-width:600px)": {
      fontSize: "0.8rem",
    },
  },
  caption: {
    fontSize: "0.75rem",
    "@media (max-width:600px)": {
      fontSize: "0.7rem",
    },
  },
};

// Common responsive component styles
const getCommonComponents = (theme) => ({
  MuiContainer: {
    styleOverrides: {
      root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        [theme.breakpoints.up("sm")]: {
          paddingLeft: theme.spacing(3),
          paddingRight: theme.spacing(3),
        },
        [theme.breakpoints.up("md")]: {
          paddingLeft: theme.spacing(4),
          paddingRight: theme.spacing(4),
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        elevation: 4,
        height: "64px",
        [theme.breakpoints.down("sm")]: {
          height: "56px",
        },
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: "64px !important",
        padding: `0 ${theme.spacing(2)}`,
        [theme.breakpoints.down("sm")]: {
          minHeight: "56px !important",
          padding: `0 ${theme.spacing(1)}`,
        },
      },
    },
  },
  // MuiDrawer: {
  //   styleOverrides: {
  //     paper: {
  //       borderRight: "none",
  //       width: "280px",
  //       [theme.breakpoints.down("md")]: {
  //         width: "260px",
  //       },
  //       [theme.breakpoints.down("sm")]: {
  //         width: "100%",
  //         maxWidth: "300px",
  //       },
  //     },
  //   },
  // },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: "none",
        fontWeight: 600,
        padding: "8px 16px",
        minHeight: "40px",
        [theme.breakpoints.down("sm")]: {
          padding: "6px 12px",
          minHeight: "36px",
          fontSize: "0.8rem",
        },
      },
      small: {
        padding: "4px 8px",
        minHeight: "32px",
        fontSize: "0.75rem",
      },
      large: {
        padding: "12px 24px",
        minHeight: "48px",
        fontSize: "1rem",
        [theme.breakpoints.down("sm")]: {
          padding: "10px 20px",
          minHeight: "44px",
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        padding: theme.spacing(1),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(0.75),
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        [theme.breakpoints.down("sm")]: {
          borderRadius: 8,
          margin: theme.spacing(1),
        },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: theme.spacing(3),
        [theme.breakpoints.down("md")]: {
          padding: theme.spacing(2),
        },
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1.5),
        },
        "&:last-child": {
          paddingBottom: theme.spacing(3),
          [theme.breakpoints.down("md")]: {
            paddingBottom: theme.spacing(2),
          },
          [theme.breakpoints.down("sm")]: {
            paddingBottom: theme.spacing(1.5),
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        margin: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
          margin: theme.spacing(1),
          borderRadius: 8,
          width: "100%",
          maxWidth: "calc(100% - 16px)",
        },
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: theme.spacing(3),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(2),
        },
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: theme.spacing(3),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(2),
        },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: theme.spacing(2, 3, 3),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1, 2, 2),
          flexDirection: "column",
          gap: theme.spacing(1),
          "& > :not(:first-of-type)": {
            marginLeft: 0,
          },
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          [theme.breakpoints.down("sm")]: {
            fontSize: "0.9rem",
          },
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.9rem",
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.75rem",
          height: "28px",
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down("sm")]: {
          minHeight: "40px",
        },
      },
      scrollButtons: {
        [theme.breakpoints.down("sm")]: {
          width: "32px",
        },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: 600,
        minHeight: "48px",
        [theme.breakpoints.down("sm")]: {
          minHeight: "40px",
          fontSize: "0.8rem",
          padding: "6px 12px",
          minWidth: "64px",
        },
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down("md")]: {
          overflowX: "auto",
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down("sm")]: {
          padding: "8px 4px",
          fontSize: "0.8rem",
        },
      },
      head: {
        fontWeight: 600,
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.75rem",
        },
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        [theme.breakpoints.down("sm")]: {
          paddingTop: theme.spacing(0.75),
          paddingBottom: theme.spacing(0.75),
        },
      },
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: {
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.9rem",
        },
      },
      secondary: {
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.8rem",
        },
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: "8px !important",
        marginBottom: theme.spacing(1),
        "&:before": {
          display: "none",
        },
        [theme.breakpoints.down("sm")]: {
          borderRadius: "6px !important",
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        padding: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1.5),
        },
      },
      content: {
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.9rem",
        },
      },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        padding: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1.5),
        },
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        height: "64px",
        [theme.breakpoints.down("sm")]: {
          height: "56px",
        },
      },
    },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        minWidth: "64px",
        [theme.breakpoints.down("sm")]: {
          minWidth: "48px",
          fontSize: "0.75rem",
        },
      },
    },
  },
  MuiSpeedDial: {
    styleOverrides: {
      root: {
        position: "fixed",
        bottom: theme.spacing(3),
        right: theme.spacing(3),
        [theme.breakpoints.down("sm")]: {
          bottom: theme.spacing(2),
          right: theme.spacing(2),
        },
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down("sm")]: {
          left: theme.spacing(1),
          right: theme.spacing(1),
          bottom: theme.spacing(1),
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.85rem",
          borderRadius: 6,
        },
      },
    },
  },
  MuiStepper: {
    styleOverrides: {
      root: {
        padding: theme.spacing(3, 0),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(2, 0),
        },
      },
    },
  },
  MuiStepLabel: {
    styleOverrides: {
      label: {
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.8rem",
        },
      },
    },
  },
  MuiPagination: {
    styleOverrides: {
      root: {
        "& .MuiPaginationItem-root": {
          [theme.breakpoints.down("sm")]: {
            fontSize: "0.8rem",
            minWidth: "28px",
            height: "28px",
          },
        },
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down("sm")]: {
          width: "32px",
          height: "32px",
          fontSize: "0.9rem",
        },
      },
      large: {
        width: "56px",
        height: "56px",
        [theme.breakpoints.down("sm")]: {
          width: "48px",
          height: "48px",
        },
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        [theme.breakpoints.down("sm")]: {
          fontSize: "0.65rem",
          minWidth: "16px",
          height: "16px",
        },
      },
    },
  },
});

// Light theme configuration
const lightTheme = createTheme({
  breakpoints: customBreakpoints,
  palette: {
    mode: "light",
    primary: {
      main: "#FF6500", // brand orange
      light: "#FF8533",
      dark: "#CC5200",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#FFA366", // softer orange accent
      light: "#FFB380",
      dark: "#E67E22",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#fbf2edff", // soft warm background
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F1F1F", // dark text for readability
      secondary: "#5C5C5C", // muted gray for secondary text
    },
    divider: "#FFE0CC", // light orange divider
    action: {
      selected: "rgba(255, 101, 0, 0.12)",
      hover: "rgba(255, 101, 0, 0.08)",
      focus: "rgba(255, 101, 0, 0.16)",
      activatedOpacity: 0.16,
    },
  },
  typography: responsiveTypography,
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FF6500",
          color: "#FFFFFF",
          boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2)",
          elevation: 4,
          height: "64px",
          "@media (max-width:600px)": {
            height: "56px",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
        },
        containedPrimary: {
          backgroundColor: "#FF6500",
          "&:hover": {
            backgroundColor: "#E65C00",
          },
        },
      },
    },
  },
});


// Apply common components to light theme
lightTheme.components = {
  ...lightTheme.components,
  ...getCommonComponents(lightTheme),
};

// Helper function to get responsive spacing based on screen size
export const getResponsiveSpacing = (theme) => ({
  xs: theme.spacing(1),
  sm: theme.spacing(2),
  md: theme.spacing(3),
  lg: theme.spacing(4),
  xl: theme.spacing(5),
});

// Helper function for responsive font sizes
export const getResponsiveFontSize = (base, sm = null, xs = null) => ({
  fontSize: base,
  "@media (max-width:600px)": {
    fontSize: sm || `calc(${base} * 0.9)`,
  },
  "@media (max-width:480px)": {
    fontSize: xs || `calc(${base} * 0.8)`,
  },
});

// Export responsive breakpoint helpers
export const useResponsiveBreakpoints = () => ({
  isMobile: "(max-width:600px)",
  isTablet: "(min-width:601px) and (max-width:900px)",
  isDesktop: "(min-width:901px)",
  isSmallScreen: "(max-width:900px)",
  isLargeScreen: "(min-width:1200px)",
});

export default lightTheme;
