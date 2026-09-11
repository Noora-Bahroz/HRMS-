import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  CalendarDays,
  Clock,
  Wallet,
  Receipt,
  Monitor,
  UserPlus,
  UserRound,
  Bell,
  ShieldCheck,
  Layers,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface SystemSummary {
  organizations: { companies: number; branches: number; departments: number; teams: number };
  headcount: { total: number };
  attendance: { todayCheckIns: number; total: number; byStatus: { status: string; count: number }[] };
  leave: { total: number; pending: number; approved: number; byStatus: { status: string; count: number }[] };
  payroll: { runs: number; payslips: number; netPaid: number };
  expenses: { total: number; submitted: number; approved: number; reimbursed: number; amount: number };
  assets: { total: number; byStatus: { status: string; count: number }[] };
  recruitment: { requisitions: number; open: number; candidates: number };
  users: { total: number; active: number };
  notifications: { unread: number };
}

function statusCount(rows: { status: string; count: number }[], status: string) {
  return rows.find((r) => r.status === status)?.count ?? 0;
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function SystemDashboard() {
  const { me } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["system-summary"],
    queryFn: async () => (await api.get("/reports/system-summary")).data.data as SystemSummary,
    enabled: !!me,
  });

  if (summaryQuery.isLoading) return <Spinner />;
  if (summaryQuery.isError)
    return <ErrorState message={(summaryQuery.error as Error).message} />;

  const d = summaryQuery.data!;

  const stats = [
    { label: "Total Employees", value: String(d.headcount.total), icon: Users, tone: "bg-blue-100 text-blue-700" },
    { label: "Active Users", value: String(d.users.active), icon: UserRound, tone: "bg-cyan-100 text-cyan-700" },
    { label: "Check-ins Today", value: String(d.attendance.todayCheckIns), icon: Clock, tone: "bg-purple-100 text-purple-700" },
    { label: "Pending Leave", value: String(d.leave.pending), icon: CalendarDays, tone: "bg-amber-100 text-amber-700" },
    { label: "Net Paid", value: currency.format(d.payroll.netPaid), icon: Wallet, tone: "bg-green-100 text-green-700" },
    { label: "Open Positions", value: String(d.recruitment.open), icon: UserPlus, tone: "bg-pink-100 text-pink-700" },
  ];

  const modules = [
    { label: "Companies", value: d.organizations.companies, icon: Building2, to: "/organization" },
    { label: "Branches", value: d.organizations.branches, icon: Layers, to: "/organization" },
    { label: "Departments", value: d.organizations.departments, icon: GitBranch, to: "/organization" },
    { label: "Teams", value: d.organizations.teams, icon: Users, to: "/organization" },
  ];

  const leavePending = statusCount(d.leave.byStatus, "pending");
  const leaveApproved = statusCount(d.leave.byStatus, "approved");

  return (
    <div>
      <PageHeader
        title="System Overview"
        subtitle="Full-company analytics and module health at a glance."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <ShieldCheck size={13} />
            Super Admin
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Organization</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {modules.map((m) => (
            <Link key={m.label} to={m.to}>
              <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
                <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <m.icon size={18} />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{m.value}</div>
                  <div className="text-xs text-gray-500">{m.label}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Attendance</h3>
            <Link to="/attendance" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.attendance.todayCheckIns}</div>
              <div className="text-xs text-gray-500">today check-ins</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Present</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "present")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Absent</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "absent")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Late</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "late")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total records</span>
              <span className="text-xs font-medium text-gray-700">{d.attendance.total}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Leave</h3>
            <Link to="/leave" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.leave.total}</div>
              <div className="text-xs text-gray-500">total requests</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Pending</span>
              <Badge tone="amber">{leavePending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Approved</span>
              <Badge tone="green">{leaveApproved}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Balance tracked per employee</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Payroll</h3>
            <Link to="/payroll" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-700">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.payroll.runs}</div>
              <div className="text-xs text-gray-500">payroll runs</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Payslips</span>
              <span className="text-xs font-medium text-gray-700">{d.payroll.payslips}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Net paid</span>
              <span className="text-xs font-medium text-gray-700">{currency.format(d.payroll.netPaid)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <Link to="/notifications" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
              <Bell size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.notifications.unread}</div>
              <div className="text-xs text-gray-500">unread announcements</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-neutral-800">
            <Bell size={13} />
            Broadcast announcements to the whole company.
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Expenses</h3>
            <Link to="/expenses" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
              <Receipt size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.expenses.total}</div>
              <div className="text-xs text-gray-500">claims · {currency.format(d.expenses.amount)}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="amber">{d.expenses.submitted} submitted</Badge>
            <Badge tone="blue">{d.expenses.approved} approved</Badge>
            <Badge tone="green">{d.expenses.reimbursed} reimbursed</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Assets</h3>
            <Link to="/assets" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
              <Monitor size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.assets.total}</div>
              <div className="text-xs text-gray-500">company assets</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {d.assets.byStatus.map((s) => (
              <Badge key={s.status} tone={s.status === "available" ? "green" : "blue"}>
                {s.status}: {s.count}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Recruitment</h3>
            <Link to="/recruitment" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-100 p-2.5 text-pink-700">
              <UserPlus size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.recruitment.requisitions}</div>
              <div className="text-xs text-gray-500">job requisitions</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="green">{d.recruitment.open} open</Badge>
            <Badge tone="blue">{d.recruitment.candidates} candidates</Badge>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link to="/settings/audit">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Audit Logs</div>
                <div className="text-xs text-gray-500">Review system-wide activity and changes.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
        <Link to="/settings/company">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Company / System Settings</div>
                <div className="text-xs text-gray-500">
                  {d.organizations.companies} companies · {d.organizations.branches} branches
                </div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
    </div>
  );
}