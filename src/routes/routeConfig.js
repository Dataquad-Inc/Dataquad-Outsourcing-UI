// routeConfig.js
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import { Box, CircularProgress, Typography } from "@mui/material";
import JobDetails from "../components/Requirements/jobTracking/JobDetails";
import InterviewsRouter from "../components/Interviews/InterviewsRouter";
import DashboardHomeRedirect from "./DashboardHomeRedirect"; // NEW
import { element } from "prop-types";

import UsEmployeesContainer from "../components/UsEmployees/UsEmployeesContainer";

const Loadable = (Component) => (
  <Suspense
    fallback={
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress color="primary" size={80} />
        <Typography variant="subtitle1" color="textSecondary">
          Loading component...
        </Typography>
      </Box>
    }
  >
    <Component />
  </Suspense>
);

// Lazy imports
const Dashboard = lazy(() => import("../Layout/Dashboard"));
const IndexPage = lazy(() => import("../pages/IndexPage"));
const AdroitHome = lazy(() => import("../pages/AdroitHome"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const Submission = lazy(() => import("../components/Submissions/Submission"));
const AllSubmissions = lazy(() =>
  import("../components/Submissions/AllSubmissions")
);
const Assigned = lazy(() => import("../components/Assigned/Assigned"));
const Requirements = lazy(() =>
  import("../components/Requirements/Requirements")
);
const PostRequirement = lazy(() =>
  import("../components/Requirements/PostRequirement/PostRequirement")
);
const AllInterviews = lazy(() =>
  import("../components/Interviews/AllInterviews")
);
const UsersList = lazy(() => import("../components/Users/UsersList"));
const ClientList = lazy(() => import("../components/Clients/ClientList"));
const OnBoardClient = lazy(() => import("../components/Clients/OnBoardClient"));
const PlacementsList = lazy(() =>
  import("../components/Placements/PlacementList")
);
const BenchList = lazy(() => import("../components/Bench/BenchList"));
const TeamMetrices = lazy(() =>
  import("../components/TeamMetrics/TeamMetrices")
);
const BdmStatus = lazy(() => import("../components/TeamMetrics/BdmStatus"));
const EmployeeStatus = lazy(() =>
  import("../components/TeamMetrics/EmployeeStatus")
);
const Hotlist = lazy(() => import("../components/Hotlist/Hotlist"));
const UsEmployees = lazy(() => import("../components/UsEmployees/UsEmployees"));

const ConsultantProfile = lazy(() =>
  import("../components/Hotlist/ConsultantProfile")
);
const TeamConsultantsHotlist = lazy(() =>
  import("../components/Hotlist/TeamConsultantsHotlist")
);
const HotlistContainer = lazy(() =>
  import("../components/Hotlist/HotlistContainer")
);
const CreateConsultant = lazy(() =>
  import("../components/Hotlist/CreateConsultant")
);

const Timesheets = lazy(() => import("../components/Timesheets/TimeSheets"));
// const HotlistDetail = lazy(() => import("../components/Hotlist/HotlistDetail"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
const DeniedAccessCard = lazy(() =>
  import("../pages/NotFound/DeniedAccessCard")
);
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));
const InProgressData = lazy(() =>
  import("../components/InProgress/InProgress")
);

const routeConfig = [
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "ADMIN",
          "SUPERADMIN",
          "RECRUITER",
          "EMPLOYEE",
          "BDM",
          "TEAMLEAD",
          "PARTNER",
          "INVOICE",
          "COORDINATOR",
        ]}
      />
    ),
    children: [
      {
        path: "",
        element: Loadable(Dashboard),
        children: [
          // Default home redirect based on entity
          { index: true, element: <DashboardHomeRedirect /> },

          // HOME (IN entity)
          {
            path: "home",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "EMPLOYEE",
                  "BDM",
                  "TEAMLEAD",
                  "PARTNER",
                  "INVOICE",
                  "COORDINATOR",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(IndexPage) }],
          },

          // HOME (US entity)
          {
            path: "us-home",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "TEAMLEAD",
                  "EMPLOYEE",
                  "RECRUITER",
                ]}
                allowedEntities={["US"]}
              />
            ),
            children: [{ index: true, element: Loadable(AdroitHome) }],
          },

          // ASSIGNED (IN)
          {
            path: "assigned",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "EMPLOYEE",
                  "TEAMLEAD",
                  "BDM",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(Assigned) }],
          },

          // SUBMISSIONS (IN)
          {
            path: "submissions",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "EMPLOYEE",
                  "BDM",
                  "TEAMLEAD",
                  "PARTNER",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(Submission) }],
          },

          // SUBMISSIONS ALL (no entity restriction)
          {
            path: "submissions-all",
            element: <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]} />,
            children: [{ index: true, element: Loadable(AllSubmissions) }],
          },

          // REQUIREMENTS (IN)
          {
            path: "requirements",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "BDM",
                  "TEAMLEAD",
                  "COORDINATOR",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [
              { index: true, element: Loadable(Requirements) },
              {
                path: "job-details/:jobId",
                element: Loadable(JobDetails),
              },
            ],
          },

          // JOB FORM (IN)
          {
            path: "jobForm",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN", "BDM"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(PostRequirement) }],
          },

          // INTERVIEWS (IN)
          {
            path: "interviews",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "EMPLOYEE",
                  "BDM",
                  "TEAMLEAD",
                  "SUPERADMIN",
                  "COORDINATOR",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(InterviewsRouter) }],
          },

          // INTERVIEWS ALL (IN)
          {
            path: "interviews-all",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(AllInterviews) }],
          },

          // USERS (IN)
          {
            path: "users",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN", "COORDINATOR"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(UsersList) }],
          },

          // CLIENTS (IN)
          {
            path: "clients",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN", "BDM"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(ClientList) }],
          },

          // ADD NEW CLIENT (IN)
          {
            path: "addNewClient",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN", "BDM"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(OnBoardClient) }],
          },

          // PLACEMENTS (IN)
          {
            path: "placements",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "BDM",
                  "TEAMLEAD",
                  "EMPLOYEE",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(PlacementsList) }],
          },

          // IN PROGRESS (IN)
          {
            path: "InProgress",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "EMPLOYEE",
                  "BDM",
                  "TEAMLEAD",
                  "PARTNER",
                  "PAYROLLADMIN",
                  "COORDINATOR",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(InProgressData) }],
          },

          // BENCH USERS (IN)
          {
            path: "bench-users",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "BDM",
                  "TEAMLEAD",
                  "PARTNER",
                  "EMPLOYEE",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(BenchList) }],
          },

          // TEAM METRICS (no entity restriction)
          {
            path: "team-metrics",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "BDM",
                  "TEAMLEAD",
                  "PARTNER",
                  "EMPLOYEE",
                ]}
              />
            ),
            children: [
              { index: true, element: Loadable(TeamMetrices) },
              {
                path: "bdmstatus/:employeeId",
                element: (
                  <ProtectedRoute
                    allowedRoles={["ADMIN", "SUPERADMIN", "BDM", "TEAMLEAD"]}
                  />
                ),
                children: [{ index: true, element: Loadable(BdmStatus) }],
              },
              {
                path: "employeestatus/:employeeId",
                element: (
                  <ProtectedRoute
                    allowedRoles={["ADMIN", "SUPERADMIN", "TEAMLEAD"]}
                  />
                ),
                children: [{ index: true, element: Loadable(EmployeeStatus) }],
              },
            ],
          },

          {
            path: "timesheets",
            element: (
              <ProtectedRoute
                allowedRoles={["EXTERNALEMPLOYEE"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(Timesheets) }],
          },

          // HOTLIST (US) - Updated to include RECRUITER role
          {
            path: "hotlist",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "TEAMLEAD",
                  "EMPLOYEE",
                  "RECRUITER",
                  "SALESEXECUTIVE",
                ]}
                allowedEntities={["US"]}
              />
            ),
            children: [
              {
                path: "",
                element: <HotlistContainer />, // Contains the tabs and <Outlet />
                children: [
                  {
                    index: true, // /dashboard/hotlist
                    element: Loadable(Hotlist), // Default tab content
                  },
                  {
                    path: "consultants", // /dashboard/hotlist/consultants
                    element: Loadable(Hotlist),
                  },
                  {
                    path: "consultants/:consultantId", // /dashboard/hotlist/consultants/:id
                    element: Loadable(ConsultantProfile),
                  },
                  {
                    path: "create", // /dashboard/hotlist/create
                    element: Loadable(CreateConsultant),
                  },
                  {
                    path: "team-consultants", // /dashboard/hotlist/team-consultants
                    element: Loadable(TeamConsultantsHotlist),
                  },
                  {
                    path: "team-consultants/:consultantId", // /dashboard/hotlist/team-consultants/:id
                    element: Loadable(ConsultantProfile),
                  },
                ],
              },
            ],
          },

          {
            path: "us-employees",
            element: (
              <ProtectedRoute
                allowedRoles={["SUPERADMIN"]}
                allowedEntities={["US"]}
              />
            ),
            children: [
              {
                path: "",
                element: <UsEmployeesContainer />, // Contains the tabs and <Outlet />
                children: [
                  {
                    index: true, // /dashboard/us-employees
                    element: Loadable(UsEmployees), // Default tab content
                  },
                  {
                    path: "employeeslist", // /dashboard/us-employees/employeeslist
                    element: Loadable(UsEmployees),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "/", element: Loadable(LoginPage) },
  { path: "/access", element: Loadable(DeniedAccessCard) },
  { path: "/unauthorized", element: Loadable(Unauthorized) },
  { path: "*", element: Loadable(NotFound) },
];

export default routeConfig;
