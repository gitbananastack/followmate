import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { getStoredOrganizationId, hasPermission } from "../utils/auth";
import { getLeadSummary } from "../utils/leadUtils";

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

function formatDateTime(value) {
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

function getStatusBadgeClass(status) {
  return status === "COMPLETED"
    ? "bg-green-50 text-green-700"
    : "bg-yellow-50 text-yellow-700";
}

function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState("");
  const [followups, setFollowups] = useState([]);
  const [followupForm, setFollowupForm] = useState({
    followupDate: "",
    remarks: "",
  });
  const [fieldForm, setFieldForm] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFieldsSubmitting, setIsFieldsSubmitting] = useState(false);
  const [isStageUpdating, setIsStageUpdating] = useState(false);
  const [isFollowupSubmitting, setIsFollowupSubmitting] = useState(false);
  const [completingFollowupId, setCompletingFollowupId] = useState(null);
  const [error, setError] = useState("");
  const canEditLead = hasPermission("LEAD_EDIT");
  const canCreateFollowup = hasPermission("FOLLOWUP_CREATE");
  const canCompleteFollowup = hasPermission("FOLLOWUP_COMPLETE");
  const organizationId = getStoredOrganizationId();
  const leadSummary = getLeadSummary(lead);

  const fetchLead = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await api.get(`/api/leads/${id}`);
      const leadData = response.data?.data ?? null;
      setLead(leadData);
      setSelectedStage(leadData?.currentStage ?? "");
      setFieldForm(leadData?.fields ?? []);
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message || "Unable to load lead details";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchFollowups = useCallback(async () => {
    try {
      const response = await api.get(`/api/followups/lead/${id}`);
      const followupList = response.data?.data ?? [];
      setFollowups(Array.isArray(followupList) ? followupList : []);
    } catch {
      setFollowups([]);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setError("");
      fetchLead();
      fetchFollowups();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchFollowups, fetchLead]);

  useEffect(() => {
    const fetchOrganizationSetup = async () => {
      const setupOrganizationId = lead?.organizationId ?? organizationId;
      if (!setupOrganizationId) {
        setPipelineStages([]);
        return;
      }

      try {
        const response = await api.get(
          `/api/organizations/${setupOrganizationId}/effective-setup`
        );
        const stages = response.data?.data?.pipelineStages ?? [];
        setPipelineStages(
          Array.isArray(stages)
            ? stages
                .filter((stage) => stage.active)
                .sort(
                  (firstStage, secondStage) =>
                    (firstStage.displayOrder ?? 0) -
                    (secondStage.displayOrder ?? 0)
                )
            : []
        );
      } catch {
        setPipelineStages([]);
      }
    };

    fetchOrganizationSetup();
  }, [lead?.organizationId, organizationId]);

  const handleStageChange = async (event) => {
    const nextStage = event.target.value;
    setSelectedStage(nextStage);
    setIsStageUpdating(true);
    setError("");

    try {
      const response = await api.put(`/api/leads/${id}/stage`, {
        currentStage: nextStage,
      });
      const updatedLead = response.data?.data;
      setLead(updatedLead);
      setSelectedStage(updatedLead?.currentStage ?? nextStage);
    } catch (stageError) {
      const message =
        stageError.response?.data?.message || "Unable to update lead stage";
      setError(message);
      setSelectedStage(lead?.currentStage ?? "");
    } finally {
      setIsStageUpdating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await api.post(`/api/leads/${id}/notes`, {
        noteText,
      });

      setNoteText("");
      await fetchLead();
    } catch (submitError) {
      const message =
        submitError.response?.data?.message || "Unable to add note";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName, fieldValue) => {
    setFieldForm((currentFields) =>
      currentFields.map((field) =>
        field.fieldName === fieldName ? { ...field, fieldValue } : field
      )
    );
  };

  const handleEditFields = () => {
    setFieldForm(lead?.fields ?? []);
    setIsEditingFields(true);
  };

  const handleCancelFieldEdit = () => {
    setFieldForm(lead?.fields ?? []);
    setIsEditingFields(false);
  };

  const handleSaveFields = async (event) => {
    event.preventDefault();
    setIsFieldsSubmitting(true);
    setError("");

    try {
      const response = await api.put(`/api/leads/${id}/fields`, {
        fields: fieldForm.map((field) => ({
          fieldName: field.fieldName,
          fieldValue: field.fieldValue,
        })),
      });
      const updatedLead = response.data?.data;
      setLead(updatedLead);
      setFieldForm(updatedLead?.fields ?? []);
      setIsEditingFields(false);
      await fetchLead();
    } catch (fieldError) {
      const message =
        fieldError.response?.data?.message || "Unable to update lead fields";
      setError(message);
    } finally {
      setIsFieldsSubmitting(false);
    }
  };

  const handleFollowupChange = (event) => {
    const { name, value } = event.target;
    setFollowupForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleFollowupSubmit = async (event) => {
    event.preventDefault();
    setIsFollowupSubmitting(true);
    setError("");

    try {
      await api.post("/api/followups", {
        leadId: Number(id),
        followupDate:
          followupForm.followupDate.length === 16
            ? `${followupForm.followupDate}:00`
            : followupForm.followupDate,
        remarks: followupForm.remarks,
        status: "PENDING",
      });

      setFollowupForm({
        followupDate: "",
        remarks: "",
      });
      await fetchFollowups();
    } catch (submitError) {
      const message =
        submitError.response?.data?.message || "Unable to create follow-up";
      setError(message);
    } finally {
      setIsFollowupSubmitting(false);
    }
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
    } catch (completeError) {
      const message =
        completeError.response?.data?.message ||
        "Unable to complete follow-up";
      setError(message);
    } finally {
      setCompletingFollowupId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/leads"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to Leads
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {leadSummary.title || "Lead Details"}
          </h1>
          {lead ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>{leadSummary.leadNo}</p>
              {leadSummary.phone ? <p>Phone: {leadSummary.phone}</p> : null}
              {leadSummary.subtitle ? <p>{leadSummary.subtitle}</p> : null}
              {leadSummary.budget ? <p>Budget: {leadSummary.budget}</p> : null}
            </div>
          ) : null}
        </div>

        {lead ? (
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Stage: {lead.currentStage || "NEW"}
          </span>
        ) : null}
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Loading lead details...
        </div>
      ) : null}

      {!isLoading && lead ? (
        <div className="grid gap-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Lead ID</p>
                <p className="mt-1 font-semibold text-slate-950">#{lead.id}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Workflow ID</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {lead.workflowId || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Current Stage</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {lead.currentStage || "NEW"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Created Date</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {formatDate(lead.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <label
                htmlFor="currentStage"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Move Lead Stage
              </label>
              <select
                id="currentStage"
                value={selectedStage}
                onChange={handleStageChange}
                disabled={isStageUpdating || pipelineStages.length === 0}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:max-w-sm"
              >
                {pipelineStages.length === 0 ? (
                  <option value={selectedStage}>
                    {selectedStage || "No stages available"}
                  </option>
                ) : null}

                {pipelineStages.map((stage) => (
                  <option key={stage.id} value={stage.stageName}>
                    {stage.stageName}
                  </option>
                ))}
              </select>
              {isStageUpdating ? (
                <p className="mt-2 text-sm text-slate-500">Updating stage...</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-950">
                Dynamic Fields
              </h2>

              {!isEditingFields && canEditLead ? (
                <button
                  type="button"
                  onClick={handleEditFields}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600 sm:w-auto"
                >
                  Edit
                </button>
              ) : null}
            </div>

            {isEditingFields ? (
              <form className="mt-4" onSubmit={handleSaveFields}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fieldForm.map((field) => (
                    <div key={field.fieldName}>
                      <label
                        htmlFor={`field-${field.fieldName}`}
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        {field.fieldName}
                      </label>
                      <input
                        id={`field-${field.fieldName}`}
                        value={field.fieldValue ?? ""}
                        onChange={(event) =>
                          handleFieldChange(field.fieldName, event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isFieldsSubmitting}
                    className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isFieldsSubmitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelFieldEdit}
                    disabled={isFieldsSubmitting}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(lead.fields ?? []).map((field) => (
                  <div
                    key={field.fieldName}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <p className="text-sm font-medium text-slate-500">
                      {field.fieldName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {field.fieldValue || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Notes</h2>

            <form className="mt-4" onSubmit={handleSubmit}>
              <label
                htmlFor="noteText"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Add Note
              </label>
              <textarea
                id="noteText"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                rows="4"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Customer interested. Follow up tomorrow."
                required
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? "Adding..." : "Add Note"}
              </button>
            </form>

            <div className="mt-5 grid gap-3">
              {(lead.notes ?? []).length === 0 ? (
                <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">
                  No notes yet.
                </p>
              ) : null}

              {(lead.notes ?? []).map((note, index) => (
                <article
                  key={`${note.noteText}-${index}`}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-sm text-slate-700">{note.noteText}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Follow-ups
            </h2>

            {canCreateFollowup ? (
              <form
                className="mt-4 grid gap-4 sm:grid-cols-2"
                onSubmit={handleFollowupSubmit}
              >
                <div>
                  <label
                    htmlFor="followupDate"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Follow-up Date
                  </label>
                  <input
                    id="followupDate"
                    name="followupDate"
                    type="datetime-local"
                    value={followupForm.followupDate}
                    onChange={handleFollowupChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="remarks"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={followupForm.remarks}
                    onChange={handleFollowupChange}
                    rows="3"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    placeholder="Call customer for confirmation"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isFollowupSubmitting}
                    className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isFollowupSubmitting
                      ? "Scheduling..."
                      : "Schedule Follow-up"}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="mt-5 grid gap-3">
              {followups.length === 0 ? (
                <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">
                  No follow-ups scheduled
                </p>
              ) : null}

              {followups.map((followup) => {
                const isPending = followup.status === "PENDING";

                return (
                  <article
                    key={followup.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {formatDateTime(followup.followupDate)}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {followup.remarks || "-"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          followup.status
                        )}`}
                      >
                        {followup.status || "PENDING"}
                      </span>
                    </div>

                    {isPending && canCompleteFollowup ? (
                      <button
                        type="button"
                        onClick={() => handleMarkComplete(followup.id)}
                        disabled={completingFollowupId === followup.id}
                        className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                      >
                        {completingFollowupId === followup.id
                          ? "Updating..."
                          : "Mark Complete"}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default LeadDetails;
