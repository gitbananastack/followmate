import { Navigate, Outlet } from "react-router-dom";
import { getDashboardPathForRole, getStoredRole } from "../utils/auth";

function RoleProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = getStoredRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPathForRole(role)} replace />;
  }

  return <Outlet />;
}

export default RoleProtectedRoute;
