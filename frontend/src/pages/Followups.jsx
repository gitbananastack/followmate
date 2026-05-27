import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import {
  formatDateTime,
  getFollowupCategory,
  getLeadSummary,
  getResponseList,
  isOverdueFollowup,
} from "../utils/crm";

function getBadgeClass(status) {
  if (status === "COMPLETED") {
    return "bg-green-50 text-green-700";
  }

  if (status === "PENDING") {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-red-50 text-red-700";
}

function Followups() {
  const [searchParams] = useSearchParams();
  const [followups, setFollowups] = useState([]);
  const [leadDetailsById, setLeadDetailsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const statusFilter = searchParams.get("status");
  const typeFilter = searchParams.get("type");

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        const response = await api.get("/api/followups");
        const followupList = getResponseList(response);
        const leadIds = [
          ...new Set(followupList.map((followup) => followup.leadId).filter(Boolean)),
        ];
        const leadDetailResults = await Promise.allSettled(
          leadIds.map((leadId) => api.get(`/api/leads/${leadId}`))
        );
        const detailsById = leadDetailResults.reduce((details, result, index) => {
          if (result.status === "fulfilled") {
            details[leadIds[index]] = result.value.data?.data;
          }

          return details;
        }, {});

        setFollowups(followupList);
        setLeadDetailsById(detailsById);
      } catch (fetchError) {
        const message =
          fetchError.response?.data?.message || "Unable to load follow-ups";
        setError(message);
        setFollowups([]);
        setLeadDetailsById({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowups();
  }, []);

  const filteredFollowups = followups.filter((followup) => {
    if (typeFilter === "OVERDUE") {
      return isOverdueFollowup(followup);
    }

    if (statusFilter) {
      return followup.status === statusFilter;
    }

    return true;
  });

  const pageTitle =
    typeFilter === "OVERDUE"
      ? "Overdue Follow-ups"
      : statusFilter
        ? `${statusFilter.charAt(0)}${statusFilter.slice(1).toLowerCase()} Follow-ups`
        : "Follow-ups";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">FollowMate CRM</p>
        <h1 className="text-2xl font-semibold text-slate-950">{pageTitle}</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading follow-ups...
          </div>
        ) : null}

        {!isLoading && filteredFollowups.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No follow-ups found.
          </div>
        ) : null}

        {!isLoading &&
          filteredFollowups.map((followup) => (
            <article
              key={followup.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {getLeadSummary(
                      followup.leadId,
                      leadDetailsById[followup.leadId]
                    )}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {followup.remarks || "-"}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
                    getFollowupCategory(followup)
                  )}`}
                >
                  {followup.status || "PENDING"}
                </span>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">Follow-up Date</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(followup.followupDate)}
                </p>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

export default Followups;
