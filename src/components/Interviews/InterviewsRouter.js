import React from "react";
import { useSelector } from "react-redux";
import AllInterviews from "./AllInterviews";
import TeamLeadInterviews from "./TeamLeadInterviews";
import RecruiterInterviews from "./RecruiterInterviews";
import BDMInterviews from "./BDMInterviews";
import CoordinatorInterviews from "./CoordinatorInterviews";

/**
 * Router component that renders the appropriate interviews component based on user role
 * This allows for cleaner code organization and better separation of concerns
 */
const InterviewsRouter = () => {
  const { role } = useSelector((state) => state.auth);
  
  // Determine which component to render based on user role
  const renderRoleBasedComponent = () => {
    switch (role) {
      case "SUPERADMIN":
        return <AllInterviews />;
      case "TEAMLEAD":
        return <TeamLeadInterviews />;
      case "EMPLOYEE":
        return <RecruiterInterviews/>;
      case "BDM":
        return <BDMInterviews/>;
      case "COORDINATOR":
        return <CoordinatorInterviews/>;
      default:
        return <RecruiterInterviews />;
    }
  };

  return renderRoleBasedComponent();
};

export default InterviewsRouter;