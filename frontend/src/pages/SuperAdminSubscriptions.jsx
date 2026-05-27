const subscriptionSections = [
  "Plans",
  "Active subscriptions",
  "Expiring subscriptions",
  "Payment status placeholder",
];

function SuperAdminSubscriptions() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Super Admin</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Subscriptions
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subscriptionSections.map((section) => (
          <article
            key={section}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-slate-950">
              {section}
            </h2>
            <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SuperAdminSubscriptions;
