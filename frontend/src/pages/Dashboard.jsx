import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getStoredOrganizationId } from "../utils/auth";
import { getResponseList, isOverdueFollowup, isToday } from "../utils/crm";
import { getLeadSummary } from "../utils/leadUtils";

function Dashboard() {
  const navigate = useNavigate();
  const organizationId = getStoredOrganizationId();
  const [dashboardData, setDashboardData] = useState({
    leads: [],
    followups: [],
    workflowStages: [],
  });
  const [leadDetailsById, setLeadDetailsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leadsResponse, followupsResponse, workflowResponse] =
          await Promise.all([
            api.get("/api/leads"),
            api.get("/api/followups"),
            api.get(`/api/organizations/${organizationId}/effective-setup`),
          ]);

        const leads = getResponseList(leadsResponse).filter(
          (lead) => !organizationId || String(lead.organizationId) === organizationId
        );
        const followups = getResponseList(followupsResponse);
        const todayLeadIds = [
          ...new Set(
            followups
              .filter((followup) => isToday(followup.followupDate))
              .map((followup) => followup.leadId)
              .filter(Boolean)
          ),
        ];
        const leadDetailResults = await Promise.allSettled(
          todayLeadIds.map((leadId) => api.get(`/api/leads/${leadId}`))
        );
        const detailsById = leadDetailResults.reduce((details, result, index) => {
          if (result.status === "fulfilled") {
            details[todayLeadIds[index]] = result.value.data?.data;
          }

          return details;
        }, {});

        setDashboardData({
          leads,
          followups,
          workflowStages: (workflowResponse.data?.data?.pipelineStages ?? [])
            .filter((stage) => stage.active)
            .sort(
              (firstStage, secondStage) =>
                (firstStage.displayOrder ?? 0) - (secondStage.displayOrder ?? 0)
            ),
        });
        setLeadDetailsById(detailsById);
      } catch (fetchError) {
        const message =
          fetchError.response?.data?.message || "Unable to load dashboard data";
        setError(message);
        setLeadDetailsById({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [organizationId]);

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

  const leadCards = [
    {
      label: "Total Leads",
      value: isLoading ? "..." : dashboardData.leads.length,
      path: "/leads",
      className: "border-blue-100 bg-blue-50/60 text-blue-700",
    },
    ...dashboardData.workflowStages.map((stage) => ({
      label: stage.stageName,
      value: isLoading
        ? "..."
        : dashboardData.leads.filter(
            (lead) => lead.currentStage === stage.stageName
          ).length,
      path: `/leads?stage=${encodeURIComponent(stage.stageName)}`,
      className: "border-slate-200 bg-white text-slate-800",
    })),
  ];

  const followupCards = [
    {
      label: "Today's Follow-ups",
      value: isLoading ? "..." : todaysFollowups.length,
      path: "/followups?type=TODAY",
      className: "border-blue-100 bg-blue-50/60 text-blue-700",
    },
    {
      label: "Pending Follow-ups",
      value: isLoading ? "..." : pendingFollowups.length,
      path: "/followups?status=PENDING",
      className: "border-yellow-100 bg-yellow-50/70 text-yellow-700",
    },
    {
      label: "Completed Follow-ups",
      value: isLoading ? "..." : completedFollowups.length,
      path: "/followups?status=COMPLETED",
      className: "border-green-100 bg-green-50/70 text-green-700",
    },
    {
      label: "Overdue Follow-ups",
      value: isLoading ? "..." : overdueFollowups.length,
      path: "/followups?type=OVERDUE",
      className: "border-red-100 bg-red-50/70 text-red-700",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">FollowMate</p>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && overdueFollowups.length > 0 ? (
        <button
          type="button"
          onClick={() => navigate("/followups?type=OVERDUE")}
          className="mb-5 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100"
        >
          You have {overdueFollowups.length} overdue follow-ups
        </button>
      ) : null}

      <section className="grid gap-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">
            Lead Pipeline
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leadCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => navigate(card.path)}
                className={`rounded-xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${card.className}`}
              >
                <p className="text-sm font-medium">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">
            Follow-up Tasks
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {followupCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => navigate(card.path)}
                className={`rounded-xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${card.className}`}
              >
                <p className="text-sm font-medium">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              </button>
            ))}
          </div>
        </section>

        {todaysFollowups.length > 0 ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-950">
              Today's Tasks
            </h2>
            <div className="grid gap-3">
              {todaysFollowups.slice(0, 5).map((followup) => {
                const lead = leadDetailsById[followup.leadId];
                const summary = getLeadSummary({
                  ...(lead ?? {}),
                  id: lead?.id ?? followup.leadId,
                });

                return (
                  <button
                    key={followup.id}
                    type="button"
                    onClick={() => navigate("/followups?type=TODAY")}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {summary.leadNo}
                    </p>
                    {[summary.title, summary.phone, summary.subtitle]
                      .filter(Boolean)
                      .map((value) => (
                        <p key={value} className="mt-1 text-sm text-slate-600">
                          {value}
                        </p>
                      ))}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default Dashboard;
