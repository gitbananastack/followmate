import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { formatDate, getResponseList } from "../utils/crm";

function getStatusBadgeClass(status) {
  if (status === "ACTIVE") {
    return "bg-green-50 text-green-700";
  }

  if (status === "SUSPENDED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function Organizations() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrganizationId, setUpdatingOrganizationId] = useState(null);
  const [error, setError] = useState("");

  const fetchOrganizations = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get("/api/organizations");
      setOrganizations(getResponseList(response));
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message || "Unable to load organizations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchOrganizations, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleStatusChange = async (organizationId, action) => {
    setUpdatingOrganizationId(organizationId);
    setError("");

    try {
      const response = await api.patch(
        `/api/organizations/${organizationId}/${action}`
      );
      const updatedOrganization = response.data?.data;

      setOrganizations((currentOrganizations) =>
        currentOrganizations.map((organization) =>
          organization.id === organizationId ? updatedOrganization : organization
        )
      );
    } catch (statusError) {
      const message =
        statusError.response?.data?.message ||
        `Unable to ${action} organization`;
      setError(message);
    } finally {
      setUpdatingOrganizationId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Super Admin</p>
          <h1 className="text-2xl font-semibold text-slate-950">
            Organizations
          </h1>
        </div>

        <button
          type="button"
          onClick={() => navigate("/super-admin/organizations/new")}
          className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Create Organization
        </button>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading organizations...
          </div>
        ) : null}

        {!isLoading && organizations.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No organizations found.
          </div>
        ) : null}

        {!isLoading &&
          organizations.map((organization) => {
            const isActive = organization.status === "ACTIVE";
            const isSuspended = organization.status === "SUSPENDED";

            return (
              <article
                key={organization.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Organization #{organization.id}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {organization.organizationName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {organization.businessType}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                      organization.status
                    )}`}
                  >
                    {organization.status || "INACTIVE"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {organization.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {organization.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Created</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDate(organization.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Address</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {organization.address || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to={`/super-admin/organizations/${organization.id}/users`}
                    className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Manage Users
                  </Link>

                  <Link
                    to={`/super-admin/organizations/${organization.id}/subscription`}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
                  >
                    Manage Subscription
                  </Link>

                  <Link
                    to={`/super-admin/organizations/${organization.id}/addons`}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
                  >
                    Manage Add-ons
                  </Link>

                  <Link
                    to={`/super-admin/organizations/${organization.id}`}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
                  >
                    View
                  </Link>

                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(organization.id, "activate")
                      }
                      disabled={updatingOrganizationId === organization.id}
                      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingOrganizationId === organization.id
                        ? "Updating..."
                        : "Activate"}
                    </button>
                  ) : null}

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(organization.id, "deactivate")
                      }
                      disabled={updatingOrganizationId === organization.id}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingOrganizationId === organization.id
                        ? "Updating..."
                        : "Deactivate"}
                    </button>
                  ) : null}

                  {!isSuspended ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(organization.id, "suspend")
                      }
                      disabled={updatingOrganizationId === organization.id}
                      className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingOrganizationId === organization.id
                        ? "Updating..."
                        : "Suspend"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
      </section>
    </main>
  );
}

export default Organizations;
