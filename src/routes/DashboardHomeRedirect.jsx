import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const DashboardHomeRedirect = () => {
  const { entity, role } = useSelector((state) => state.auth);

  if (role === "HRMS") {
    return <Navigate to="/dashboard/hrms" replace />;
  }

  if (entity === "IN") {
    return <Navigate to="/dashboard/home" replace />;
  } else if (entity === "US") {
    return <Navigate to="/dashboard/us-home" replace />;
  }
  
  // Default if entity not found
  return <Navigate to="/unauthorized" replace />;
};

export default DashboardHomeRedirect;
