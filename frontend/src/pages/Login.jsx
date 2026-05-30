import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  decodeJwtPayload,
  getDashboardPathForRole,
  saveAuthSession,
} from "../utils/auth";

const DEFAULT_EMAIL = "admin@followmate.com";
const DEFAULT_PASSWORD = "admin123";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const token = response.data?.token ?? response.data?.data?.token;
      const responseRole = response.data?.role ?? response.data?.data?.role;
      const organizationId =
        response.data?.organizationId ?? response.data?.data?.organizationId;
      const permissions =
        response.data?.permissions ?? response.data?.data?.permissions ?? [];
      const forcePasswordChange = Boolean(
        response.data?.forcePasswordChange ??
          response.data?.data?.forcePasswordChange
      );

      if (!token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      const role = responseRole || decodeJwtPayload(token).role;

      if (!role) {
        throw new Error("Login succeeded but no role was returned.");
      }

      saveAuthSession({
        token,
        role,
        organizationId,
        permissions,
        forcePasswordChange,
      });
      alert("Login successful");
      navigate(
        forcePasswordChange ? "/change-password" : getDashboardPathForRole(role),
        { replace: true }
      );
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-950">FollowMate</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Business Growth CRM
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder="admin@followmate.com"
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder="admin123"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
