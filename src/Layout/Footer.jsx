import React from "react";
import { Box, Container, Typography, Link, Stack, useTheme } from "@mui/material";
import { GitHub, LinkedIn, Twitter } from "@mui/icons-material";

const Footer = ({
  year = new Date().getFullYear(),
  companyName = "Adroit Innovative Solutions",
  links = [
    { text: "Privacy", href: "#" },
    { text: "Terms", href: "#" },
    { text: "Contact", href: "#" },
  ],
}) => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {year} {companyName}. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            {links.map((l) => (
              <Link
                key={l.text}
                href={l.href}
                underline="hover"
                variant="caption"
                color="text.secondary"
              >
                {l.text}
              </Link>
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Link href="#" aria-label="Twitter" color="inherit" underline="none">
              <Twitter fontSize="small" />
            </Link>
            <Link href="#" aria-label="GitHub" color="inherit" underline="none">
              <GitHub fontSize="small" />
            </Link>
            <Link href="#" aria-label="LinkedIn" color="inherit" underline="none">
              <LinkedIn fontSize="small" />
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
