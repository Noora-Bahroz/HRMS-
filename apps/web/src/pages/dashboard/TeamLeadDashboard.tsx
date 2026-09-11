import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Clock,
  UserPlus,
  Timer,
  Bell,
  BarChart3,
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  IdCard,
  LogOut,
  Coins,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface TeamSummary {
  team: { id: string; name: string; departmentId: string | null; departmentName: string | null };
  headcount: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
  movement: { joinedThisMonth: number; exited: number };
  attendance: {
    todayCheckIns: number;
    todayCheckedOut: number;
    total: number;
    byStatus: { status: string; count: number }[];
    totalHours: number;
  };
  leave: {
    total: number;
    pending: number;
    approved: number;
    byStatus: { status: string; count: number }[];
  };
  leaveBalances: {
    leaveTypeId: string;
    name: string;
    code: string;
    used: number;
    available: number;
  }[];
  notifications: { unread: number };
}

function statusCount(rows: { status: string; count: number }[], status: string) {
  return rows.find((r) => r.status === status)?.count ?? 0;
}

export function TeamLeadDashboard() {
  const { me } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["team-summary"],
    queryFn: async () => (await api.get("/reports/team-summary")).data.data as TeamSummary,
    enabled: !!me,
  });

  if (summaryQuery.isLoading) return <Spinner />;
  if (summaryQuery.isError) return <ErrorState message={(summaryQuery.error as Error).message} />;

  const d = summaryQuery.data!;
  const active = statusCount(d.headcount.byStatus, "active");

  const stats = [
    { label: "Team Members", value: String(d.headcount.total), icon: Users, tone: "bg-blue-100 text-blue-700" },
    { label: "Pending Leave Approval", value: String(d.leave.pending), icon: ClipboardCheck, tone: "bg-amber-100 text-amber-700" },
    { label: "Check-ins Today", value: String(d.attendance.todayCheckIns), icon: Clock, tone: "bg-purple-100 text-purple-700" },
    { label: "Tracked Hours", value: `${d.attendance.totalHours.toFixed(0)}h`, icon: Timer, tone: "bg-cyan-100 text-cyan-700" },
    { label: "Late Today", value: String(statusCount(d.attendance.byStatus, "late")), icon: LogOut, tone: "bg-rose-100 text-rose-700" },
    { label: "Approved Leave", value: String(d.leave.approved), icon: FileCheck2, tone: "bg-emerald-100 text-emerald-700" },
    { label: "New Joiners", value: String(d.movement.joinedThisMonth), icon: UserPlus, tone: "bg-teal-100 text-teal-700" },
    { label: "Unread Announcements", value: String(d.notifications.unread), icon: Bell, tone: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <div>
      <PageHeader
        title="Team Dashboard"
        subtitle={`${d.team.name}${d.team.departmentName ? ` · ${d.team.departmentName}` : ""} — ${active} active of ${d.headcount.total} team members, ${d.leave.pending} leave request(s) awaiting your approval.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <Users size={13} />
            {d.team.name} · Team Lead
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
            <h3 className="text-sm font-semibold text-gray-800">Attendance & Working Hours</h3>
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
              <span className="text-xs text-gray-400">Half-day</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "half_day")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Absent</span>
              <span className="text-xs font-medium text-gray-700">{statusCount(d.attendance.byStatus, "absent")}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-neutral-800">
              <span className="text-xs text-gray-400">Recorded hours</span>
              <span className="text-xs font-medium text-gray-700">{d.attendance.totalHours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Checked out today</span>
              <span className="text-xs font-medium text-gray-700">{d.attendance.todayCheckedOut}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Leave Approvals</h3>
            <Link to="/leave" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Review
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{d.leave.pending}</div>
              <div className="text-xs text-gray-500">awaiting approval</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Approved</span>
              <Badge tone="green">{d.leave.approved}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total requests</span>
              <Badge tone="gray">{d.leave.total}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Team Leave Balances</h3>
          <div className="space-y-3">
            {d.leaveBalances.length === 0 && <p className="text-xs text-gray-400">No leave balances recorded.</p>}
            {d.leaveBalances.map((b) => (
              <div key={b.leaveTypeId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                    <Coins size={14} />
                  </div>
                  <span className="text-xs text-gray-600">{b.name}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{b.available.toFixed(0)}</span> available ·{" "}
                  <span>{b.used.toFixed(0)} used</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-neutral-800">
            <Link to="/leave" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all balances & reports →
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">Team Composition</h3>
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
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">New joiners (this month)</span>
              <span className="text-xs font-medium text-gray-700">{d.movement.joinedThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Exits</span>
              <span className="text-xs font-medium text-gray-700">{d.movement.exited}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Link to="/reports">
            <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Team Reports</div>
                  <div className="text-xs text-gray-500">Employee, attendance, and leave analytics.</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300" />
            </Card>
          </Link>
          <Link to="/employees/directory">
            <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <IdCard size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Team Directory</div>
                  <div className="text-xs text-gray-500">Browse your team members.</div>
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
                  <div className="text-xs text-gray-500">{d.notifications.unread} unread announcements.</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300" />
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}