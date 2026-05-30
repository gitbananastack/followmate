import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  getDashboardPathForRole,
  getStoredRole,
  saveAuthSession,
} from "../utils/auth";

function ChangePassword() {
  const navigate = useNavigate();
  const role = getStoredRole();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password must match");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put("/api/users/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      saveAuthSession({
        token: localStorage.getItem("token"),
        role,
        organizationId: localStorage.getItem("organizationId"),
        forcePasswordChange: false,
      });
      navigate(getDashboardPathForRole(role), { replace: true });
    } catch (changeError) {
      const message =
        changeError.response?.data?.message ||
        changeError.message ||
        "Unable to change password";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">FollowMate</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Change Password
          </h1>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save Password"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePassword;
