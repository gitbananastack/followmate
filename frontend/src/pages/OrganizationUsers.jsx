import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import {
  getStoredOrganizationId,
  getStoredName,
  getStoredRole,
  saveAuthSession,
} from "../utils/auth";
import { getResponseList } from "../utils/crm";

const initialUserForm = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

const initialPasswordForm = {
  userId: null,
  newPassword: "",
};

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function OrganizationUsers() {
  const { organizationId: routeOrganizationId } = useParams();
  const role = getStoredRole();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isOrgAdmin = role === "ORG_ADMIN";

  const [organizationId, setOrganizationId] = useState(
    routeOrganizationId || getStoredOrganizationId()
  );
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password reset hidden for ORG_ADMIN until email OTP reset flow is implemented.
  const canResetPassword = isSuperAdmin;

  const roleOptions = useMemo(
    () => (isOrgAdmin ? ["STAFF"] : ["ORG_ADMIN", "STAFF"]),
    [isOrgAdmin]
  );

  useEffect(() => {
    const resolveOrganizationId = async () => {
      if (routeOrganizationId || organizationId) {
        return;
      }

      try {
        const response = await api.get("/api/me");
        const currentUser = response.data?.data;

        if (currentUser?.organizationId) {
          const nextOrganizationId = String(currentUser.organizationId);
          setOrganizationId(nextOrganizationId);
          saveAuthSession({
            token: localStorage.getItem("token"),
            role,
            name: getStoredName(),
            organizationId: nextOrganizationId,
          });
        }
      } catch (resolveError) {
        setError(
          getErrorMessage(resolveError, "Unable to resolve organization")
        );
      }
    };

    resolveOrganizationId();
  }, [organizationId, role, routeOrganizationId]);

  const fetchUsers = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await api.get(
        `/api/organizations/${organizationId}/users`
      );
      setUsers(getResponseList(response));
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, "Unable to load users"));
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchUsers, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchUsers]);

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;
    setUserForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/api/organizations/${organizationId}/users`, userForm);
      setUserForm({ ...initialUserForm, role: roleOptions[0] });
      setShowCreateForm(false);
      setSuccess("User created successfully");
      await fetchUsers();
    } catch (createError) {
      setError(getErrorMessage(createError, "Unable to create user"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserStatusChange = async (userId, action) => {
    setUpdatingUserId(userId);
    setError("");
    setSuccess("");

    try {
      await api.patch(
        `/api/organizations/${organizationId}/users/${userId}/${action}`
      );
      setSuccess(
        action === "activate"
          ? "User activated successfully"
          : "User deactivated successfully"
      );
      await fetchUsers();
    } catch (statusError) {
      setError(getErrorMessage(statusError, `Unable to ${action} user`));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.userId) {
      return;
    }

    setUpdatingUserId(passwordForm.userId);
    setError("");
    setSuccess("");

    try {
      await api.put(
        `/api/organizations/${organizationId}/users/${passwordForm.userId}/reset-password`,
        { newPassword: passwordForm.newPassword }
      );
      setPasswordForm(initialPasswordForm);
      setSuccess("Password reset successfully");
    } catch (resetError) {
      setError(getErrorMessage(resetError, "Unable to reset password"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            {isSuperAdmin ? "Super Admin" : "Settings"}
          </p>
          <h1 className="text-2xl font-semibold text-slate-950">
            Organization Users
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organization #{organizationId || "-"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isSuperAdmin ? (
            <Link
              to="/super-admin/organizations"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Organizations
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setShowCreateForm((currentValue) => !currentValue)}
            disabled={!organizationId}
            className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {showCreateForm ? "Close Form" : "Create User"}
          </button>
        </div>
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

      {showCreateForm ? (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">Create User</h2>

          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={handleCreateUser}
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                value={userForm.name}
                onChange={handleUserFormChange}
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
                value={userForm.email}
                onChange={handleUserFormChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={userForm.password}
                onChange={handleUserFormChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={
                  roleOptions.includes(userForm.role)
                    ? userForm.role
                    : roleOptions[0]
                }
                onChange={handleUserFormChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {roleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? "Creating..." : "Save User"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-4">
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              Loading users...
            </div>
          ) : null}

          {!isLoading && users.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              No users found.
            </div>
          ) : null}

          {!isLoading &&
            users
              .filter((user) => isSuperAdmin || user.role !== "SUPER_ADMIN")
              .map((user) => {
              const isActive = user.status === "ACTIVE";
              const canManageStatus =
                isSuperAdmin ||
                (isOrgAdmin && user.role === "STAFF");
              return (
                <article
                  key={user.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        User #{user.id}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">
                        {user.name}
                      </h2>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {user.role}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.status || "INACTIVE"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap">
                    {canManageStatus && isActive ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleUserStatusChange(user.id, "deactivate")
                        }
                        disabled={updatingUserId === user.id}
                        className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updatingUserId === user.id
                          ? "Updating..."
                          : "Deactivate"}
                      </button>
                    ) : null}

                    {canManageStatus && !isActive ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleUserStatusChange(user.id, "activate")
                        }
                        disabled={updatingUserId === user.id}
                        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updatingUserId === user.id
                          ? "Updating..."
                          : "Activate"}
                      </button>
                    ) : null}

                    {canResetPassword ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPasswordForm({
                            userId: user.id,
                            newPassword: "",
                          })
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                      >
                        Reset Password
                      </button>
                    ) : null}

                  </div>
                </article>
              );
            })}
        </div>

        <aside className="grid content-start gap-4">
          {canResetPassword && passwordForm.userId ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Reset Password
              </h2>
              <form className="mt-4 space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((currentForm) => ({
                        ...currentForm,
                        newPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={updatingUserId === passwordForm.userId}
                    className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updatingUserId === passwordForm.userId
                      ? "Saving..."
                      : "Save Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordForm(initialPasswordForm)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </aside>
      </section>

    </main>
  );
}

export default OrganizationUsers;
