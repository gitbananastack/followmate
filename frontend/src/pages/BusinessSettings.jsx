function BusinessSettings() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Business Portal</p>
        <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Business Settings
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Organization preferences and CRM settings will live here.
        </p>
      </section>
    </main>
  );
}

export default BusinessSettings;
