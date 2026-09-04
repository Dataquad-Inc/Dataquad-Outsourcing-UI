import React from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";

const Footer = ({
  year = new Date().getFullYear(),
  companyName = "Adroit Innovative Solutions",
}) => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {year} {companyName}. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
