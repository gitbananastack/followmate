import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatDate, formatDateTime } from "../utils/crm";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getOneMonthFromToday() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function SuperAdminOrganizationAddons() {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [addons, setAddons] = useState([]);
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingAddonId, setUpdatingAddonId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const featureSet = useMemo(() => new Set(features), [features]);

  const fetchAddonData = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const [organizationResponse, addonsResponse, featuresResponse] =
        await Promise.all([
          api.get(`/api/organizations/${orgId}`),
          api.get(`/api/organizations/${orgId}/addons`),
          api.get(`/api/organizations/${orgId}/features`),
        ]);

      setOrganization(organizationResponse.data?.data ?? null);
      setAddons(addonsResponse.data?.data ?? []);
      setFeatures(featuresResponse.data?.data?.features ?? []);
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message || "Unable to load add-ons"
      );
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchAddonData, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchAddonData]);

  const handleEnable = async (addonId) => {
    setUpdatingAddonId(addonId);
    setError("");
    setSuccess("");

    try {
      await api.post(`/api/organizations/${orgId}/addons/${addonId}/enable`, {
        startDate: getToday(),
        expiryDate: getOneMonthFromToday(),
      });

      await fetchAddonData();
      setSuccess("Add-on enabled successfully");
    } catch (enableError) {
      setError(
        enableError.response?.data?.message || "Unable to enable add-on"
      );
    } finally {
      setUpdatingAddonId(null);
    }
  };

  const handleDisable = async (addonId) => {
    setUpdatingAddonId(addonId);
    setError("");
    setSuccess("");

    try {
      await api.post(`/api/organizations/${orgId}/addons/${addonId}/disable`);
      await fetchAddonData();
      setSuccess("Add-on disabled successfully");
    } catch (disableError) {
      setError(
        disableError.response?.data?.message || "Unable to disable add-on"
      );
    } finally {
      setUpdatingAddonId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Link
          to="/super-admin/organizations"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Organizations
        </Link>
        <p className="mt-4 text-sm font-medium text-blue-600">Super Admin</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          {organization?.organizationName || "Manage Add-ons"}
        </h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Loading add-ons...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Active Features
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.length === 0 ? (
                <p className="text-sm text-slate-500">No active features.</p>
              ) : (
                features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    {feature}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {addons.map((addon) => {
              const isEnabled = Boolean(addon.enabled);
              const isUpdating = updatingAddonId === addon.addonId;

              return (
                <article
                  key={addon.addonId}
                  className={[
                    "flex min-h-full flex-col rounded-xl border bg-white p-5 shadow-sm",
                    isEnabled ? "border-green-400" : "border-slate-200",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        {addon.addonCode}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">
                        {addon.addonName}
                      </h2>
                    </div>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        isEnabled
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {addon.description || "-"}
                  </p>

                  <div className="mt-4 grid gap-3 text-sm">
                    <InfoCell
                      label="Monthly Price"
                      value={formatPrice(addon.monthlyPrice)}
                    />
                    <InfoCell label="Feature Code" value={addon.featureCode} />
                    <InfoCell label="Start Date" value={formatDate(addon.startDate)} />
                    <InfoCell label="Expiry Date" value={formatDate(addon.expiryDate)} />
                    <InfoCell
                      label="Feature Access"
                      value={featureSet.has(addon.featureCode) ? "Active" : "Inactive"}
                    />
                  </div>

                  <div className="mt-5 flex-1" />

                  {isEnabled ? (
                    <button
                      type="button"
                      onClick={() => handleDisable(addon.addonId)}
                      disabled={updatingAddonId !== null}
                      className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isUpdating ? "Disabling..." : "Disable"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnable(addon.addonId)}
                      disabled={updatingAddonId !== null}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isUpdating ? "Enabling..." : "Enable"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>

          <p className="text-xs text-slate-500">
            Dates are assigned automatically from {formatDateTime(getToday())} to{" "}
            {formatDateTime(getOneMonthFromToday())} when enabling an add-on.
          </p>
        </div>
      ) : null}
    </main>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value || "-"}
      </p>
    </div>
  );
}

export default SuperAdminOrganizationAddons;
