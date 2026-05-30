import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatDate } from "../utils/crm";

function OrganizationView() {
  const { organizationId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrganization = async () => {
      setError("");
      setIsLoading(true);

      try {
        const response = await api.get(`/api/organizations/${organizationId}`);
        setOrganization(response.data?.data ?? null);
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message || "Unable to load organization"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Link
          to="/super-admin/organizations"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Organizations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {organization?.organizationName || "Organization"}
        </h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Loading organization...
        </div>
      ) : null}

      {!isLoading && organization ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Organization ID", `#${organization.id}`],
              ["Business Type", organization.businessType],
              ["Status", organization.status],
              ["Setup", organization.setupFinalized ? "Finalized" : "Pending"],
              ["Source Template", organization.sourceTemplateId || "-"],
              ["Created", formatDate(organization.createdAt)],
              ["Email", organization.email || "-"],
              ["Phone", organization.phone || "-"],
              ["Address", organization.address || "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <Link
            to={`/super-admin/organizations/${organization.id}/users`}
            className="mt-5 inline-flex rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Users
          </Link>
        </section>
      ) : null}
    </main>
  );
}

export default OrganizationView;
