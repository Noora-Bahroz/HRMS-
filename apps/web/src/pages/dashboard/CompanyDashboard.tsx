import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Layers,
  GitBranch,
  CalendarDays,
  Clock,
  UserPlus,
  Receipt,
  Monitor,
  Bell,
  BarChart3,
  ArrowRight,
  Building,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface CompanySummary {
  organizations: { branches: number; departments: number; teams: number };
  headcount: {
    total: number;
    byDepartment: { departmentId: string | null; count: number }[];
    byStatus: { status: string; count: number }[];
  };
  attendance: { todayCheckIns: number; total: number; byStatus: { status: string; count: number }[] };
  leave: { total: number; pending: number; approved: number; byStatus: { status: string; count: number }[] };
  expenses: { total: number; submitted: number; approved: number; reimbursed: number; amount: number };
  assets: { total: number; byStatus: { status: string; count: number }[] };
  recruitment: { requisitions: number; open: number; candidates: number };
  notifications: { unread: number };
}

interface Department {
  id: string;
  name: string;
}

function statusCount(rows: { status: string; count: number }[], status: string) {
  return rows.find((r) => r.status === status)?.count ?? 0;
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CompanyDashboard() {
  const { me } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["company-summary"],
    queryFn: async () => (await api.get("/reports/company-summary")).data.data as CompanySummary,
    enabled: !!me,
  });

  const departmentsQuery = useQuery({
    queryKey: ["org-departments"],
    queryFn: async () => (await api.get<{ data: Department[] }>("/organization/departments")).data.data,
    enabled: !!me,
  });

  if (summaryQuery.isLoading || departmentsQuery.isLoading) return <Spinner />;
  if (summaryQuery.isError) return <ErrorState message={(summaryQuery.error as Error).message} />;

  const d = summaryQuery.data!;
  const departments = departmentsQuery.data ?? [];
  const deptName = new Map(departments.map((x) => [x.id, x.name]));

  const stats = [
    { label: "Total Employees", value: String(d.headcount.total), icon: Users, tone: "bg-blue-100 text-blue-700" },
    { label: "Branches", value: String(d.organizations.branches), icon: Building2, tone: "bg-cyan-100 text-cyan-700" },
    { label: "Departments", value: String(d.organizations.departments), icon: GitBranch, tone: "bg-indigo-100 text-indigo-700" },
    { label: "Teams", value: String(d.organizations.teams), icon: Layers, tone: "bg-violet-100 text-violet-700" },
    { label: "Check-ins Today", value: String(d.attendance.todayCheckIns), icon: Clock, tone: "bg-purple-100 text-purple-700" },
    { label: "Pending Leave", value: String(d.leave.pending), icon: CalendarDays, tone: "bg-amber-100 text-amber-700" },
    { label: "Open Positions", value: String(d.recruitment.open), icon: UserPlus, tone: "bg-pink-100 text-pink-700" },
    { label: "Asset Claims", value: String(d.assets.total), icon: Monitor, tone: "bg-teal-100 text-teal-700" },
  ];

  return (
    <div>
      <PageHeader
        title="Company Dashboard"
        subtitle={`${me?.fullName ? "Welcome back" : "Welcome"} — ${d.headcount.total} employees, ${d.organizations.departments} departments, ${d.organizations.teams} teams.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <Building size={13} />
            Company Admin
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
              <span className="text-xs text-gray-400">Late</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "late")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Absent</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "absent")}</span>
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
              <Badge tone="amber">{d.leave.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Approved</span>
              <Badge tone="green">{d.leave.approved}</Badge>
            </div>
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
            Broadcast announcements to your company.
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
            <h3 className="text-sm font-semibold text-gray-800">Organization</h3>
            <Link to="/organization" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-700">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.organizations.departments}</div>
              <div className="text-xs text-gray-500">departments</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="blue">{d.organizations.branches} branches</Badge>
            <Badge tone="purple">{d.organizations.teams} teams</Badge>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Headcount by Status</h3>
          <div className="space-y-3">
            {d.headcount.byStatus.length === 0 && <p className="text-xs text-gray-400">No employee records.</p>}
            {d.headcount.byStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{s.status}</span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.max(4, (s.count / Math.max(1, d.headcount.total)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-gray-700">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Headcount by Department</h3>
          <div className="space-y-3">
            {d.headcount.byDepartment.length === 0 && <p className="text-xs text-gray-400">No employees assigned to departments.</p>}
            {d.headcount.byDepartment.map((s) => (
              <div key={s.departmentId ?? "none"} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {s.departmentId ? deptName.get(s.departmentId) ?? "Unassigned" : "Unassigned"}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${Math.max(4, (s.count / Math.max(1, d.headcount.total)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-gray-700">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/reports">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <BarChart3 size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Reports & Analytics</div>
                <div className="text-xs text-gray-500">Employee, attendance, and headcount analytics.</div>
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
                <div className="text-sm font-semibold text-gray-800">Company Settings</div>
                <div className="text-xs text-gray-500">
                  {d.organizations.branches} branches · {d.organizations.departments} departments
                </div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
        <Link to="/notifications">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <Bell size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Announcements</div>
                <div className="text-xs text-gray-500">{d.notifications.unread} unread · send company-wide updates</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
    </div>
  );
}