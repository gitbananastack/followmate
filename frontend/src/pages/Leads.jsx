import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LeadCard from "../components/LeadCard";
import api from "../services/api";
import { getResponseList, isPhoneField } from "../utils/crm";

const initialFormState = {};

const DEFAULT_ORGANIZATION_ID = 1;
const DEFAULT_TEMPLATE_ID = 1;
const DEFAULT_WORKFLOW_ID = 1;
const DEFAULT_COUNTRY_CODE = "+91";

const countryCodeOptions = [
  { label: "India", code: "+91" },
  { label: "UAE", code: "+971" },
  { label: "Saudi Arabia", code: "+966" },
  { label: "Qatar", code: "+974" },
  { label: "Oman", code: "+968" },
  { label: "Kuwait", code: "+965" },
  { label: "Bahrain", code: "+973" },
  { label: "United States", code: "+1" },
  { label: "United Kingdom", code: "+44" },
  { label: "Australia", code: "+61" },
  { label: "Canada", code: "+1" },
  { label: "Singapore", code: "+65" },
];

function getInputType(fieldType) {
  if (fieldType === "NUMBER") {
    return "number";
  }

  if (fieldType === "DATE") {
    return "date";
  }

  return "text";
}

function getEmptyTemplateForm(fields) {
  return fields.reduce((formValues, field) => {
    formValues[field.fieldName] = field.fieldType === "CHECKBOX" ? "false" : "";
    return formValues;
  }, {});
}

function getEmptyCountryCodeForm(fields) {
  return fields.reduce((countryCodes, field) => {
    if (isPhoneField(field.fieldName)) {
      countryCodes[field.fieldName] = DEFAULT_COUNTRY_CODE;
    }

    return countryCodes;
  }, {});
}

function formatPhoneValue(phoneValue, countryCode) {
  const trimmedValue = String(phoneValue || "").replace(/\s/g, "");

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.startsWith("+")) {
    return trimmedValue;
  }

  return `${countryCode}${trimmedValue.replace(/\D/g, "")}`;
}

function leadMatchesStage(lead, stage) {
  if (!stage) {
    return true;
  }

  return lead.currentStage === stage;
}

function getStageCount(leads, stage) {
  return leads.filter((lead) => leadMatchesStage(lead, stage)).length;
}

function Leads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedStage = searchParams.get("stage") || "";

  const [leads, setLeads] = useState([]);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [templateFields, setTemplateFields] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [countryCodes, setCountryCodes] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchLeadData = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get("/api/leads");
      setLeads(getResponseList(response));
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message || "Unable to load leads";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, []);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const response = await api.get(`/api/workflows/${DEFAULT_WORKFLOW_ID}`);
        const stages = response.data?.data?.stages ?? [];
        setWorkflowStages(Array.isArray(stages) ? stages : []);
      } catch (workflowError) {
        setWorkflowStages([]);
      }
    };

    fetchWorkflow();
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await api.get(`/api/templates/${DEFAULT_TEMPLATE_ID}`);
        const fields = [...(response.data?.data?.fields ?? [])].sort(
          (firstField, secondField) =>
            (firstField.displayOrder ?? 0) - (secondField.displayOrder ?? 0)
        );
        setTemplateFields(fields);
        setForm(getEmptyTemplateForm(fields));
        setCountryCodes(getEmptyCountryCodeForm(fields));
      } catch (templateError) {
        const message =
          templateError.response?.data?.message || "Unable to load lead form";
        setError(message);
      }
    };

    fetchTemplate();
  }, []);

  const handleStageFilter = (stage) => {
    if (!stage) {
      setSearchParams({});
      return;
    }

    setSearchParams({ stage });
  };

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? String(checked) : value,
    }));
  };

  const handleCountryCodeChange = (event) => {
    const { name, value } = event.target;
    setCountryCodes((currentCountryCodes) => ({
      ...currentCountryCodes,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/api/leads", {
        organizationId: DEFAULT_ORGANIZATION_ID,
        templateId: DEFAULT_TEMPLATE_ID,
        workflowId: DEFAULT_WORKFLOW_ID,
        fields: templateFields.map((field) => ({
          fieldName: field.fieldName,
          fieldValue: isPhoneField(field.fieldName)
            ? formatPhoneValue(
                form[field.fieldName],
                countryCodes[field.fieldName] ?? DEFAULT_COUNTRY_CODE
              )
            : form[field.fieldName] ?? "",
        })),
      });

      setForm(getEmptyTemplateForm(templateFields));
      setCountryCodes(getEmptyCountryCodeForm(templateFields));
      setShowForm(false);
      await fetchLeadData();
    } catch (submitError) {
      const message =
        submitError.response?.data?.message || "Unable to create lead";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((lead) =>
    leadMatchesStage(lead, selectedStage)
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Lead Pipeline</p>
          <h1 className="text-2xl font-semibold text-slate-950">Leads</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((currentValue) => !currentValue)}
          className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Create Lead"}
        </button>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">Create Lead</h2>

          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            {templateFields.length === 0 ? (
              <p className="text-sm text-slate-500 sm:col-span-2">
                Loading lead form...
              </p>
            ) : null}

            {templateFields.map((field) => (
              <div
                key={field.fieldName}
                className={
                  field.fieldType === "TEXTAREA" ? "sm:col-span-2" : ""
                }
              >
                <label
                  htmlFor={field.fieldName}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {field.fieldLabel}
                </label>

                {field.fieldType === "TEXTAREA" ? (
                  <textarea
                    id={field.fieldName}
                    name={field.fieldName}
                    value={form[field.fieldName] ?? ""}
                    onChange={handleChange}
                    rows="3"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    required={Boolean(field.mandatory)}
                  />
                ) : null}

                {field.fieldType === "DROPDOWN" ? (
                  <select
                    id={field.fieldName}
                    name={field.fieldName}
                    value={form[field.fieldName] ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    required={Boolean(field.mandatory)}
                  >
                    <option value="">Select {field.fieldLabel}</option>
                  </select>
                ) : null}

                {field.fieldType === "CHECKBOX" ? (
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    <input
                      id={field.fieldName}
                      name={field.fieldName}
                      type="checkbox"
                      checked={form[field.fieldName] === "true"}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    Yes
                  </label>
                ) : null}

                {!["TEXTAREA", "DROPDOWN", "CHECKBOX"].includes(
                  field.fieldType
                ) && isPhoneField(field.fieldName) ? (
                  <div className="flex gap-2">
                    <select
                      aria-label={`${field.fieldLabel} country code`}
                      name={field.fieldName}
                      value={
                        countryCodes[field.fieldName] ?? DEFAULT_COUNTRY_CODE
                      }
                      onChange={handleCountryCodeChange}
                      className="w-32 shrink-0 rounded-lg border border-slate-200 px-2 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    >
                      {countryCodeOptions.map((country) => (
                        <option
                          key={`${country.label}-${country.code}`}
                          value={country.code}
                        >
                          {country.label} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id={field.fieldName}
                      name={field.fieldName}
                      type="tel"
                      value={form[field.fieldName] ?? ""}
                      onChange={handleChange}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      required={Boolean(field.mandatory)}
                    />
                  </div>
                ) : null}

                {!["TEXTAREA", "DROPDOWN", "CHECKBOX"].includes(
                  field.fieldType
                ) && !isPhoneField(field.fieldName) ? (
                  <input
                    id={field.fieldName}
                    name={field.fieldName}
                    type={getInputType(field.fieldType)}
                    value={form[field.fieldName] ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    required={Boolean(field.mandatory)}
                  />
                ) : null}
              </div>
            ))}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting || templateFields.length === 0}
                className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? "Creating..." : "Save Lead"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => handleStageFilter("")}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            !selectedStage
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-700"
          }`}
        >
          All ({leads.length})
        </button>

        {workflowStages.map((stage) => {
          const isActive = selectedStage === stage.stageName;
          const count = getStageCount(leads, stage.stageName);

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleStageFilter(stage.stageName)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-700"
              }`}
            >
              {stage.stageName} ({count})
            </button>
          );
        })}
      </div>

      <section className="grid gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading leads...
          </div>
        ) : null}

        {!isLoading && filteredLeads.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No leads found.
          </div>
        ) : null}

        {!isLoading &&
          filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              showFollowupBadge={false}
              onViewDetails={() => navigate(`/leads/${lead.id}`)}
            />
          ))}
      </section>
    </main>
  );
}

export default Leads;
