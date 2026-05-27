const templates = [
  "Art Gallery",
  "Real Estate",
  "Education",
  "Service Business",
  "Custom Business",
];

function SuperAdminTemplates() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Super Admin</p>
        <h1 className="text-2xl font-semibold text-slate-950">Templates</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              {template}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Template setup placeholder
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SuperAdminTemplates;
