import { Link, Navigate } from "react-router-dom";
import { Footer } from "../../components/layout/Footer";
import { useAuth } from "../../auth/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Clock,
  Wallet,
  Receipt,
  UserPlus,
  Monitor,
  BarChart3,
  Settings,
  ArrowRight,
} from "lucide-react";

const values = [
  { icon: Users, title: "People", text: "Manage your workforce effortlessly in one place." },
  { icon: CalendarDays, title: "Leave & Time Off", text: "Track approvals and balances with ease." },
  { icon: Clock, title: "Attendance", text: "Check-ins, shifts, and presence at a glance." },
  { icon: Wallet, title: "Payroll", text: "Run salaries and view payslips in minutes." },
];

const shortcuts = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", path: "/employees", icon: Users },
  { label: "Organization", path: "/organization", icon: Building2 },
  { label: "Leave", path: "/leave", icon: CalendarDays },
  { label: "Attendance", path: "/attendance", icon: Clock },
  { label: "Payroll", path: "/payroll", icon: Wallet },
  { label: "Expenses", path: "/expenses", icon: Receipt },
  { label: "Recruitment", path: "/recruitment", icon: UserPlus },
  { label: "Assets", path: "/assets", icon: Monitor },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Users & Roles", path: "/settings/users", icon: Settings },
];

export function HomePage() {
  const { me } = useAuth();

  if (me) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <section className="py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg">
          H
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Hello</h2>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">Welcome to HRMS</p>
        <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 dark:text-gray-300">
          We build world-class tools to manage your people, time, and payroll — all in one
          beautifully simple platform. Pick a module from the sidebar to get started.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <LayoutDashboard size={16} />
            Go to Dashboard
          </Link>
          <Link
            to="/employees"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <Users size={16} />
            View Employees
          </Link>
        </div>
      </section>

      {/* Value cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <div
            key={v.title}
            className="card flex items-start gap-4 p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
              <v.icon size={22} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{v.title}</div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{v.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Quick access */}
      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Quick access
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shortcuts.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-brand-200 hover:bg-brand-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
            >
              <s.icon size={17} className="text-gray-400 group-hover:text-brand-600 dark:text-neutral-300 dark:group-hover:text-brand-400" />
              {s.label}
              <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-brand-500 dark:text-neutral-600 dark:group-hover:text-brand-400" />
            </Link>
          ))}
        </div>
      </section>
      </div>

      <Footer />
    </div>
  );
}
