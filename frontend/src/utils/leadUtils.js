const FIELD_COLLECTION_KEYS = [
  "fields",
  "dynamicFields",
  "leadDynamicFields",
  "dynamicValues",
  "fieldValues",
];

const NAME_KEYS = [
  "customername",
  "studentname",
  "clientname",
  "patientname",
  "parentname",
  "name",
];

const PHONE_KEYS = [
  "phonenumber",
  "phone",
  "mobile",
  "mobilenumber",
  "customerphone",
  "parentphone",
];

const REQUIREMENT_KEYS = [
  "artworkname",
  "courseinterested",
  "propertytype",
  "servicetype",
  "requirement",
  "inquiry",
  "interestedin",
  "productname",
];

const BUDGET_KEYS = ["budget", "budgetrange", "expectedbudget"];

function normalizeFieldKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getFieldCollection(lead) {
  for (const key of FIELD_COLLECTION_KEYS) {
    const value = lead?.[key];

    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === "object") {
      return Object.entries(value).map(([fieldName, fieldValue]) => ({
        fieldName,
        fieldValue,
      }));
    }
  }

  return [];
}

function getFieldName(field) {
  return (
    field?.fieldName ??
    field?.name ??
    field?.key ??
    field?.field_label ??
    field?.fieldLabel ??
    ""
  );
}

function getFieldValue(field) {
  return (
    field?.fieldValue ??
    field?.value ??
    field?.field_value ??
    field?.fieldValueText ??
    ""
  );
}

function getFirstValue(fieldMap, keys) {
  for (const key of keys) {
    const value = fieldMap[key];

    if (value) {
      return value;
    }
  }

  return "";
}

export function getDynamicFieldMap(lead) {
  return getFieldCollection(lead).reduce((fieldMap, field) => {
    const key = normalizeFieldKey(getFieldName(field));

    if (!key) {
      return fieldMap;
    }

    fieldMap[key] = String(getFieldValue(field) ?? "").trim();
    return fieldMap;
  }, {});
}

export function getLeadSummary(lead) {
  const fieldMap = getDynamicFieldMap(lead);

  return {
    leadNo: `Lead #${lead?.id ?? ""}`.trim(),
    title: getFirstValue(fieldMap, NAME_KEYS),
    phone: getFirstValue(fieldMap, PHONE_KEYS),
    subtitle: getFirstValue(fieldMap, REQUIREMENT_KEYS),
    budget: getFirstValue(fieldMap, BUDGET_KEYS),
  };
}

export function formatPhoneForWhatsApp(phone) {
  return String(phone || "")
    .replace(/[\s\-()]/g, "")
    .replace(/^\+/, "");
}

export function getTelLink(phone) {
  return `tel:${String(phone || "").trim()}`;
}
