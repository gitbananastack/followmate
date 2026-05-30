import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getStoredOrganizationId } from "../utils/auth";
import { formatDate } from "../utils/crm";

function getStatusBadgeClass(status) {
  if (status === "ACTIVE" || status === "TRIAL") {
    return "bg-green-50 text-green-700";
  }

  if (status === "EXPIRED" || status === "CANCELLED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function Billing() {
  const organizationId = getStoredOrganizationId();
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState([]);
  const [addons, setAddons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const enabledAddons = useMemo(
    () => addons.filter((addon) => addon.enabled),
    [addons]
  );

  const fetchBillingDetails = useCallback(async () => {
    setError("");
    setIsLoading(true);

    if (!organizationId) {
      setError("Organization is required to view billing");
      setIsLoading(false);
      return;
    }

    try {
      const [featuresResponse, addonsResponse] = await Promise.all([
        api.get(`/api/organizations/${organizationId}/features`),
        api.get(`/api/organizations/${organizationId}/addons`),
      ]);

      setFeatures(featuresResponse.data?.data?.features ?? []);
      setAddons(addonsResponse.data?.data ?? []);

      try {
        const subscriptionResponse = await api.get(
          `/api/organizations/${organizationId}/subscription`
        );
        setSubscription(subscriptionResponse.data?.data ?? null);
      } catch {
        setSubscription(null);
      }
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message || "Unable to load billing details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchBillingDetails, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBillingDetails]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Link
          to="/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Settings
        </Link>
        <p className="mt-4 text-sm font-medium text-blue-600">
          Business Portal
        </p>
        <h1 className="text-2xl font-semibold text-slate-950">Billing</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Loading billing details...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCell
                label="Current Plan"
                value={subscription?.planName || "No active plan"}
              />
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                    subscription?.status
                  )}`}
                >
                  {subscription?.status || "NONE"}
                </span>
              </div>
              <SummaryCell
                label="Expiry Date"
                value={formatDate(subscription?.expiryDate)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Enabled Features
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.length === 0 ? (
                <p className="text-sm text-slate-500">No enabled features.</p>
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

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Enabled Add-ons
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {enabledAddons.length === 0 ? (
                <p className="text-sm text-slate-500">No enabled add-ons.</p>
              ) : (
                enabledAddons.map((addon) => (
                  <article
                    key={addon.addonId}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                          {addon.addonName}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {addon.featureCode}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Enabled
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <InfoCell
                        label="Start Date"
                        value={formatDate(addon.startDate)}
                      />
                      <InfoCell
                        label="Expiry Date"
                        value={formatDate(addon.expiryDate)}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm font-medium text-blue-800">
            To upgrade your plan or enable add-ons, contact FollowMate support.
          </section>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCell({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

export default Billing;
