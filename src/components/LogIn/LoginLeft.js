import React from "react";
import { Box, useTheme, Typography } from "@mui/material";
import logo from "../../assets/Mulyafinalnew-Copy.svg";

const LoginLeft= () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(246,245,245,0.8)",
        textAlign: "center",
        overflow: "hidden",
        borderRadius: 4,
        px: 2,
      }}
    >
      {/* Logo Section */}
      <Box sx={{ mb: 2, width: "100%", maxWidth: 550 }}>
        <Box
          component="img"
          src={logo}
          alt="Logo"
          sx={{
            width: {
              xs: "50%", // mobile
              sm: "40%", // small tablets
              md: "100%", // medium+
              lg: "100%", // large screens
            },
            height: "auto",
            objectFit: "contain",
            mx: "auto",
            display: "block",
          }}
        />
      </Box>

      {/* Footer - Powered By */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.85rem",
          }}
        >
          Powered by{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              color: theme.palette.primary.main,
            }}
          >
            Adroit Innovative Solutions
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginLeft;
