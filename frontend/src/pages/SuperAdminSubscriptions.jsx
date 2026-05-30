import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatDate, getResponseList } from "../utils/crm";

function getStatusBadgeClass(status) {
  if (status === "ACTIVE" || status === "TRIAL") {
    return "bg-green-50 text-green-700";
  }

  if (status === "EXPIRED" || status === "CANCELLED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function SuperAdminSubscriptions() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubscriptionOverview = async () => {
      setError("");
      setIsLoading(true);

      try {
        const organizationsResponse = await api.get("/api/organizations");
        const organizations = getResponseList(organizationsResponse);

        const overviewRows = await Promise.all(
          organizations.map(async (organization) => {
            try {
              const subscriptionResponse = await api.get(
                `/api/organizations/${organization.id}/subscription`
              );

              return {
                organization,
                subscription: subscriptionResponse.data?.data ?? null,
              };
            } catch {
              return { organization, subscription: null };
            }
          })
        );

        setRows(overviewRows);
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message ||
            "Unable to load subscription overview"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionOverview();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Super Admin</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Subscriptions
        </h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading subscriptions...
          </div>
        ) : null}

        {!isLoading && rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No organizations found.
          </div>
        ) : null}

        {!isLoading &&
          rows.map(({ organization, subscription }) => (
            <article
              key={organization.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    Organization #{organization.id}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                    {organization.organizationName}
                  </h2>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[520px]">
                  <InfoCell
                    label="Current Plan"
                    value={subscription?.planName || "No active plan"}
                  />
                  <div>
                    <p className="text-slate-500">Status</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        subscription?.status
                      )}`}
                    >
                      {subscription?.status || "NONE"}
                    </span>
                  </div>
                  <InfoCell
                    label="Expiry Date"
                    value={formatDate(subscription?.expiryDate)}
                  />
                </div>

                <Link
                  to={`/super-admin/organizations/${organization.id}/subscription`}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Manage Subscription
                </Link>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

function InfoCell({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value || "-"}</p>
    </div>
  );
}

export default SuperAdminSubscriptions;
