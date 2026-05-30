import { Navigate, Outlet } from "react-router-dom";
import { isForcePasswordChangeRequired } from "../utils/auth";

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const isChangePasswordPath = window.location.pathname === "/change-password";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isForcePasswordChangeRequired() && !isChangePasswordPath) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
