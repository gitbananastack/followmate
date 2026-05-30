import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getResponseList } from "../utils/crm";

const steps = [
  "Organization Details",
  "Business Type & Template",
  "CRM Setup",
  "Review",
];

const fieldTypes = [
  "TEXT",
  "NUMBER",
  "DATE",
  "DROPDOWN",
  "CHECKBOX",
  "TEXTAREA",
  "EMAIL",
  "PHONE",
];

const initialDetails = {
  organizationName: "",
  email: "",
  phone: "",
  address: "",
};

const emptyField = {
  fieldName: "",
  fieldLabel: "",
  fieldType: "TEXT",
  mandatory: false,
  displayOrder: 1,
  dropdownOptions: "",
  active: true,
};

const emptyStage = {
  stageName: "",
  displayOrder: 1,
  active: true,
};

function sortByDisplayOrder(items) {
  return [...toArray(items)].sort(
    (firstItem, secondItem) =>
      (firstItem.displayOrder ?? 0) - (secondItem.displayOrder ?? 0)
  );
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function isActive(item) {
  return item?.active !== false;
}

function reorderItems(items, index, direction) {
  const safeItems = toArray(items);
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= safeItems.length) {
    return safeItems;
  }

  const reorderedItems = [...safeItems];
  const currentItem = reorderedItems[index];
  reorderedItems[index] = reorderedItems[nextIndex];
  reorderedItems[nextIndex] = currentItem;

  return reorderedItems.map((item, itemIndex) => ({
    ...item,
    displayOrder: itemIndex + 1,
  }));
}

function toFieldPayload(field) {
  return {
    fieldName: field.fieldName,
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType,
    mandatory: Boolean(field.mandatory),
    displayOrder: Number(field.displayOrder) || 1,
    dropdownOptions: field.dropdownOptions || null,
    active: isActive(field),
  };
}

function toStagePayload(stage) {
  return {
    stageName: stage.stageName,
    displayOrder: Number(stage.displayOrder) || 1,
    active: isActive(stage),
  };
}

function getTemplateFields(template) {
  return toArray(template?.fields ?? template?.leadFields ?? []);
}

function getTemplateStages(template) {
  return toArray(template?.stages ?? template?.pipelineStages ?? []);
}

function OrganizationEnrollment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [details, setDetails] = useState(initialDetails);
  const [businessType, setBusinessType] = useState("");
  const [allTemplates, setAllTemplates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [leadFields, setLeadFields] = useState([]);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [templateSetupMessage, setTemplateSetupMessage] = useState("");

  useEffect(() => {
    const fetchBusinessTypes = async () => {
      setIsLoadingTemplates(true);
      setError("");

      try {
        const response = await api.get("/api/business-templates");
        const templateList = getResponseList(response);
        setAllTemplates(templateList);
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message || "Unable to load templates"
        );
        setAllTemplates([]);
        setTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchBusinessTypes();
  }, []);

  useEffect(() => {
    const fetchTemplatesByBusinessType = async () => {
      if (!businessType) {
        setTemplates([]);
        return;
      }

      setIsLoadingTemplates(true);
      setError("");

      try {
        const response = await api.get(
          `/api/business-templates?businessType=${encodeURIComponent(
            businessType
          )}`
        );
        setTemplates(getResponseList(response));
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message || "Unable to load templates"
        );
        setTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplatesByBusinessType();
  }, [businessType]);

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!selectedTemplateId) {
        setSelectedTemplate(null);
        setLeadFields([]);
        setPipelineStages([]);
        return;
      }

      setIsLoadingTemplate(true);
      setError("");

      try {
        const response = await api.get(
          `/api/business-templates/${selectedTemplateId}`
        );
        const template = response.data?.data ?? null;
        const fields = getTemplateFields(template);
        const stages = getTemplateStages(template);
        setSelectedTemplate(template);
        setLeadFields(
          sortByDisplayOrder(fields).map((field) => ({
            ...field,
            active: true,
          }))
        );
        setPipelineStages(
          sortByDisplayOrder(stages).map((stage) => ({
            ...stage,
            active: true,
          }))
        );
        setTemplateSetupMessage(
          fields.length === 0 || stages.length === 0
            ? "Template setup data not found"
            : ""
        );
      } catch (fetchError) {
        console.error("Unable to load template setup", fetchError);
        setTemplateSetupMessage("Unable to load template setup");
        setSelectedTemplate(null);
        setLeadFields([]);
        setPipelineStages([]);
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    fetchTemplateDetails();
  }, [selectedTemplateId]);

  const businessTypes = useMemo(
    () =>
      [...new Set(allTemplates.map((template) => template.businessType))]
        .filter(Boolean)
        .sort(),
    [allTemplates]
  );

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    setDetails((currentDetails) => ({
      ...currentDetails,
      [name]: value,
    }));
  };

  const handleBusinessTypeChange = (event) => {
    setBusinessType(event.target.value);
    setSelectedTemplateId("");
    setSelectedTemplate(null);
    setLeadFields([]);
    setPipelineStages([]);
    setTemplateSetupMessage("");
  };

  const canContinue = () => {
    if (currentStep === 1) {
      return Boolean(
        details.organizationName.trim() &&
          details.email.trim() &&
          details.phone.trim()
      );
    }

    if (currentStep === 2) {
      return Boolean(businessType && selectedTemplateId);
    }

    if (currentStep === 3) {
      return leadFields.length > 0 && pipelineStages.length > 0;
    }

    return true;
  };

  const handleNext = () => {
    if (!canContinue()) {
      setError("Complete the required fields before continuing");
      return;
    }

    setError("");
    setCurrentStep((step) => Math.min(step + 1, steps.length));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const submitEnrollment = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/api/organizations/enroll", {
        ...details,
        businessType,
        sourceTemplateId: Number(selectedTemplateId),
        leadFields: sortByDisplayOrder(leadFields).map(toFieldPayload),
        pipelineStages: sortByDisplayOrder(pipelineStages).map(toStagePayload),
      });
      navigate("/super-admin/organizations", { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Unable to enroll organization"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Link
          to="/super-admin/organizations"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Organizations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Create Organization
        </h1>
      </header>

      <div className="mb-6 grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              currentStep === index + 1
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : currentStep > index + 1
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {index + 1}. {step}
          </div>
        ))}
      </div>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {currentStep === 1 ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Organization Details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Organization Name
                <input
                  name="organizationName"
                  value={details.organizationName}
                  onChange={handleDetailsChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  name="email"
                  type="email"
                  value={details.email}
                  onChange={handleDetailsChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input
                  name="phone"
                  value={details.phone}
                  onChange={handleDetailsChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Address
                <textarea
                  name="address"
                  value={details.address}
                  onChange={handleDetailsChange}
                  rows="3"
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
                />
              </label>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Organization name, email, and phone are required.
            </p>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Business Type & Template
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Business Type
                <select
                  value={businessType}
                  onChange={handleBusinessTypeChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">Select business type</option>
                  {isLoadingTemplates && businessTypes.length === 0 ? (
                    <option value="" disabled>
                      Loading business types
                    </option>
                  ) : null}
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Template
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  disabled={!businessType || isLoadingTemplates}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100"
                >
                  <option value="">
                    {isLoadingTemplates ? "Loading templates" : "Select template"}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.templateName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {businessType && !isLoadingTemplates && templates.length === 0 ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No templates found for this business type.
              </p>
            ) : null}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <CRMSetupStep
            leadFields={leadFields}
            setLeadFields={setLeadFields}
            pipelineStages={pipelineStages}
            setPipelineStages={setPipelineStages}
            templateSetupMessage={templateSetupMessage}
            isLoadingTemplate={isLoadingTemplate}
          />
        ) : null}

        {currentStep === 4 ? (
          <ReviewStep
            details={details}
            businessType={businessType}
            selectedTemplate={selectedTemplate}
            leadFields={leadFields}
            pipelineStages={pipelineStages}
            onEditStep={setCurrentStep}
          />
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? () => navigate("/super-admin/organizations") : handleBack}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue()}
              className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submitEnrollment}
              disabled={isSubmitting}
              className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create & Finalize Organization"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function CRMSetupStep({
  leadFields,
  setLeadFields,
  pipelineStages,
  setPipelineStages,
  templateSetupMessage,
  isLoadingTemplate,
}) {
  const safeLeadFields = toArray(leadFields);
  const safePipelineStages = toArray(pipelineStages);
  const hasSetupData =
    safeLeadFields.length > 0 && safePipelineStages.length > 0;

  const updateField = (index, key, value) => {
    setLeadFields((currentFields) =>
      sortByDisplayOrder(currentFields).map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field
      )
    );
  };

  const updateStage = (index, key, value) => {
    setPipelineStages((currentStages) =>
      sortByDisplayOrder(currentStages).map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, [key]: value } : stage
      )
    );
  };

  const moveField = (index, direction) => {
    setLeadFields((currentFields) =>
      reorderItems(sortByDisplayOrder(currentFields), index, direction)
    );
  };

  const moveStage = (index, direction) => {
    setPipelineStages((currentStages) =>
      reorderItems(sortByDisplayOrder(currentStages), index, direction)
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {isLoadingTemplate ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:col-span-2">
          Loading template setup...
        </p>
      ) : null}

      {!isLoadingTemplate && (!hasSetupData || templateSetupMessage) ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:col-span-2">
          {templateSetupMessage || "Template setup data not found"}
        </div>
      ) : null}

      <SetupEditor
        title="Lead Fields Setup"
        items={safeLeadFields}
        emptyItem={emptyField}
        setItems={setLeadFields}
        updateItem={updateField}
        moveItem={moveField}
        itemType="field"
      />
      <SetupEditor
        title="Pipeline Stages Setup"
        items={safePipelineStages}
        emptyItem={emptyStage}
        setItems={setPipelineStages}
        updateItem={updateStage}
        moveItem={moveStage}
        itemType="stage"
      />

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">
          Preview Lead Form
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sortByDisplayOrder(safeLeadFields)
            .filter(isActive)
            .map((field, index) => (
              <label
                key={`${field.fieldName || "field"}-${index}`}
                className={`block text-sm font-medium text-slate-700 ${
                  field.fieldType === "TEXTAREA" ? "sm:col-span-2" : ""
                }`}
              >
                {field.fieldLabel || field.fieldName || "Untitled Field"}
                {field.mandatory ? " *" : ""}
                {field.fieldType === "TEXTAREA" ? (
                  <textarea
                    disabled
                    rows="3"
                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                ) : field.fieldType === "DROPDOWN" ? (
                  <select
                    disabled
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option>
                      {(field.dropdownOptions || "Select option")
                        .split(",")
                        .map((option) => option.trim())
                        .filter(Boolean)[0] || "Select option"}
                    </option>
                  </select>
                ) : (
                  <input
                    disabled
                    placeholder={field.fieldType || "TEXT"}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                )}
              </label>
            ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">
          Preview Pipeline
        </h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {sortByDisplayOrder(safePipelineStages)
            .filter(isActive)
            .map((stage, index) => (
              <div
                key={`${stage.stageName || "stage"}-${index}`}
                className="min-w-40 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700"
              >
                {stage.stageName || "Untitled Stage"}
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function SetupEditor({
  title,
  items,
  emptyItem,
  setItems,
  updateItem,
  moveItem,
  itemType,
}) {
  const sortedItems = sortByDisplayOrder(items);

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <button
          type="button"
          onClick={() =>
            setItems((currentItems) => [
              ...toArray(currentItems),
              { ...emptyItem, displayOrder: toArray(currentItems).length + 1 },
            ])
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
        >
          Add
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {sortedItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No {itemType === "field" ? "lead fields" : "pipeline stages"} yet.
          </div>
        ) : null}
        {sortedItems.map((item, index) => (
          <div
            key={`${item.id ?? "new"}-${index}`}
            className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            {itemType === "field" ? (
              <>
                <input
                  aria-label="Field name"
                  value={item.fieldName}
                  onChange={(event) =>
                    updateItem(index, "fieldName", event.target.value)
                  }
                  placeholder="fieldName"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <input
                  aria-label="Field label"
                  value={item.fieldLabel}
                  onChange={(event) =>
                    updateItem(index, "fieldLabel", event.target.value)
                  }
                  placeholder="Field Label"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <select
                  aria-label="Field type"
                  value={item.fieldType}
                  onChange={(event) =>
                    updateItem(index, "fieldType", event.target.value)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  {fieldTypes.map((fieldType) => (
                    <option key={fieldType} value={fieldType}>
                      {fieldType}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Display order"
                  type="number"
                  value={item.displayOrder}
                  onChange={(event) =>
                    updateItem(index, "displayOrder", event.target.value)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                {item.fieldType === "DROPDOWN" ? (
                  <textarea
                    aria-label="Dropdown options"
                    value={item.dropdownOptions ?? ""}
                    onChange={(event) =>
                      updateItem(index, "dropdownOptions", event.target.value)
                    }
                    rows="2"
                    placeholder="Option A, Option B"
                    className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  />
                ) : null}
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(item.mandatory)}
                    onChange={(event) =>
                      updateItem(index, "mandatory", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Required
                </label>
              </>
            ) : (
              <>
                <input
                  aria-label="Stage name"
                  value={item.stageName}
                  onChange={(event) =>
                    updateItem(index, "stageName", event.target.value)
                  }
                  placeholder="Stage name"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <input
                  aria-label="Stage display order"
                  type="number"
                  value={item.displayOrder}
                  onChange={(event) =>
                    updateItem(index, "displayOrder", event.target.value)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === sortedItems.length - 1}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Down
              </button>
              <button
                type="button"
                onClick={() =>
                  setItems((currentItems) =>
                    sortByDisplayOrder(currentItems).filter(
                      (_, itemIndex) => itemIndex !== index
                    )
                  )
                }
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewStep({
  details,
  businessType,
  selectedTemplate,
  leadFields,
  pipelineStages,
  onEditStep,
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Review</h2>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
          >
            Edit Organization Details
          </button>
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <p>
            <span className="font-semibold">Organization:</span>{" "}
            {details.organizationName}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {details.email || "-"}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {details.phone || "-"}
          </p>
          <p>
            <span className="font-semibold">Address:</span>{" "}
            {details.address || "-"}
          </p>
          <p>
            <span className="font-semibold">Business Type:</span>{" "}
            {businessType}
          </p>
          <p>
            <span className="font-semibold">Template:</span>{" "}
            {selectedTemplate?.templateName || "-"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEditStep(2)}
          className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
        >
          Edit Business Type / Template
        </button>
      </section>

      <section className="grid gap-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Lead Fields
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
            >
              Edit CRM Setup
            </button>
          </div>
          <div className="mt-2 grid gap-2">
            {sortByDisplayOrder(leadFields).map((field) => (
              <div
                key={field.fieldName}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {field.displayOrder}. {field.fieldLabel} ({field.fieldType})
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Pipeline Stages
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {sortByDisplayOrder(pipelineStages).map((stage) => (
              <span
                key={stage.stageName}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
              >
                {stage.displayOrder}. {stage.stageName}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default OrganizationEnrollment;
