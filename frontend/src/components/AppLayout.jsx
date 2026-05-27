import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Leads", path: "/leads" },
  { label: "Follow-ups", path: "/followups" },
];

function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    [
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col">
        <div className="mb-8">
          <p className="text-xl font-bold text-slate-950">FollowMate</p>
          <p className="mt-1 text-sm text-slate-500">Business Growth CRM</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}>
              {item.label}
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

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/10 md:hidden">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={navLinkClass}>
            <span className="block text-center">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppLayout;
