// routeConfig.js
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import { Box, CircularProgress, Typography } from "@mui/material";
import JobDetails from "../components/Requirements/jobTracking/JobDetails";
import InterviewsRouter from "../components/Interviews/InterviewsRouter";
import DashboardHomeRedirect from "./DashboardHomeRedirect";
import UsEmployeesContainer from "../components/UsEmployees/UsEmployeesContainer";
import EditRtrForm from "../components/RightToRepresent/EditRtrForm";
import UsInterviewsRouter from "../components/UsInterviews/UsInterviewRouter";
import { Navigate } from "react-router-dom";
import { element } from "prop-types";
import FullTimeHotlist from "../components/Hotlist/FullTimeHotlist";

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

//----------IND Team Creation--------------
const IndTeamList = lazy(() => import("../components/Users/IndTeamList"));
const IndTeamContainer = lazy(() =>
  import("../components/Users/IndTeamContainer")
);
const CreateTeamInd = lazy(() => import("../components/Users/CreateTeamInd"));
//----------------------------------------
const IndTeamCreate = lazy(() => import("../components/Users/IndTeamCreate"));

//---------------------------------------
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

//RTR imports
const RtrForm = lazy(() => import("../components/RightToRepresent/RtrForm"));
const RtrList = lazy(() => import("../components/RightToRepresent/RtrList"));
const RtrContainer = lazy(() =>
  import("../components/RightToRepresent/RtrContainer")
);

//hotlist
const Hotlist = lazy(() => import("../components/Hotlist/Hotlist"));
const YetToOnboard = lazy(() =>
  import("../components/YetToOnboard/YetToOnboard")
);
const UsEmployees = lazy(() => import("../components/UsEmployees/UsEmployees"));
const EditTeam = lazy(() => import("../components/UsEmployees/EditTeam"));
const CreateTeam = lazy(() => import("../components/UsEmployees/CreateTeam"));
const Teamlist = lazy(() => import("../components/UsEmployees/Teamlist"));
const OnBoardNewEmployee = lazy(() =>
  import("../components/UsEmployees/OnBoradNewEmployee")
);

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
const MasterHotlist = lazy(() => import("../components/Hotlist/MasterHotlist"));

const W2Hotlist = lazy(() => import("../components/Hotlist/W2Hotlist"));
//yet-to-bonboard
const YetToOnBoardContainer = lazy(() =>
  import("../components/YetToOnboard/YetToOnBoardContainer")
);
const OnHoldConsultants = lazy(() =>
  import("../components/YetToOnboard/OnHoldConsultants")
);
//US Requirements
const RequirementsContainer = lazy(() =>
  import("../components/UsRequirements/RequirementsContainer")
);
const RequirementsList = lazy(() =>
  import("../components/UsRequirements/RequirementsList")
);
const CreateJobRequirement = lazy(() =>
  import("../components/UsRequirements/CreateJobRequirement")
);
const RequirementProfile = lazy(() =>
  import("../components/UsRequirements/RequirementProfile")
);

const EditJobRequirement = lazy(() =>
  import("../components/UsRequirements/EditJobRequirement")
);

//US Clients
const ClientsContainer = lazy(() =>
  import("../components/UsClients/ClientsContainer")
);
const UsClientsList = lazy(() => import("../components/UsClients/UsClients"));
const UsOnboardClients = lazy(() =>
  import("../components/UsClients/OnBoardingClients")
);

//US Submissions - Add these imports
const UsSubmissionsContainer = lazy(() =>
  import("../components/UsSubmissions/UsSubmissionsContainer")
);
const UsSubmissionsList = lazy(() =>
  import("../components/UsSubmissions/UsSubmissionsList")
);

const CreateUsSubmission = lazy(() =>
  import("../components/UsSubmissions/CreateUsSubmission")
);

const CandidateProfile = lazy(() =>
  import("../components/UsSubmissions/CandidateProfile")
);

const EditUSSubmission = lazy(() =>
  import("../components/UsSubmissions/EditUSSubmission")
);

//Us Interviews
const UsAllInterviews = lazy(() =>
  import("../components/UsInterviews/AllInterviews")
);
const InterviewsContainer = lazy(() =>
  import("../components/UsInterviews/UsInterviewsContainer")
);

//Timesheets
const Timesheets = lazy(() => import("../components/Timesheets/TimeSheets"));
const TimesheetsForAdmin = lazy(() =>
  import("../components/Timesheets/TimeSheetsForAdmin")
);
const EmployeeTimesheetDetail = lazy(() =>
  import("../components/Timesheets/EmployeeTimesheetDetail")
);

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
          "SALESEXECUTIVE",
          "EXTERNALEMPLOYEE",
          "ACCOUNTS",
          "GRANDSALES",
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
                  "EXTERNALEMPLOYEE",
                  "ACCOUNTS",
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
                  "ADMIN",
                  "SALESEXECUTIVE",
                  "GRANDSALES",
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
                  "COORDINATOR",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(Submission) }],
          },

          // SUBMISSIONS ALL (no entity restriction)
          {
            path: "submissions-all",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN", "COORDINATOR"]}
              />
            ),
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
                allowedRoles={["ADMIN", "SUPERADMIN", "COORDINATOR", "INVOICE"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [{ index: true, element: Loadable(UsersList) }],
          },

          //----IND TEAM Routes
          {
            path: "ind-team",
            element: (
              <ProtectedRoute
                allowedRoles={["ADMIN", "SUPERADMIN", "COORDINATOR", "INVOICE"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [
              {
                path: "",
                element: <IndTeamContainer />, // main container
                children: [
                  {
                    index: true,
                    element: Loadable(IndTeamList), // default route inside container
                  },
                  {
                    path: "create-team",
                    element: Loadable(CreateTeamInd),
                  },
                  {
                    path: "edit-team/:teamId",
                    element: Loadable(CreateTeamInd), // Reusing the same component
                  },
                ],
              },
            ],
          },

          // CLIENTS (IN)
          {
            path: "clients",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "BDM",
                  "INVOICE",
                  "COORDINATOR",
                ]}
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
                allowedRoles={[
                  "ADMIN",
                  "SUPERADMIN",
                  "BDM",
                  "INVOICE",
                  "COORDINATOR",
                ]}
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
                  "INVOICE",
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

          //Timesheets
          {
            path: "timesheets",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "EXTERNALEMPLOYEE",
                  "SUPERADMIN",
                  "ACCOUNTS",
                  "INVOICE",
                  "ADMIN",
                ]}
                allowedEntities={["IN"]}
              />
            ),
            children: [
              { index: true, element: Loadable(Timesheets) },
              {
                path: "create",
                element: (
                  <ProtectedRoute
                    allowedRoles={[
                      "SUPERADMIN",
                      "ACCOUNTS",
                      "INVOICE",
                      "ADMIN",
                    ]}
                    allowedEntities={["IN"]}
                  />
                ),
                children: [{ index: true, element: Loadable(Timesheets) }],
              },
            ],
          },
          {
            path: "timesheetsForAdmins",
            element: (
              <ProtectedRoute
                allowedRoles={["SUPERADMIN", "ADMIN", "ACCOUNTS", "INVOICE"]}
                allowedEntities={["IN"]}
              />
            ),
            children: [
              { index: true, element: Loadable(TimesheetsForAdmin) },
              {
                path: "employee/:userId",
                element: Loadable(EmployeeTimesheetDetail),
              },
            ],
          },

          // HOTLIST (US) - Updated with proper index routing
          {
            path: "hotlist",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "ADMIN",
                  "TEAMLEAD",
                  "EMPLOYEE",
                  "RECRUITER",
                  "SALESEXECUTIVE",
                  "GRANDSALES",
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
                    path: "consultants", // /dashboard/hotlist/consultants
                    element: Loadable(Hotlist),
                  },
                  {
                    path: "master", // /dashboard/hotlist/master
                    element: Loadable(MasterHotlist),
                  },
                  {
                    path: "w2", // /dashboard/hotlist/w2`
                    element: Loadable(W2Hotlist),
                  },
                  {
                    path:'full-time', // /dashboard/hotlist/full-time`
                    element:Loadable(FullTimeHotlist)
                  },
                  {
                    path: "master/:consultantId", // /dashboard/hotlist/master/:consultantId
                    element: Loadable(ConsultantProfile),
                  },
                  {
                    path: "w2/:consultantId", // /dashboard/hotlist/w2/:consultantId
                    element: Loadable(ConsultantProfile),
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
                  {
                    path: "rtr-form",
                    element: Loadable(RtrForm),
                  },
                  {
                    path: "rtr-list",
                    element: Loadable(RtrList),
                  },
                ],
              },
            ],
          },

          //RTR routes
          {
            path: "rtr",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "ADMIN",
                  "GRANDSALES",
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
                element: <RtrContainer />, // Contains the RTR tab(s) and <Outlet />
                children: [
                  {
                    path: "rtr-form", // /dashboard/rtr/rtr-form
                    element: Loadable(RtrForm),
                  },
                  {
                    path: "rtr-form/:rtrId", // /dashboard/rtr/rtr-form/:rtrId (Edit)
                    element: Loadable(EditRtrForm),
                  },
                  {
                    path: "rtr-list", // /dashboard/rtr/rtr-list
                    element: Loadable(RtrList),
                  },
                ],
              },
            ],
          },

          {
            path: "yet-to-onboard",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "ADMIN",
                  "GRANDSALES",
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
                element: <YetToOnBoardContainer />,
                children: [
                  {
                    index: true,
                    element: Loadable(YetToOnboard),
                  },
                  {
                    path: "create-consultant",
                    element: Loadable(CreateConsultant),
                  },
                  {
                    path: "onhold-consultants",
                    element: Loadable(OnHoldConsultants),
                  },
                ],
              },
            ],
          },

          {
            path: "us-requirements",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "ADMIN",
                  "GRANDSALES",
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
                element: <RequirementsContainer />,
                children: [
                  {
                    index: true,
                    element: Loadable(RequirementsList),
                  },
                  {
                    path: "create-requirement",
                    element: Loadable(CreateJobRequirement),
                  },
                  {
                    path: ":jobId",
                    element: Loadable(RequirementProfile),
                  },
                  {
                    path: "edit/:jobId",
                    element: Loadable(EditJobRequirement),
                  },
                  {
                    path:"candidate-profile/:submissionId",
                    element:Loadable(CandidateProfile)
                  }
                ],
              },
            ],
          },

          {
            path: "us-employees",
            element: (
              <ProtectedRoute
                allowedRoles={["SUPERADMIN", "ADMIN", "GRANDSALES"]}
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
                  {
                    path: "onboardemployee", // /dashboard/us-employees/employeeslist
                    element: Loadable(OnBoardNewEmployee),
                  },
                  {
                    path: "create-team", // /dashboard/us-employees/employeeslist
                    element: Loadable(CreateTeam),
                  },
                  {
                    path: "teamlist", // /dashboard/us-employees/teamlist
                    element: Loadable(Teamlist),
                  },
                  {
                    path: "editteam", // /dashboard/us-employees/teamlist
                    element: Loadable(EditTeam),
                  },
                ],
              },
            ],
          },

          //US Clients
          {
            path: "us-clients",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "EMPLOYEE",
                  "TEAMLEAD",
                  "RECRUITER",
                  "SALESEXECUTIVE",
                  "ADMIN",
                  "GRANDSALES",
                ]}
                allowedEntities={["US"]}
              />
            ),
            children: [
              {
                path: "",
                element: <ClientsContainer />,
                children: [
                  {
                    index: true,
                    element: Loadable(UsClientsList),
                  },
                  {
                    path: "us-create",
                    element: Loadable(UsOnboardClients),
                  },
                ],
              },
            ],
          },

          //US Interviews
          {
            path: "us-interviews",
            element: (
              <ProtectedRoute
                allowedRoles={["SUPERADMIN", "SALESEXECUTIVE", "TEAMLEAD"]}
                allowedEntities={["US"]}
              />
            ),
            children: [
              {
                path: "",
                element: <InterviewsContainer />,
                children: [
                  {
                    index: true,
                    element: Loadable(UsInterviewsRouter), // Use the router
                  },
                ],
              },
            ],
          },

          // US SUBMISSIONS - MOVED INSIDE DASHBOARD ROUTES
          {
            path: "us-submissions",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "SUPERADMIN",
                  "ADMIN",
                  "TEAMLEAD",
                  "EMPLOYEE",
                  "RECRUITER",
                  "SALESEXECUTIVE",
                  "GRANDSALES",
                ]}
                allowedEntities={["US"]}
              />
            ),
            children: [
              {
                path: "",
                element: <UsSubmissionsContainer />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="submissions-list" replace />,
                  },
                  {
                    path: "submissions-list",
                    element: Loadable(UsSubmissionsList),
                  },
                  {
                    path: "candidate-profile/:submissionId",
                    element: Loadable(CandidateProfile),
                  },
                  {
                    path: "create-submission",
                    element: Loadable(CreateUsSubmission),
                  },
                  {
                    path: "edit/:submissionId",
                    element: Loadable(EditUSSubmission),
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
