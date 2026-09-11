import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { extractError } from "../../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const DEMO_ACCOUNTS: { role: string; email: string; password: string }[] = [
    { role: "Super Admin", email: "admin@hrms.local", password: "Admin@123" },
    { role: "Company Admin", email: "company_admin@hrms.local", password: "Hr@12345" },
    { role: "HR Admin", email: "hr_admin@hrms.local", password: "Hr@12345" },
    { role: "HR Manager", email: "hr_manager@hrms.local", password: "Hr@12345" },
    { role: "Dept Manager", email: "dept_manager@hrms.local", password: "Hr@12345" },
    { role: "Team Lead", email: "team_lead@hrms.local", password: "Hr@12345" },
    { role: "Employee", email: "employee@hrms.local", password: "Hr@12345" },
    { role: "Recruiter", email: "recruiter@hrms.local", password: "Hr@12345" },
    { role: "Payroll Manager", email: "payroll_manager@hrms.local", password: "Hr@12345" },
  ];

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            H
          </div>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">Sign in to HRMS</h1>
          <p className="text-sm text-gray-500">
            Use your company credentials to access your workspace.
          </p>
        </div>
        <form onSubmit={onSubmit} className="card p-6">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-center text-xs font-medium text-gray-600">
            Demo credentials — click to fill &amp; sign in
          </p>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account)}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-brand-400 hover:bg-brand-50"
              >
                <span className="text-xs font-semibold text-gray-800">{account.role}</span>
                <span className="font-mono text-[11px] text-gray-500">{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
