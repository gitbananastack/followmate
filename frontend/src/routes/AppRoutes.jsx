import { Navigate, Route, Routes } from "react-router-dom";
import BusinessLayout from "../components/BusinessLayout";
import SuperAdminLayout from "../components/SuperAdminLayout";
import BusinessSettings from "../pages/BusinessSettings";
import Dashboard from "../pages/Dashboard";
import Followups from "../pages/Followups";
import LeadDetails from "../pages/LeadDetails";
import Leads from "../pages/Leads";
import Login from "../pages/Login";
import Organizations from "../pages/Organizations";
import Pipeline from "../pages/Pipeline";
import SuperAdminAddons from "../pages/SuperAdminAddons";
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import SuperAdminSettings from "../pages/SuperAdminSettings";
import SuperAdminSubscriptions from "../pages/SuperAdminSubscriptions";
import SuperAdminTemplates from "../pages/SuperAdminTemplates";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

const businessRoles = ["ORG_ADMIN", "STAFF", "SUPER_ADMIN"];
const superAdminRoles = ["SUPER_ADMIN"];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleProtectedRoute allowedRoles={businessRoles} />}>
          <Route element={<BusinessLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetails />} />
            <Route path="/followups" element={<Followups />} />
            <Route path="/settings" element={<BusinessSettings />} />
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
