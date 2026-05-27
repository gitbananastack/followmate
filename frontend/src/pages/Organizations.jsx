import { useEffect, useState } from "react";
import api from "../services/api";
import { formatDate, getResponseList } from "../utils/crm";

const initialFormState = {
  organizationName: "",
  businessType: "",
  email: "",
  phone: "",
  address: "",
};

function getStatusBadgeClass(status) {
  if (status === "ACTIVE") {
    return "bg-green-50 text-green-700";
  }

  if (status === "SUSPENDED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingOrganizationId, setUpdatingOrganizationId] = useState(null);
  const [error, setError] = useState("");

  const fetchOrganizations = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get("/api/organizations");
      setOrganizations(getResponseList(response));
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message || "Unable to load organizations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/api/organizations", form);
      setForm(initialFormState);
      setShowForm(false);
      await fetchOrganizations();
    } catch (submitError) {
      const message =
        submitError.response?.data?.message || "Unable to create organization";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (organizationId, action) => {
    setUpdatingOrganizationId(organizationId);
    setError("");

    try {
      const response = await api.patch(
        `/api/organizations/${organizationId}/${action}`
      );
      const updatedOrganization = response.data?.data;

      setOrganizations((currentOrganizations) =>
        currentOrganizations.map((organization) =>
          organization.id === organizationId ? updatedOrganization : organization
        )
      );
    } catch (statusError) {
      const message =
        statusError.response?.data?.message ||
        `Unable to ${action} organization`;
      setError(message);
    } finally {
      setUpdatingOrganizationId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Super Admin</p>
          <h1 className="text-2xl font-semibold text-slate-950">
            Organizations
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((currentValue) => !currentValue)}
          className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Create Organization"}
        </button>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Create Organization
          </h2>

          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="organizationName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Organization Name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="businessType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business Type
              </label>
              <input
                id="businessType"
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows="3"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? "Creating..." : "Save Organization"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="grid gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading organizations...
          </div>
        ) : null}

        {!isLoading && organizations.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No organizations found.
          </div>
        ) : null}

        {!isLoading &&
          organizations.map((organization) => {
            const isActive = organization.status === "ACTIVE";
            const isSuspended = organization.status === "SUSPENDED";

            return (
              <article
                key={organization.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Organization #{organization.id}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {organization.organizationName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {organization.businessType}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                      organization.status
                    )}`}
                  >
                    {organization.status || "INACTIVE"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {organization.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {organization.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Created</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDate(organization.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Address</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {organization.address}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(organization.id, "activate")
                      }
                      disabled={updatingOrganizationId === organization.id}
                      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingOrganizationId === organization.id
                        ? "Updating..."
                        : "Activate"}
                    </button>
                  ) : null}

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(organization.id, "deactivate")
                      }
                      disabled={updatingOrganizationId === organization.id}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingOrganizationId === organization.id
                        ? "Updating..."
                        : "Deactivate"}
                    </button>
                  ) : null}

                  {!isSuspended ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(organization.id, "suspend")
                      }
                      disabled={updatingOrganizationId === organization.id}
                      className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingOrganizationId === organization.id
                        ? "Updating..."
                        : "Suspend"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
      </section>
    </main>
  );
}

export default Organizations;
