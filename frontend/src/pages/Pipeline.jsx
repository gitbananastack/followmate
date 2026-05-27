import { useEffect, useState } from "react";
import api from "../services/api";
import { getLeadField, getResponseList } from "../utils/crm";

const DEFAULT_WORKFLOW_ID = 1;

function getPipelineColumns(stages, leads) {
  const groupedLeads = stages.reduce((columns, stage) => {
    columns[stage.stageName] = [];
    return columns;
  }, {});

  leads.forEach((lead) => {
    if (!groupedLeads[lead.currentStage]) {
      groupedLeads[lead.currentStage] = [];
    }

    groupedLeads[lead.currentStage].push(lead);
  });

  return stages.map((stage) => ({
    ...stage,
    leads: groupedLeads[stage.stageName] ?? [],
  }));
}

function getFirstLeadField(lead, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = getLeadField(lead, fieldName);

    if (value) {
      return value;
    }
  }

  return "";
}

function Pipeline() {
  const [workflowStages, setWorkflowStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [updatingLeadId, setUpdatingLeadId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const [workflowResponse, leadsResponse] = await Promise.all([
          api.get(`/api/workflows/${DEFAULT_WORKFLOW_ID}`),
          api.get("/api/leads"),
        ]);

        const stages = workflowResponse.data?.data?.stages ?? [];
        setWorkflowStages(Array.isArray(stages) ? stages : []);
        setLeads(getResponseList(leadsResponse));
      } catch (fetchError) {
        const message =
          fetchError.response?.data?.message || "Unable to load pipeline";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipeline();
  }, []);

  const handleStageChange = async (leadId, nextStage) => {
    setUpdatingLeadId(leadId);
    setError("");

    try {
      const response = await api.put(`/api/leads/${leadId}/stage`, {
        currentStage: nextStage,
      });
      const updatedLead = response.data?.data;
      setLeads((currentLeads) =>
        currentLeads.map((lead) => (lead.id === leadId ? updatedLead : lead))
      );
    } catch (stageError) {
      const message =
        stageError.response?.data?.message || "Unable to update lead stage";
      setError(message);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const columns = getPipelineColumns(workflowStages, leads);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Sales Pipeline</p>
        <h1 className="text-2xl font-semibold text-slate-950">Pipeline</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Loading pipeline...
        </div>
      ) : null}

      {!isLoading ? (
        <section className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex max-h-[calc(100vh-180px)] min-w-72 flex-col rounded-xl border border-slate-200 bg-slate-100"
            >
              <header className="sticky top-0 rounded-t-xl border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-950">
                    {column.stageName}
                  </h2>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                    {column.leads.length}
                  </span>
                </div>
              </header>

              <div className="grid gap-3 overflow-y-auto p-3">
                {column.leads.length === 0 ? (
                  <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                    No leads in this stage.
                  </p>
                ) : null}

                {column.leads.map((lead) => {
                  const customerName = getLeadField(lead, "customerName");
                  const phone = getFirstLeadField(lead, [
                    "phoneNumber",
                    "phone",
                    "mobile",
                    "mobileNumber",
                    "customerPhone",
                  ]);
                  const requirement =
                    getLeadField(lead, "artworkName") ||
                    getLeadField(lead, "requirement");
                  const budget = getLeadField(lead, "budget");

                  return (
                    <article
                      key={lead.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            Lead #{lead.id}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {customerName || `Lead #${lead.id}`}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                          {lead.currentStage}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        {phone ? <p>Phone: {phone}</p> : null}
                        <p>{requirement || "No requirement added"}</p>
                        {budget ? <p>Budget: {budget}</p> : null}
                      </div>

                      <label
                        htmlFor={`stage-${lead.id}`}
                        className="mt-4 block text-xs font-medium text-slate-500"
                      >
                        Move stage
                      </label>
                      <select
                        id={`stage-${lead.id}`}
                        value={lead.currentStage}
                        onChange={(event) =>
                          handleStageChange(lead.id, event.target.value)
                        }
                        disabled={updatingLeadId === lead.id}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        {workflowStages.map((stage) => (
                          <option key={stage.id} value={stage.stageName}>
                            {stage.stageName}
                          </option>
                        ))}
                      </select>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default Pipeline;
