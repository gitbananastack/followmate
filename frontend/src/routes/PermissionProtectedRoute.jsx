import { Outlet } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";
import { hasPermission } from "../utils/auth";

function PermissionProtectedRoute({ permissionCode }) {
  if (!hasPermission(permissionCode)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}

export default PermissionProtectedRoute;
