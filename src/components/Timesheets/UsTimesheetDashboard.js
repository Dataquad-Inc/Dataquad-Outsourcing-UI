import TimesheetDashboard from "./TimesheetDashboard";

const UsTimesheetDashboard = () => (
  <TimesheetDashboard
    apiBase="/api/us/timesheet"
    hideBackButton
    title="Timesheet Dashboard"
    subtitlePrefix="Yearly hours by US candidate for"
  />
);

export default UsTimesheetDashboard;
