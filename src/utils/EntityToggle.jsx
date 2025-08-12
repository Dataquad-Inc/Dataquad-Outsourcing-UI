import { useTheme, Tooltip, FormControlLabel, Switch, Box, Typography } from "@mui/material";

const EntityToggle = ({ role, entity, handleEntityToggle }) => {
  const theme = useTheme();

  return (
    <>
      {role === "SUPERADMIN" && (
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <Tooltip title="Toggle between US and IN entities">
            <FormControlLabel
              control={
                <Switch
                  checked={entity === "US"}
                  onChange={handleEntityToggle}
                  color="primary"
                  size="medium"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "bold",
                    color:
                      entity === "US"
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                  }}
                >
                  {entity === "US" ? "US" : "IN"}
                </Typography>
              }
              labelPlacement="start"
              sx={{ userSelect: "none" }}
            />
          </Tooltip>
        </Box>
      )}
    </>
  );
};

export default EntityToggle;
