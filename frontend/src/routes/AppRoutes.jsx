import { Navigate, Route, Routes } from "react-router-dom";
import BusinessLayout from "../components/BusinessLayout";
import SuperAdminLayout from "../components/SuperAdminLayout";
import BusinessSettings from "../pages/BusinessSettings";
import ChangePassword from "../pages/ChangePassword";
import Dashboard from "../pages/Dashboard";
import Followups from "../pages/Followups";
import LeadDetails from "../pages/LeadDetails";
import Leads from "../pages/Leads";
import Login from "../pages/Login";
import OrganizationEnrollment from "../pages/OrganizationEnrollment";
import OrganizationUsers from "../pages/OrganizationUsers";
import OrganizationView from "../pages/OrganizationView";
import Organizations from "../pages/Organizations";
import Pipeline from "../pages/Pipeline";
import Reports from "../pages/Reports";
import SuperAdminAddons from "../pages/SuperAdminAddons";
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import SuperAdminSettings from "../pages/SuperAdminSettings";
import SuperAdminSubscriptions from "../pages/SuperAdminSubscriptions";
import SuperAdminTemplates from "../pages/SuperAdminTemplates";
import ProtectedRoute from "./ProtectedRoute";
import PermissionProtectedRoute from "./PermissionProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

const businessRoles = ["ORG_ADMIN", "STAFF", "SUPER_ADMIN"];
const superAdminRoles = ["SUPER_ADMIN"];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<RoleProtectedRoute allowedRoles={businessRoles} />}>
          <Route element={<BusinessLayout />}>
            <Route
              element={
                <PermissionProtectedRoute permissionCode="DASHBOARD_VIEW" />
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route
              element={
                <PermissionProtectedRoute permissionCode="PIPELINE_VIEW" />
              }
            >
              <Route path="/pipeline" element={<Pipeline />} />
            </Route>
            <Route
              element={<PermissionProtectedRoute permissionCode="LEAD_VIEW" />}
            >
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetails />} />
            </Route>
            <Route
              element={
                <PermissionProtectedRoute permissionCode="FOLLOWUP_VIEW" />
              }
            >
              <Route path="/followups" element={<Followups />} />
            </Route>
            <Route
              element={<PermissionProtectedRoute permissionCode="REPORT_VIEW" />}
            >
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route
              element={
                <PermissionProtectedRoute permissionCode="SETTINGS_VIEW" />
              }
            >
              <Route path="/settings" element={<BusinessSettings />} />
              <Route
                element={<RoleProtectedRoute allowedRoles={["ORG_ADMIN"]} />}
              >
                <Route path="/settings/users" element={<OrganizationUsers />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={superAdminRoles} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route
              path="/super-admin/organizations"
              element={<Organizations />}
            />
            <Route
              path="/super-admin/organizations/new"
              element={<OrganizationEnrollment />}
            />
            <Route
              path="/super-admin/organizations/:organizationId/users"
              element={<OrganizationUsers />}
            />
            <Route
              path="/super-admin/organizations/:organizationId"
              element={<OrganizationView />}
            />
            <Route
              path="/super-admin/templates"
              element={<SuperAdminTemplates />}
            />
            <Route
              path="/super-admin/subscriptions"
              element={<SuperAdminSubscriptions />}
            />
            <Route path="/super-admin/addons" element={<SuperAdminAddons />} />
            <Route
              path="/super-admin/settings"
              element={<SuperAdminSettings />}
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
