import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getResponseList } from "../utils/crm";

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const organizationsResponse = await api.get("/api/organizations");
        setOrganizations(getResponseList(organizationsResponse));
      } catch (fetchError) {
        const message =
          fetchError.response?.data?.message ||
          "Unable to load super admin dashboard";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeOrganizations = organizations.filter(
    (organization) => organization.status === "ACTIVE"
  );
  const inactiveOrganizations = organizations.filter(
    (organization) => organization.status === "INACTIVE"
  );
  const suspendedOrganizations = organizations.filter(
    (organization) => organization.status === "SUSPENDED"
  );

  const cards = [
    {
      label: "Total Organizations",
      value: organizations.length,
      className: "border-blue-100 bg-blue-50/60 text-blue-700",
      path: "/super-admin/organizations",
    },
    {
      label: "Active Organizations",
      value: activeOrganizations.length,
      className: "border-green-100 bg-green-50/70 text-green-700",
      path: "/super-admin/organizations",
    },
    {
      label: "Inactive Organizations",
      value: inactiveOrganizations.length,
      className: "border-slate-200 bg-white text-slate-800",
      path: "/super-admin/organizations",
    },
    {
      label: "Suspended Organizations",
      value: suspendedOrganizations.length,
      className: "border-red-100 bg-red-50/70 text-red-700",
      path: "/super-admin/organizations",
    },
    {
      label: "Trial Organizations",
      value: 0,
      className: "border-purple-100 bg-purple-50/60 text-purple-700",
      path: "/super-admin/subscriptions",
    },
    {
      label: "Paid Organizations",
      value: 0,
      className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
      path: "/super-admin/subscriptions",
    },
    {
      label: "Expiring Soon",
      value: 0,
      className: "border-amber-100 bg-amber-50/70 text-amber-700",
      path: "/super-admin/subscriptions",
    },
    {
      label: "Monthly Revenue",
      value: "₹0",
      className: "border-blue-100 bg-blue-50/60 text-blue-700",
      path: "/super-admin/subscriptions",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Super Admin</p>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => navigate(card.path)}
            className={`rounded-xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${card.className}`}
          >
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">
              {isLoading ? "..." : card.value}
            </p>
          </button>
        ))}
      </section>
    </main>
  );
}

export default SuperAdminDashboard;
