import TimesheetDashboard from "./TimesheetDashboard";

/** US yearly dashboard — served by India Timesheet API with entity=US. */
const UsTimesheetDashboard = () => (
  <TimesheetDashboard
    apiBase="/timesheet"
    entity="US"
    hideBackButton
    title="Timesheet Dashboard"
    subtitlePrefix="Yearly hours by US candidate for"
  />
);

export default UsTimesheetDashboard;
