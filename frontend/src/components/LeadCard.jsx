import {
  formatDate,
  getLeadField,
  getFollowupCategory,
  isOverdueFollowup,
} from "../utils/crm";
import ContactActions from "./ContactActions";

function getLeadFollowupBadge(followups) {
  if (followups.length === 0) {
    return {
      label: "No Follow-up",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (followups.some(isOverdueFollowup)) {
    return {
      label: "Overdue Follow-up",
      className: "bg-red-50 text-red-700",
    };
  }

  if (followups.some((followup) => followup.status === "PENDING")) {
    return {
      label: "Pending Follow-up",
      className: "bg-yellow-50 text-yellow-700",
    };
  }

  if (followups.some((followup) => followup.status === "COMPLETED")) {
    return {
      label: "Completed Follow-up",
      className: "bg-green-50 text-green-700",
    };
  }

  return {
    label: `${getFollowupCategory(followups[0])} Follow-up`,
    className: "bg-slate-100 text-slate-600",
  };
}

function LeadCard({
  followups = [],
  lead,
  onViewDetails,
  showFollowupBadge = true,
}) {
  const customerName = getLeadField(lead, "customerName");
  const artworkName = getLeadField(lead, "artworkName");
  const requirement = getLeadField(lead, "requirement");
  const budget = getLeadField(lead, "budget");
  const primaryRequirement = artworkName || requirement || budget;
  const followupBadge = getLeadFollowupBadge(followups);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Lead #{lead.id}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            {customerName || `Lead #${lead.id}`}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {primaryRequirement || `Lead #${lead.id}`}
          </p>
          {budget ? (
            <p className="mt-2 text-sm font-medium text-slate-900">
              Budget: {budget}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Stage: {lead.currentStage || "NEW"}
          </span>
          {showFollowupBadge ? (
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${followupBadge.className}`}
            >
              {followupBadge.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
        <p className="text-slate-500">Created Date</p>
        <p className="mt-1 font-medium text-slate-900">
          {formatDate(lead.createdAt)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <ContactActions lead={lead} />
        <button
          type="button"
          onClick={onViewDetails}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
        >
          View Details
        </button>
      </div>
    </article>
  );
}

export default LeadCard;
