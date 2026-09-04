/**
 * Single source of truth for post-login / dashboard home routing.
 */
export const getDashboardHomePath = ({ role, entity } = {}) => {
  if (role === "EXTERNALEMPLOYEE") {
    return "/dashboard/timesheets";
  }
  if (role === "HRMS") {
    return "/dashboard/hrms";
  }
  if (entity === "US") {
    return "/dashboard/us-home";
  }
  if (entity === "IN") {
    return "/dashboard/home";
  }
  return "/dashboard";
};

export default getDashboardHomePath;
