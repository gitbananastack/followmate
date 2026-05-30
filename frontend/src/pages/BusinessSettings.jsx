import { Link } from "react-router-dom";
import { getStoredRole } from "../utils/auth";

function BusinessSettings() {
  const role = getStoredRole();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Business Portal</p>
        <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Business Settings
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage staff access for your organization.
        </p>
        {role === "ORG_ADMIN" ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/settings/users"
              className="inline-flex rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Users
            </Link>
            <Link
              to="/settings/billing"
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
            >
              Billing
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default BusinessSettings;
