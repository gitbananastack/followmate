import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getResponseList } from "../utils/crm";

const emptySummary = {
  totalLeads: 0,
  openLeads: 0,
  wonLeads: 0,
  lostLeads: 0,
  pendingFollowups: 0,
  completedFollowups: 0,
  overdueFollowups: 0,
  conversionRate: 0,
};

const emptyFollowups = {
  pending: 0,
  completed: 0,
  overdue: 0,
  today: 0,
};

function Reports() {
  const [summary, setSummary] = useState(emptySummary);
  const [funnel, setFunnel] = useState([]);
  const [followups, setFollowups] = useState(emptyFollowups);
  const [sources, setSources] = useState([]);
  const [aging, setAging] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [
          summaryResponse,
          funnelResponse,
          followupsResponse,
          sourcesResponse,
          agingResponse,
        ] = await Promise.all([
          api.get("/api/reports/summary"),
          api.get("/api/reports/lead-funnel"),
          api.get("/api/reports/followups"),
          api.get("/api/reports/lead-sources"),
          api.get("/api/reports/lead-aging"),
        ]);

        setSummary({
          ...emptySummary,
          ...(summaryResponse.data?.data ?? {}),
        });
        setFunnel(getResponseList(funnelResponse));
        setFollowups({
          ...emptyFollowups,
          ...(followupsResponse.data?.data ?? {}),
        });
        setSources(getResponseList(sourcesResponse));
        setAging(getResponseList(agingResponse));
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message || "Unable to load reports"
        );
        setSummary(emptySummary);
        setFunnel([]);
        setFollowups(emptyFollowups);
        setSources([]);
        setAging([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: "Total Leads", value: summary.totalLeads },
      { label: "Open Leads", value: summary.openLeads },
      { label: "Won Leads", value: summary.wonLeads },
      { label: "Lost Leads", value: summary.lostLeads },
      { label: "Pending Follow-ups", value: summary.pendingFollowups },
      { label: "Overdue Follow-ups", value: summary.overdueFollowups },
      {
        label: "Conversion Rate",
        value: `${Number(summary.conversionRate || 0).toFixed(1)}%`,
      },
    ],
    [summary]
  );

  const followupCards = [
    { label: "Pending", value: followups.pending },
    { label: "Completed", value: followups.completed },
    { label: "Overdue", value: followups.overdue },
    { label: "Today", value: followups.today },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Business Insights</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Reports & Analytics
        </h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Summary</h2>
            {isLoading ? (
              <span className="text-sm text-slate-500">Loading...</span>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={isLoading ? "..." : card.value}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <ReportPanel
            title="Lead Funnel"
            emptyText="No lead stages found yet."
            hasData={funnel.length > 0}
          >
            <BarList
              items={funnel}
              labelKey="stageName"
              valueKey="count"
              colorClass="bg-blue-600"
            />
          </ReportPanel>

          <ReportPanel title="Follow-up Performance" hasData>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {followupCards.map((card) => (
                <MetricRow
                  key={card.label}
                  label={card.label}
                  value={isLoading ? "..." : card.value}
                />
              ))}
            </div>
          </ReportPanel>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportPanel
            title="Lead Sources"
            emptyText="No lead source data yet."
            hasData={sources.length > 0}
          >
            <BarList
              items={sources}
              labelKey="source"
              valueKey="count"
              colorClass="bg-emerald-600"
            />
          </ReportPanel>

          <ReportPanel
            title="Lead Aging"
            emptyText="No open leads to age yet."
            hasData={aging.length > 0}
          >
            <BarList
              items={aging}
              labelKey="bucket"
              valueKey="count"
              colorClass="bg-amber-500"
            />
          </ReportPanel>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-lg font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function ReportPanel({ title, emptyText, hasData, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">
        {hasData ? (
          children
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

function BarList({ items, labelKey, valueKey, colorClass }) {
  const maxValue = Math.max(
    1,
    ...items.map((item) => Number(item[valueKey] ?? 0))
  );

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const label = item[labelKey] || "Unknown";
        const value = Number(item[valueKey] ?? 0);
        const width = `${Math.max(4, (value / maxValue) * 100)}%`;

        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-slate-700">
                {label}
              </span>
              <span className="font-semibold text-slate-950">{value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Reports;
