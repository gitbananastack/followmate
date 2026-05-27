import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getLeadSummary, isOverdueFollowup } from "../utils/crm";

function getResponseList(response) {
  const data = response.data?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getLeadField(lead, fieldName) {
  return (
    lead?.fields?.find((field) => field.fieldName === fieldName)?.fieldValue ||
    ""
  );
}

function getTaskLeadLabel(followup, lead) {
  const fallback = `Lead #${followup.leadId}`;

  if (!lead) {
    return fallback;
  }

  const customerName = getLeadField(lead, "customerName");
  const primaryRequirement =
    getLeadField(lead, "artworkName") ||
    getLeadField(lead, "requirement") ||
    getLeadField(lead, "budget");
  const labelParts = [fallback, customerName, primaryRequirement].filter(
    Boolean
  );

  return labelParts.length > 1 ? labelParts.join(" — ") : fallback;
}

function getStatusBadgeClass(status) {
  return status === "COMPLETED"
    ? "bg-green-50 text-green-700"
    : "bg-yellow-50 text-yellow-700";
}

function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    leads: [],
    followups: [],
    leadDetailsById: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [completingFollowupId, setCompletingFollowupId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leadsResponse, followupsResponse] = await Promise.all([
          api.get("/api/leads"),
          api.get("/api/followups"),
        ]);
        const followups = getResponseList(followupsResponse);
        const todaysLeadIds = [
          ...new Set(
            followups
              .filter((followup) => isToday(followup.followupDate))
              .map((followup) => followup.leadId)
              .filter(Boolean)
          ),
        ];
        const leadDetailResults = await Promise.allSettled(
          todaysLeadIds.map((leadId) => api.get(`/api/leads/${leadId}`))
        );
        const leadDetailsById = leadDetailResults.reduce(
          (detailsById, result, index) => {
            if (result.status === "fulfilled") {
              detailsById[todaysLeadIds[index]] = result.value.data?.data;
            }

            return detailsById;
          },
          {}
        );

        setDashboardData({
          leads: getResponseList(leadsResponse),
          followups,
          leadDetailsById,
        });
      } catch (fetchError) {
        const message =
          fetchError.response?.data?.message || "Unable to load dashboard data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMarkComplete = async (followupId) => {
    setCompletingFollowupId(followupId);
    setError("");

    try {
      await api.put(`/api/followups/${followupId}/complete`);
      setDashboardData((currentData) => ({
        ...currentData,
        followups: currentData.followups.map((followup) =>
          followup.id === followupId
            ? { ...followup, status: "COMPLETED" }
            : followup
        ),
      }));
    } catch (completeError) {
      const message =
        completeError.response?.data?.message ||
        "Unable to complete follow-up";
      setError(message);
    } finally {
      setCompletingFollowupId(null);
    }
  };

  const pendingFollowups = dashboardData.followups.filter(
    (followup) => followup.status === "PENDING"
  );
  const completedFollowups = dashboardData.followups.filter(
    (followup) => followup.status === "COMPLETED"
  );
  const overdueFollowups = dashboardData.followups.filter(isOverdueFollowup);
  const todaysFollowups = dashboardData.followups.filter((followup) =>
    isToday(followup.followupDate)
  );
  const recentLeads = [...dashboardData.leads]
    .sort((firstLead, secondLead) => {
      return new Date(secondLead.createdAt) - new Date(firstLead.createdAt);
    })
    .slice(0, 5);

  const stats = [
    {
      label: "Total Leads",
      value: isLoading ? "..." : dashboardData.leads.length,
      className: "border-blue-100 bg-blue-50/60 text-blue-700",
      path: "/leads",
    },
    {
      label: "Pending Follow-ups",
      value: isLoading ? "..." : pendingFollowups.length,
      className: "border-yellow-100 bg-yellow-50/70 text-yellow-700",
      path: "/followups?status=PENDING",
    },
    {
      label: "Completed Follow-ups",
      value: isLoading ? "..." : completedFollowups.length,
      className: "border-green-100 bg-green-50/70 text-green-700",
      path: "/followups?status=COMPLETED",
    },
    {
      label: "Overdue Follow-ups",
      value: isLoading ? "..." : overdueFollowups.length,
      className: "border-red-100 bg-red-50/70 text-red-700",
      path: "/followups?type=OVERDUE",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">FollowMate</p>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
      </header>

      <section className="grid gap-6">
        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => navigate(stat.path)}
              className={`rounded-xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${stat.className}`}
            >
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Today's Tasks
            </h2>

            <div className="mt-4 grid gap-3">
              {isLoading ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  Loading follow-ups...
                </p>
              ) : null}

              {!isLoading && todaysFollowups.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  No tasks for today
                </p>
              ) : null}

              {!isLoading &&
                todaysFollowups.map((followup) => (
                  <article
                    key={followup.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {getLeadSummary(
                            followup.leadId,
                            dashboardData.leadDetailsById[followup.leadId]
                          )}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatTime(followup.followupDate)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {followup.remarks || "-"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            followup.status
                          )}`}
                        >
                          {followup.status || "PENDING"}
                        </span>

                        {followup.status === "PENDING" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkComplete(followup.id)}
                            disabled={completingFollowupId === followup.id}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                          >
                            {completingFollowupId === followup.id
                              ? "Updating..."
                              : "Mark Complete"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Recent Leads
            </h2>

            <div className="mt-4 grid gap-3">
              {isLoading ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  Loading leads...
                </p>
              ) : null}

              {!isLoading && recentLeads.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  No recent leads found.
                </p>
              ) : null}

              {!isLoading &&
                recentLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Lead #{lead.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {getLeadField(lead, "customerName") || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {getLeadField(lead, "artworkName") || "-"}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
