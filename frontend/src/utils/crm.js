import {
  getDynamicFieldMap,
  getLeadSummary as getLeadSummaryDetails,
} from "./leadUtils";

export function getResponseList(response) {
  const data = response.data?.data ?? [];
  return Array.isArray(data) ? data : [];
}

export function getLeadField(lead, fieldName) {
  return getDynamicFieldMap(lead)[
    String(fieldName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
  ] || "";
}

export const PHONE_FIELD_NAMES = [
  "phoneNumber",
  "phone",
  "mobile",
  "mobileNumber",
  "customerPhone",
];

export function isPhoneField(fieldName) {
  return PHONE_FIELD_NAMES.includes(fieldName);
}

export function getPhoneNumber(lead) {
  return getLeadSummaryDetails(lead).phone;
}

export function getLeadSummary(leadOrLeadId, leadDetails) {
  const lead = leadDetails ?? leadOrLeadId;
  const leadId =
    typeof leadOrLeadId === "object" ? leadOrLeadId?.id : leadOrLeadId;
  const fallback = `Lead #${leadId}`;

  if (!lead) {
    return fallback;
  }

  const summary = getLeadSummaryDetails({ ...lead, id: lead.id ?? leadId });
  const labelParts = [summary.leadNo || fallback, summary.title, summary.subtitle].filter(Boolean);

  return labelParts.length > 1 ? labelParts.join(" \u2014 ") : fallback;
}

export function isOverdueFollowup(followup) {
  return (
    followup.status === "PENDING" &&
    followup.followupDate &&
    new Date(followup.followupDate) < new Date()
  );
}

export function isToday(value) {
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

export function getFollowupCategory(followup) {
  if (isOverdueFollowup(followup)) {
    return "OVERDUE";
  }

  return followup.status || "PENDING";
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
