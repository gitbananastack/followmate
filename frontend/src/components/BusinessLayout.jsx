import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearAuthSession, hasPermission } from "../utils/auth";
import { getResponseList, isOverdueFollowup } from "../utils/crm";

const businessNavItems = [
  { label: "Dashboard", path: "/dashboard", permission: "DASHBOARD_VIEW" },
  { label: "Pipeline", path: "/pipeline", permission: "PIPELINE_VIEW" },
  { label: "Leads", path: "/leads", permission: "LEAD_VIEW" },
  { label: "Follow-ups", path: "/followups", permission: "FOLLOWUP_VIEW" },
  { label: "Reports", path: "/reports", permission: "REPORT_VIEW" },
  { label: "Settings", path: "/settings", permission: "SETTINGS_VIEW" },
];

function BusinessLayout() {
  const navigate = useNavigate();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const fetchOverdueCount = async () => {
      if (!hasPermission("FOLLOWUP_VIEW")) {
        setOverdueCount(0);
        return;
      }

      try {
        const response = await api.get("/api/followups");
        const overdueFollowups = getResponseList(response).filter(
          isOverdueFollowup
        );
        setOverdueCount(overdueFollowups.length);
      } catch {
        setOverdueCount(0);
      }
    };

    fetchOverdueCount();
    window.addEventListener("followups:changed", fetchOverdueCount);

    return () => {
      window.removeEventListener("followups:changed", fetchOverdueCount);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    [
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  const renderNavLabel = (item) => (
    <span className="flex items-center justify-between gap-2">
      <span>{item.label}</span>
      {item.path === "/followups" && overdueCount > 0 ? (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          {overdueCount}
        </span>
      ) : null}
    </span>
  );

  const visibleNavItems = businessNavItems.filter((item) =>
    hasPermission(item.permission)
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col">
        <div className="mb-8">
          <p className="text-xl font-bold text-slate-950">FollowMate</p>
          <p className="mt-1 text-sm text-slate-500">Business Growth CRM</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleNavItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}>
              {renderNavLabel(item)}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
        >
          Logout
        </button>
      </aside>

      <div className="md:pl-64">
        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/10 md:hidden">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={(state) => `${navLinkClass(state)} shrink-0`}
          >
            <span className="relative block text-center">
              {item.label}
              {item.path === "/followups" && overdueCount > 0 ? (
                <span className="absolute -right-1 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {overdueCount}
                </span>
              ) : null}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default BusinessLayout;
