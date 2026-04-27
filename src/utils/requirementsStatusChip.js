import { Chip } from "@mui/material";

export const renderStatus = (status) => {
  let color = "default";

  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case "submitted":
    case "open":
      color = "success";
      break;

    case "closed":
    case "cancelled":
      color = "error";
      break;

    case "hold":
    case "on hold":
    case "on_hold":
      color = "warning";
      break;

    case "in progress":
    case "in_progress":
      color = "info";
      break;

    default:
      color = "default";
  }

  const formatStatus = (text) => {
    if (!text) return "Unknown";

    return text
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Chip
      label={formatStatus(status)}
      size="small"
      color={color}
      variant="filled"
    />
  );
};