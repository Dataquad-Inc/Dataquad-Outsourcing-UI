import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getDashboardHomePath } from "./dashboardHomePath";

const DashboardHomeRedirect = () => {
  const { entity, role } = useSelector((state) => state.auth);
  return <Navigate to={getDashboardHomePath({ role, entity })} replace />;
};

export default DashboardHomeRedirect;
