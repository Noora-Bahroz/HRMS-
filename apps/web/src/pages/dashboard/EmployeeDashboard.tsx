import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Timer,
  Wallet,
  Receipt,
  Bell,
  ClipboardCheck,
  LogIn,
  LogOut,
  BadgeCheck,
  UserCircle2,
  ArrowRight,
  Briefcase,
  IdCard,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface EmployeeSummary {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
    employmentStatus: string;
    employmentType: string | null;
    dateOfJoining: string | null;
    department: { id: string; name: string } | null;
    designation: { id: string; title: string } | null;
    team: { id: string; name: string } | null;
  };
  attendance: {
    total: number;
    byStatus: Record<string, number>;
    totalHours: number;
    today: {
      date: string;
      checkInAt: string | null;
      checkOutAt: string | null;
      status: string;
      totalHours: number | null;
    } | null;
  };
  leave: {
    total: number;
    pending: number;
    approved: number;
    balances: { leaveTypeId: string; name: string; code: string; used: number; available: number }[];
    recent: {
      id: string;
      leaveTypeId: string;
      leaveTypeName: string;
      startDate: string;
      endDate: string;
      days: number;
      status: string;
    }[];
  };
  payslip: {
    id: string;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    status: string;
    periodName: string | null;
    createdAt: string;
  } | null;
  expenses: {
    total: number;
    pending: number;
    amount: number;
    recent: {
      id: string;
      amount: number;
      currency: string;
      date: string;
      description: string | null;
      status: string;
      categoryName: string | null;
    }[];
  };
  notifications: {
    unread: number;
    recent: {
      id: string;
      title: string;
      body: string | null;
      type: string;
      readAt: string | null;
      createdAt: string;
    }[];
  };
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function EmployeeDashboard() {
  const { me } = useAuth();
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ["employee-summary"],
    queryFn: async () => (await api.get("/reports/employee-summary")).data.data as EmployeeSummary,
    enabled: !!me,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["employee-summary"] });

  const checkInMutation = useMutation({
    mutationFn: () => api.post("/attendance/check-in"),
    onSuccess: refresh,
  });
  const checkOutMutation = useMutation({
    mutationFn: () => api.post("/attendance/check-out"),
    onSuccess: refresh,
  });

  if (summaryQuery.isLoading) return <Spinner />;
  if (summaryQuery.isError) return <ErrorState message={(summaryQuery.error as Error).message} />;

  const d = summaryQuery.data!;
  const { profile, attendance, leave } = d;
  const leaveAvailable = leave.balances.reduce((a, b) => a + b.available, 0);
  const notCheckedOut = !attendance.today?.checkOutAt;

  const stats = [
    { label: "Present Days", value: String(attendance.total), icon: BadgeCheck, tone: "bg-blue-100 text-blue-700" },
    { label: "Tracked Hours", value: `${attendance.totalHours.toFixed(1)}h`, icon: Timer, tone: "bg-cyan-100 text-cyan-700" },
    { label: "Leave Available", value: leaveAvailable.toFixed(1), icon: CalendarDays, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Pending Leave", value: String(leave.pending), icon: ClipboardCheck, tone: "bg-amber-100 text-amber-700" },
    { label: "Latest Net Pay", value: d.payslip ? `$${d.payslip.netPay.toLocaleString()}` : "—", icon: Wallet, tone: "bg-purple-100 text-purple-700" },
    { label: "My Expenses", value: String(d.expenses.pending), icon: Receipt, tone: "bg-rose-100 text-rose-700" },
    { label: "Unread Announcements", value: String(d.notifications.unread), icon: Bell, tone: "bg-indigo-100 text-indigo-700" },
    { label: "On Payroll Period", value: d.payslip?.periodName ?? "—", icon: Briefcase, tone: "bg-teal-100 text-teal-700" },
  ];

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle={`Welcome back, ${profile.firstName} ${profile.lastName}. ${profile.designation?.title ?? profile.employmentStatus ?? ""} · ${profile.department?.name ?? ""}. You have ${d.notifications.unread} unread announcement(s).`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <UserCircle2 size={13} />
            {profile.firstName} {profile.lastName} · Employee
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</div>
              </div>
              <div className={`rounded-lg p-2.5 ${s.tone}`}>
                <s.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Today's Attendance</h3>
            <Link to="/attendance" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              My Attendance
            </Link>
          </div>
          {attendance.today ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{formatTime(attendance.today.checkInAt)}</div>
                  <div className="text-xs text-gray-500">checked in{attendance.today.checkOutAt ? ` · out at ${formatTime(attendance.today.checkOutAt)}` : ""}</div>
                </div>
              </div>
              {attendance.today.totalHours != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-gray-400">Total today</span>
                  <span className="text-xs font-medium text-gray-700">{attendance.today.totalHours.toFixed(1)}h</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Status</span>
                <Badge tone={statusTone(attendance.today.status)}>{attendance.today.status}</Badge>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => checkOutMutation.mutate()}
                  disabled={!notCheckedOut || checkOutMutation.isPending}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut size={14} />
                  Check out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-xs text-gray-400">You haven't checked in today.</p>
              <button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={14} />
                Check in
              </button>
            </div>
          )}
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-neutral-800">
            <Link to="/attendance" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View attendance history →
            </Link>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">My Leave Balance</h3>
            <Link to="/leave" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Apply Leave
            </Link>
          </div>
          <div className="space-y-3">
            {leave.balances.length === 0 && <p className="text-xs text-gray-400">No leave balances recorded.</p>}
            {leave.balances.map((b) => (
              <div key={b.leaveTypeId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                    <CalendarDays size={14} />
                  </div>
                  <span className="text-xs text-gray-600">{b.name}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{b.available.toFixed(1)}</span> available ·{" "}
                  <span>{b.used.toFixed(1)} used</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Pending requests</span>
              <Badge tone="amber">{leave.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Approved</span>
              <Badge tone="green">{leave.approved}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Latest Payslip</h3>
            <Link to="/payroll" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              My Payslips
            </Link>
          </div>
          {d.payslip ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700">
                  <Wallet size={20} />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">${d.payslip.netPay.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{d.payslip.periodName ?? d.payslip.status}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Gross pay</span>
                  <span className="text-xs font-medium text-gray-700">${d.payslip.grossPay.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Deductions</span>
                  <span className="text-xs font-medium text-gray-700">-${d.payslip.totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <Badge tone={statusTone(d.payslip.status)}>{d.payslip.status}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-500 dark:bg-neutral-800">
                <Wallet size={20} />
              </div>
              <p className="text-xs text-gray-400">No payslip available yet.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">My Recent Requests</h3>
            <Link to="/leave" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </div>
          {leave.recent.length === 0 ? (
            <p className="text-xs text-gray-400">No leave requests yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {leave.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-gray-400" />
                    <div>
                      <div className="text-xs font-medium text-gray-700">{r.leaveTypeName}</div>
                      <div className="text-[11px] text-gray-400">
                        {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.days} day(s)
                      </div>
                    </div>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">My Recent Expenses</h3>
            <Link to="/expenses" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              My Expenses
            </Link>
          </div>
          {d.expenses.recent.length === 0 ? (
            <p className="text-xs text-gray-400">No expenses submitted yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {d.expenses.recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Receipt size={14} className="text-gray-400" />
                    <div>
                      <div className="text-xs font-medium text-gray-700">
                        {e.description || e.categoryName || "Expense"}
                      </div>
                      <div className="text-[11px] text-gray-400">{formatDate(e.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      {e.currency} {e.amount.toLocaleString()}
                    </span>
                    <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-neutral-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-gray-400">Total submitted</span>
              <span className="text-xs font-medium text-gray-700">
                ${d.expenses.amount.toLocaleString()} · {d.expenses.pending} pending
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Announcements</h3>
            <Link to="/notifications" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </div>
          {d.notifications.recent.length === 0 ? (
            <p className="text-xs text-gray-400">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.notifications.recent.map((n) => (
                <li key={n.id} className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-lg bg-indigo-100 p-1.5 text-indigo-700">
                    <Bell size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700">{n.title}</div>
                    <div className="text-[11px] text-gray-400">{n.body ?? ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Link to="/self-service">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <BadgeCheck size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">My Profile</div>
                <div className="text-xs text-gray-500">Personal details, contact info, and documents.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>

        <Link to="/payroll">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <IdCard size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">My Payslips</div>
                <div className="text-xs text-gray-500">All your payroll payslips.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
    </div>
  );
}