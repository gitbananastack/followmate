import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getStoredOrganizationId } from "../utils/auth";
import { formatDateTime, getResponseList } from "../utils/crm";

const emptyResult = {
  totalRows: 0,
  successRows: 0,
  failedRows: 0,
};

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function buildInitialMapping(headers, leadFields) {
  const fieldsByNormalizedName = leadFields.reduce((fieldMap, field) => {
    const key = normalizeValue(field.fieldName);
    fieldMap[key] = field.fieldName;
    return fieldMap;
  }, {});

  return headers.reduce((mapping, header) => {
    mapping[header] = fieldsByNormalizedName[normalizeValue(header)] || "";
    return mapping;
  }, {});
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function CsvImport() {
  const organizationId = getStoredOrganizationId();
  const [selectedFile, setSelectedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [leadFields, setLeadFields] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [history, setHistory] = useState([]);
  const [errorsByBatchId, setErrorsByBatchId] = useState({});
  const [openErrorBatchId, setOpenErrorBatchId] = useState(null);
  const [result, setResult] = useState(emptyResult);
  const [step, setStep] = useState("upload");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  const mappedCount = useMemo(
    () => Object.values(columnMapping).filter(Boolean).length,
    [columnMapping]
  );

  const fetchHistory = useCallback(async () => {
    if (!organizationId) {
      setHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await api.get("/api/csv-import/history");
      setHistory(getResponseList(response));
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fetchLeadFields = useCallback(
    async (nextHeaders) => {
      if (!organizationId) {
        throw new Error("Organization is required for CSV import");
      }

      setIsLoadingSetup(true);
      try {
        const response = await api.get(
          `/api/organizations/${organizationId}/effective-setup`
        );
        const fields = [...(response.data?.data?.leadFields ?? [])]
          .filter((field) => field.active)
          .sort(
            (firstField, secondField) =>
              (firstField.displayOrder ?? 0) - (secondField.displayOrder ?? 0)
          );

        setLeadFields(fields);
        setColumnMapping(buildInitialMapping(nextHeaders, fields));
      } finally {
        setIsLoadingSetup(false);
      }
    },
    [organizationId]
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setHeaders([]);
    setPreviewRows([]);
    setColumnMapping({});
    setResult(emptyResult);
    setStep("upload");
    setError("");
  };

  const handlePreview = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Choose a CSV file first");
      return;
    }

    setIsPreviewing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await api.post("/api/csv-import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const preview = response.data?.data ?? {};
      const nextHeaders = Array.isArray(preview.headers)
        ? preview.headers
        : [];
      setHeaders(nextHeaders);
      setPreviewRows(
        Array.isArray(preview.previewRows) ? preview.previewRows : []
      );
      await fetchLeadFields(nextHeaders);
      setStep("mapping");
    } catch (previewError) {
      setError(getErrorMessage(previewError, "Unable to preview CSV"));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleMappingChange = (header, value) => {
    setColumnMapping((currentMapping) => ({
      ...currentMapping,
      [header]: value,
    }));
  };

  const handleImport = async () => {
    if (!selectedFile || mappedCount === 0) {
      setError("Map at least one CSV column before importing");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const activeMapping = Object.fromEntries(
        Object.entries(columnMapping).filter(([, fieldName]) => fieldName)
      );
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("columnMapping", JSON.stringify(activeMapping));

      const response = await api.post("/api/csv-import/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const importResult = response.data?.data ?? emptyResult;
      setResult(importResult);
      setStep("result");
      await fetchHistory();
    } catch (importError) {
      setError(getErrorMessage(importError, "Unable to import CSV"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleViewErrors = async (batchId) => {
    if (openErrorBatchId === batchId) {
      setOpenErrorBatchId(null);
      return;
    }

    setOpenErrorBatchId(batchId);
    if (errorsByBatchId[batchId]) {
      return;
    }

    try {
      const response = await api.get(`/api/csv-import/history/${batchId}/errors`);
      setErrorsByBatchId((currentErrors) => ({
        ...currentErrors,
        [batchId]: getResponseList(response),
      }));
    } catch (loadError) {
      setErrorsByBatchId((currentErrors) => ({
        ...currentErrors,
        [batchId]: [
          {
            id: "load-error",
            rowNumber: "-",
            errorMessage: getErrorMessage(loadError, "Unable to load errors"),
            rawRowData: "",
          },
        ],
      }));
    }
  };

  const canImport = Boolean(selectedFile && mappedCount > 0 && !isImporting);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Business Portal</p>
        <h1 className="text-2xl font-semibold text-slate-950">CSV Import</h1>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!organizationId ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Select an organization before importing leads.
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                {["upload", "mapping", "result"].map((stepName, index) => (
                  <span
                    key={stepName}
                    className={[
                      "rounded-full px-3 py-1",
                      step === stepName
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {index + 1}. {stepName}
                  </span>
                ))}
              </div>

              <form onSubmit={handlePreview} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Upload CSV
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!selectedFile || isPreviewing}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                >
                  {isPreviewing ? "Previewing..." : "Preview CSV"}
                </button>
              </form>
            </div>

            {headers.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Preview
                    </h2>
                    <p className="text-sm text-slate-500">
                      {headers.length} headers, first {previewRows.length} rows
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {headers.map((header) => (
                    <span
                      key={header}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {header}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewRows.map((row, rowIndex) => (
                        <tr key={`${rowIndex}-${headers.join("-")}`}>
                          {headers.map((header) => (
                            <td
                              key={header}
                              className="max-w-48 truncate px-3 py-2 text-slate-600"
                            >
                              {row[header] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {step !== "upload" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Column Mapping
                  </h2>
                  <p className="text-sm text-slate-500">
                    {mappedCount} of {headers.length} columns mapped
                  </p>
                </div>

                <div className="space-y-3">
                  {headers.map((header) => (
                    <div
                      key={header}
                      className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {header}
                        </p>
                        <p className="text-xs text-slate-500">CSV header</p>
                      </div>
                      <select
                        value={columnMapping[header] || ""}
                        onChange={(event) =>
                          handleMappingChange(header, event.target.value)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Do not import</option>
                        {leadFields.map((field) => (
                          <option key={field.fieldName} value={field.fieldName}>
                            {field.fieldLabel || field.fieldName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!canImport || isLoadingSetup}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                >
                  {isImporting ? "Importing..." : "Import Leads"}
                </button>
              </div>
            ) : null}

            {step === "result" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Import Result
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ResultTile label="Total Rows" value={result.totalRows} />
                  <ResultTile label="Success Rows" value={result.successRows} />
                  <ResultTile label="Failed Rows" value={result.failedRows} />
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Import History
                </h2>
                <p className="text-sm text-slate-500">
                  {isLoadingHistory ? "Loading..." : `${history.length} batches`}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No CSV imports yet.
                </p>
              ) : (
                history.map((batch) => (
                  <article
                    key={batch.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {batch.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(batch.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {batch.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <HistoryCount label="Total" value={batch.totalRows} />
                      <HistoryCount label="Success" value={batch.successRows} />
                      <HistoryCount label="Failed" value={batch.failedRows} />
                    </div>
                    {batch.failedRows > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleViewErrors(batch.id)}
                        className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {openErrorBatchId === batch.id ? "Hide Errors" : "View Errors"}
                      </button>
                    ) : null}
                    {openErrorBatchId === batch.id ? (
                      <div className="mt-3 space-y-2">
                        {(errorsByBatchId[batch.id] || []).map((rowError) => (
                          <div
                            key={rowError.id}
                            className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
                          >
                            <p className="font-semibold">
                              Row {rowError.rowNumber}: {rowError.errorMessage}
                            </p>
                            {rowError.rawRowData ? (
                              <p className="mt-1 break-words text-red-600">
                                {rowError.rawRowData}
                              </p>
                            ) : null}
                          </div>
                        ))}
                        {!errorsByBatchId[batch.id] ? (
                          <p className="text-sm text-slate-500">
                            Loading errors...
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ResultTile({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value ?? 0}</p>
    </div>
  );
}

function HistoryCount({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <p className="font-semibold text-slate-950">{value ?? 0}</p>
      <p className="text-slate-500">{label}</p>
    </div>
  );
}

export default CsvImport;
