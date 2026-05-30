import { Link } from "react-router-dom";
import { getDashboardPathForRole, getStoredRole } from "../utils/auth";

function AccessDenied() {
  const dashboardPath = getDashboardPathForRole(getStoredRole());

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-6 sm:px-6">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-red-600">Access Denied</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          You do not have permission to view this page.
        </h1>
        <Link
          to={dashboardPath}
          className="mt-5 inline-flex rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </section>
    </main>
  );
}

export default AccessDenied;
