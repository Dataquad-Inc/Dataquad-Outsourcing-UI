import React, { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const ReusableMenu = ({
  options = [],
  selectedOption = "",
  onSelect,
  iconButtonProps = {},
  menuProps = {},
  icon = <MoreVertIcon />,
  menuWidth = "20ch",
  maxVisibleItems = 5,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (option) => {
    if (onSelect) onSelect(option);
    handleClose();
  };

  return (
    <div>
      <IconButton
        aria-label="menu"
        aria-controls={open ? "reusable-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        {...iconButtonProps}
      >
        {icon}
      </IconButton>

      <Menu
        id="reusable-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: 48 * maxVisibleItems,
              width: menuWidth,
            },
          },
          list: {
            "aria-labelledby": "menu-button",
          },
        }}
        {...menuProps}
      >
        {options.map((option) => (
          <MenuItem
            key={option}
            selected={option === selectedOption}
            onClick={() => handleSelect(option)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default ReusableMenu;
