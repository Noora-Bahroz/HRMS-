import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Monitor,
  CalendarDays,
  Clock,
  UserPlus,
  FolderOpen,
  Bell,
  BarChart3,
  ArrowRight,
  UserRoundPlus,
  UserRoundX,
  BadgeCheck,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface HrSummary {
  organizations: { departments: number; teams: number };
  headcount: {
    total: number;
    byDepartment: { departmentId: string | null; count: number }[];
    byStatus: { status: string; count: number }[];
  };
  movement: { joinedThisMonth: number; exited: number; terminated: number };
  documents: { total: number };
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

export function HrDashboard() {
  const { me } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["hr-summary"],
    queryFn: async () => (await api.get("/reports/hr-summary")).data.data as HrSummary,
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

  const active = statusCount(d.headcount.byStatus, "active");

  const stats = [
    { label: "Total Employees", value: String(d.headcount.total), icon: Users, tone: "bg-blue-100 text-blue-700" },
    { label: "New This Month", value: String(d.movement.joinedThisMonth), icon: UserRoundPlus, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Exited", value: String(d.movement.exited), icon: UserRoundX, tone: "bg-red-100 text-red-700" },
    { label: "Check-ins Today", value: String(d.attendance.todayCheckIns), icon: Clock, tone: "bg-purple-100 text-purple-700" },
    { label: "Pending Leave", value: String(d.leave.pending), icon: CalendarDays, tone: "bg-amber-100 text-amber-700" },
    { label: "Open Positions", value: String(d.recruitment.open), icon: UserPlus, tone: "bg-pink-100 text-pink-700" },
    { label: "Documents", value: String(d.documents.total), icon: FolderOpen, tone: "bg-teal-100 text-teal-700" },
    { label: "Unread Announcements", value: String(d.notifications.unread), icon: Bell, tone: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <div>
      <PageHeader
        title="HR Dashboard"
        subtitle={`${me?.fullName ? "Welcome back" : "Welcome"} — ${active} active employees, ${d.organizations.departments} departments, ${d.recruitment.open} open positions.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <BadgeCheck size={13} />
            HR Admin
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
            <h3 className="text-sm font-semibold text-gray-800">Employee Documents</h3>
            <Link to="/employees/documents" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 p-2.5 text-teal-700">
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.documents.total}</div>
              <div className="text-xs text-gray-500">contracts & documents</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-neutral-800">
            <FolderOpen size={13} />
            On-file personnel documents.
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Workforce Movement</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Active employees</span>
              <span className="text-sm font-semibold text-gray-800">{active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">New this month</span>
              <Badge tone="green">{d.movement.joinedThisMonth}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Exited</span>
              <Badge tone="red">{d.movement.exited}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Terminated</span>
              <Badge tone="red">{d.movement.terminated}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Expenses</h3>
            <Link to="/expenses" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.expenses.total}</div>
              <div className="text-xs text-gray-500">claims · {currency.format(d.expenses.amount)}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="amber">{d.expenses.submitted} submitted</Badge>
            <Badge tone="blue">{d.expenses.approved} approved</Badge>
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
              <Monitor size={18} />
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
                <div className="text-sm font-semibold text-gray-800">HR Reports & Analytics</div>
                <div className="text-xs text-gray-500">Employee, attendance, leave, and headcount analytics.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
        <Link to="/employees/documents">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                <FolderOpen size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Employee Documents</div>
                <div className="text-xs text-gray-500">{d.documents.total} documents on file.</div>
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