import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Dashboard from "../pages/Dashboard";
import Followups from "../pages/Followups";
import LeadDetails from "../pages/LeadDetails";
import Leads from "../pages/Leads";
import Login from "../pages/Login";
import Pipeline from "../pages/Pipeline";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetails />} />
            <Route path="/followups" element={<Followups />} />
          </Route>
        </Route>
      </Routes>
  );
}

export default AppRoutes;
