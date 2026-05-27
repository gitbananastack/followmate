import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import {
  formatDateTime,
  getFollowupCategory,
  getLeadField,
  getLeadSummary,
  getResponseList,
  isOverdueFollowup,
  isToday,
} from "../utils/crm";

const filterOptions = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "TODAY", label: "Today" },
];

function getBadgeClass(status) {
  if (status === "COMPLETED") {
    return "bg-green-50 text-green-700";
  }

  if (status === "PENDING") {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-red-50 text-red-700";
}

function followupMatchesFilter(followup, filter) {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "OVERDUE") {
    return isOverdueFollowup(followup);
  }

  if (filter === "TODAY") {
    return isToday(followup.followupDate);
  }

  return followup.status === filter;
}

function getFilterCount(followups, filter) {
  return followups.filter((followup) => followupMatchesFilter(followup, filter))
    .length;
}

function getInitialFilter(statusFilter, typeFilter) {
  if (typeFilter === "OVERDUE") {
    return "OVERDUE";
  }

  if (typeFilter === "TODAY") {
    return "TODAY";
  }

  if (statusFilter === "PENDING" || statusFilter === "COMPLETED") {
    return statusFilter;
  }

  return "ALL";
}

function Followups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [followups, setFollowups] = useState([]);
  const [leadDetailsById, setLeadDetailsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [completingFollowupId, setCompletingFollowupId] = useState(null);
  const [error, setError] = useState("");

  const activeFilter = getInitialFilter(
    searchParams.get("status"),
    searchParams.get("type")
  );

  const fetchFollowups = async () => {
    setIsLoading(true);

    try {
      const response = await api.get("/api/followups");
      const followupList = getResponseList(response);
      const leadIds = [
        ...new Set(
          followupList.map((followup) => followup.leadId).filter(Boolean)
        ),
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

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleFilterChange = (filter) => {
    if (filter === "ALL") {
      setSearchParams({});
      return;
    }

    if (filter === "OVERDUE" || filter === "TODAY") {
      setSearchParams({ type: filter });
      return;
    }

    setSearchParams({ status: filter });
  };

  const handleMarkComplete = async (followupId) => {
    setCompletingFollowupId(followupId);
    setError("");

    try {
      await api.put(`/api/followups/${followupId}/complete`);
      setFollowups((currentFollowups) =>
        currentFollowups.map((followup) =>
          followup.id === followupId
            ? { ...followup, status: "COMPLETED" }
            : followup
        )
      );
      window.dispatchEvent(new Event("followups:changed"));
    } catch (completeError) {
      const message =
        completeError.response?.data?.message ||
        "Unable to complete follow-up";
      setError(message);
    } finally {
      setCompletingFollowupId(null);
    }
  };

  const filteredFollowups = followups.filter((followup) =>
    followupMatchesFilter(followup, activeFilter)
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Follow-up Tasks</p>
        <h1 className="text-2xl font-semibold text-slate-950">Follow-ups</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = getFilterCount(followups, filter.key);

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => handleFilterChange(filter.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-700"
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>

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
          filteredFollowups.map((followup) => {
            const lead = leadDetailsById[followup.leadId];
            const customerName = getLeadField(lead, "customerName");
            const requirement =
              getLeadField(lead, "artworkName") ||
              getLeadField(lead, "requirement");
            const overdue = isOverdueFollowup(followup);

            return (
              <article
                key={followup.id}
                className={`rounded-xl border p-5 shadow-sm ${
                  overdue
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {getLeadSummary(followup.leadId, lead)}
                    </p>
                    {customerName || requirement ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {[customerName, requirement].filter(Boolean).join(" | ")}
                      </p>
                    ) : null}
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

                {followup.status === "PENDING" ? (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(followup.id)}
                    disabled={completingFollowupId === followup.id}
                    className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {completingFollowupId === followup.id
                      ? "Updating..."
                      : "Mark Complete"}
                  </button>
                ) : null}
              </article>
            );
          })}
      </section>
    </main>
  );
}

export default Followups;
