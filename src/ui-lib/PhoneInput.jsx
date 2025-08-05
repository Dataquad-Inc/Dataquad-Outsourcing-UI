import React from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import ClearIcon from "@mui/icons-material/Clear";

const countryCodes = [
  { code: "+91", label: "IND", maxLength: 10, format: [4, 3, 3] },
  { code: "+1", label: "USA", maxLength: 10, format: [3, 3, 4] },
  { code: "+86", label: "CHN", maxLength: 11, format: [3, 4, 4] },
  { code: "+62", label: "IDN", maxLength: 10, format: [4, 3, 3] },
  { code: "+55", label: "BRA", maxLength: 11, format: [2, 5, 4] },
  { code: "+92", label: "PAK", maxLength: 10, format: [3, 3, 4] },
  { code: "+880", label: "BGD", maxLength: 10, format: [3, 3, 4] },
  { code: "+234", label: "NGA", maxLength: 10, format: [3, 3, 4] },
  { code: "+44", label: "UK", maxLength: 10, format: [5, 3, 2] },
  { code: "+81", label: "JPN", maxLength: 10, format: [3, 3, 4] },
];

const formatNumber = (digits, pattern) => {
  let result = "";
  let idx = 0;

  for (let len of pattern) {
    if (idx >= digits.length) break;
    if (result) result += " ";
    result += digits.slice(idx, idx + len);
    idx += len;
  }

  return result;
};

const PhoneInput = ({
  label = "Phone Number",
  name = "phone",
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  countryCode,
  setCountryCode,
  ...props
}) => {
  const showClear = value && !disabled;

  const selectedCountry = countryCodes.find((c) => c.code === countryCode);
  const maxLength = selectedCountry?.maxLength || 15;
  const formatPattern = selectedCountry?.format || [3, 3, 4];

  const handleClear = () => {
    const syntheticEvent = {
      target: {
        name,
        value: "",
      },
    };
    onChange(syntheticEvent);
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const trimmed = raw.slice(0, maxLength);
    const formatted = formatNumber(trimmed, formatPattern);

    const syntheticEvent = {
      target: {
        name: e.target.name,
        value: formatted,
      },
    };
    onChange(syntheticEvent);
  };

  return (
    <TextField
      label={label}
      name={name}
      type="tel"
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      error={!!error}
      helperText={error || helperText}
      required={required}
      disabled={disabled}
      fullWidth
      variant="outlined"
      inputProps={{ maxLength: 20 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PhoneIcon sx={{ mr: 1 }} />
            <Select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              variant="standard"
              disableUnderline
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 150,
                    overflowY: "auto",
                    // Custom scrollbar
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#4C585B",
                      borderRadius: "4px",
                    },
                  },
                },
              }}
              sx={{
                width: 70,
              }}
            >
              {countryCodes.map((item) => (
                <MenuItem key={item.code} value={item.code}>
                  {item.code}
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        ),
        endAdornment: showClear ? (
          <InputAdornment position="end">
            <IconButton onClick={handleClear} size="small">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...props}
    />
  );
};

export default PhoneInput;
