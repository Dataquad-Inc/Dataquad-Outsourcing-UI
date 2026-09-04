import React from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const levelParam = (searchParams.get("level") || "").toUpperCase();
  const initialLevel =
    levelParam === "INTERNAL" || levelParam === "EXTERNAL" ? levelParam : null;

  // Determine which component to render based on user role
  const renderRoleBasedComponent = () => {
    switch (role) {
      case "SUPERADMIN":
        return <AllInterviews initialLevel={initialLevel} />;
      case "TEAMLEAD":
        return <TeamLeadInterviews initialLevel={initialLevel} />;
      case "EMPLOYEE":
        return <RecruiterInterviews initialLevel={initialLevel} />;
      case "BDM":
        return <BDMInterviews initialLevel={initialLevel} />;
      case "COORDINATOR":
        return <CoordinatorInterviews initialLevel={initialLevel} />;
      default:
        return <RecruiterInterviews initialLevel={initialLevel} />;
    }
  };

  return renderRoleBasedComponent();
};

export default InterviewsRouter;
