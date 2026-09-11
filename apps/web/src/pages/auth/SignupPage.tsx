import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { extractError } from "../../api/client";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(fullName, email, password);
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
          <h1 className="mt-3 text-xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500">Join HRMS to start managing your workspace.</p>
        </div>
        <form onSubmit={onSubmit} className="card p-6">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>
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
              minLength={8}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
