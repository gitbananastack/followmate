import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatDate } from "../utils/crm";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getOneMonthFromToday() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function formatPrice(value) {
  const price = Number(value || 0);
  if (price === 0) {
    return "Custom";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function SuperAdminOrganizationSubscription() {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningPlanId, setAssigningPlanId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPlanId = subscription?.planId;

  const activeFeatureSet = useMemo(() => new Set(features), [features]);

  const fetchSubscriptionData = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const [organizationResponse, plansResponse, featuresResponse] =
        await Promise.all([
          api.get(`/api/organizations/${orgId}`),
          api.get("/api/subscription/plans"),
          api.get(`/api/organizations/${orgId}/features`),
        ]);

      setOrganization(organizationResponse.data?.data ?? null);
      setPlans(plansResponse.data?.data ?? []);
      setFeatures(featuresResponse.data?.data?.features ?? []);

      try {
        const subscriptionResponse = await api.get(
          `/api/organizations/${orgId}/subscription`
        );
        setSubscription(subscriptionResponse.data?.data ?? null);
      } catch {
        setSubscription(null);
      }
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          "Unable to load subscription details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchSubscriptionData, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSubscriptionData]);

  const handleSelectPlan = async (planId) => {
    setAssigningPlanId(planId);
    setError("");
    setSuccess("");

    try {
      await api.post(`/api/organizations/${orgId}/subscription`, {
        planId,
        startDate: getToday(),
        expiryDate: getOneMonthFromToday(),
        status: "ACTIVE",
      });

      await fetchSubscriptionData();
      setSuccess("Subscription updated successfully");
    } catch (assignError) {
      setError(
        assignError.response?.data?.message ||
          "Unable to update subscription"
      );
    } finally {
      setAssigningPlanId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Link
          to="/super-admin/subscriptions"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Subscriptions
        </Link>
        <p className="mt-4 text-sm font-medium text-blue-600">Super Admin</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          {organization?.organizationName || "Manage Subscription"}
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
          Loading subscription details...
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
              <SummaryCell label="Status" value={subscription?.status || "-"} />
              <SummaryCell
                label="Expiry Date"
                value={formatDate(subscription?.expiryDate)}
              />
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Available Plans
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => {
                const isCurrent = currentPlanId === plan.id;
                return (
                  <article
                    key={plan.id}
                    className={[
                      "flex min-h-full flex-col rounded-xl border bg-white p-5 shadow-sm",
                      isCurrent ? "border-blue-500" : "border-slate-200",
                    ].join(" ")}
                  >
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        {plan.planCode}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-950">
                        {plan.planName}
                      </h3>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatPrice(plan.monthlyPrice)}
                      </p>
                    </div>

                    <div className="mt-4 flex-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Included Features
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(plan.features ?? []).map((feature) => (
                          <span
                            key={feature}
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              activeFeatureSet.has(feature)
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent || assigningPlanId !== null}
                      className={[
                        "mt-5 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed",
                        isCurrent
                          ? "bg-slate-100 text-slate-500"
                          : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300",
                      ].join(" ")}
                    >
                      {assigningPlanId === plan.id
                        ? "Updating..."
                        : isCurrent
                          ? "Current"
                          : "Select"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Active Features
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No active subscription features.
                </p>
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

export default SuperAdminOrganizationSubscription;
