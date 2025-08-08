import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/authSlice";
import employeesReducer from "../redux/employeesSlice"; // Import the employees reducer
import clientsReducer from "../redux/clientsSlice";
import benchReducer from "../redux/benchSlice";
import requirementReducer from "../redux/requirementSlice";
import interviewReducer from "../redux/interviewSlice";
import submissionReducer from "../redux/submissionSlice";
import commonReducer from "../redux/commonSlice";
import placementReducer from "../redux/placementSlice";
import dashboardReducer from "../redux/dashboardSlice";
import teamMetricsReducer from "../redux/teamMetricsSlice";
import inProgressReducer from "../redux/inProgressSlice";
//us store data
import usEmployeess from "../redux/usEmployees";
import hotlistReducer from "../redux/hotlist";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employee: employeesReducer,
    clients: clientsReducer,
    bench: benchReducer,
    requirement: requirementReducer,
    interview: interviewReducer,
    submission: submissionReducer,
    common: commonReducer,
    placement: placementReducer,
    dashboard: dashboardReducer,
    teamMetrics: teamMetricsReducer,
    inProgress: inProgressReducer,
    //us reducers
    hotlist: hotlistReducer,
    usEmployees: usEmployeess,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
