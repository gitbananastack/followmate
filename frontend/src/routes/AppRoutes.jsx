import { Navigate, Route, Routes } from "react-router-dom";
import BusinessLayout from "../components/BusinessLayout";
import SuperAdminLayout from "../components/SuperAdminLayout";
import BusinessSettings from "../pages/BusinessSettings";
import Billing from "../pages/Billing";
import ChangePassword from "../pages/ChangePassword";
import CsvImport from "../pages/CsvImport";
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
import SuperAdminOrganizationAddons from "../pages/SuperAdminOrganizationAddons";
import SuperAdminOrganizationSubscription from "../pages/SuperAdminOrganizationSubscription";
import SuperAdminSettings from "../pages/SuperAdminSettings";
import SuperAdminSubscriptions from "../pages/SuperAdminSubscriptions";
import SuperAdminTemplates from "../pages/SuperAdminTemplates";
import ProtectedRoute from "./ProtectedRoute";
import FeatureProtectedRoute from "./FeatureProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

const businessRoles = ["ORG_ADMIN", "STAFF"];
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetails />} />
            <Route path="/followups" element={<Followups />} />
            <Route element={<RoleProtectedRoute allowedRoles={["ORG_ADMIN"]} />}>
              <Route element={<FeatureProtectedRoute featureCode="REPORTS" />}>
              <Route path="/reports" element={<Reports />} />
              </Route>
              <Route element={<FeatureProtectedRoute featureCode="CSV_IMPORT" />}>
                <Route path="/csv-import" element={<CsvImport />} />
              </Route>
              <Route path="/settings" element={<BusinessSettings />} />
              <Route path="/settings/users" element={<OrganizationUsers />} />
              <Route path="/settings/billing" element={<Billing />} />
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
              path="/super-admin/organizations/:orgId/subscription"
              element={<SuperAdminOrganizationSubscription />}
            />
            <Route
              path="/super-admin/organizations/:orgId/addons"
              element={<SuperAdminOrganizationAddons />}
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
