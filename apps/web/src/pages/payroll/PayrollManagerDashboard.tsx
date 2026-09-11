import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Wallet,
  Receipt,
  PiggyBank,
  Clock,
  CheckCircle2,
  Gift,
  Timer,
  AlertTriangle,
  ArrowRight,
  UserCircle2,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";
import { PayrollDashboard, money } from "../payroll/types";

export function PayrollManagerDashboard() {
  const { me } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["payroll-dashboard"],
    queryFn: async () => (await api.get("/payroll/dashboard")).data.data as PayrollDashboard,
    enabled: !!me,
  });

  if (statsQuery.isLoading) return <Spinner />;
  if (statsQuery.isError) return <ErrorState message={(statsQuery.error as Error).message} />;

  const d = statsQuery.data!;
  const latestRun = d.latestRun;
  const currentPeriod = d.currentPeriod;

  const stats = [
    { label: "Employees on Payroll", value: String(d.employeeCount), icon: Users, tone: "bg-blue-100 text-blue-700" },
    { label: "Current Period", value: currentPeriod?.status === "draft" ? currentPeriod.name : "—", icon: Clock, tone: "bg-cyan-100 text-cyan-700" },
    { label: "Total Gross", value: money(d.totals.gross), icon: Wallet, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Total Deductions", value: money(d.totals.deductions), icon: PiggyBank, tone: "bg-amber-100 text-amber-700" },
    { label: "Total Net", value: money(d.totals.net), icon: Receipt, tone: "bg-purple-100 text-purple-700" },
    { label: "Pending Approvals", value: String(d.pendingApprovals), icon: AlertTriangle, tone: "bg-rose-100 text-rose-700" },
    { label: "Bonuses", value: String(d.bonusCount), icon: Gift, tone: "bg-indigo-100 text-indigo-700" },
    { label: "Overtime Entries", value: String(d.overtimeCount), icon: Timer, tone: "bg-teal-100 text-teal-700" },
  ];

  const maxNet = d.runTrend.length ? Math.max(...d.runTrend.map((r) => Number(r.net)), 1) : 1;

  return (
    <div>
      <PageHeader
        title="Payroll Dashboard"
        subtitle={`Welcome back, ${me?.fullName ?? "Payroll Manager"}. ${d.pendingApprovals} payroll run(s) awaiting approval.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <UserCircle2 size={13} />
            {me?.fullName ?? "Payroll Manager"} · Payroll Manager
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((st) => (
          <Card key={st.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">{st.label}</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{st.value}</div>
              </div>
              <div className={`rounded-lg p-2.5 ${st.tone}`}>
                <st.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Net Payroll per Run</h3>
            <Link to="/payroll/reports" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Reports
            </Link>
          </div>
          {d.runTrend.length === 0 ? (
            <p className="text-xs text-gray-400">No payroll runs processed yet.</p>
          ) : (
            <div className="space-y-3">
              {d.runTrend.map((r) => (
                <div key={r.periodName ?? r.status} className="flex items-center gap-3">
                  <span className="w-28 truncate text-xs text-gray-500">{r.periodName}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-neutral-800">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{ width: `${Math.round((Number(r.net) / maxNet) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-24 text-right text-xs font-medium text-gray-700">{money(r.net)}</span>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Latest Payroll Run</h3>
            <Link to="/payroll/runs" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </div>
          {!latestRun ? (
            <p className="text-xs text-gray-400">No payroll run yet. Process the current period to get started.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-neutral-800/60">
                <div>
                  <div className="text-xs font-medium text-gray-700">{latestRun.payrollPeriod?.name ?? "Payroll Run"}</div>
                  <div className="text-[11px] text-gray-400">Processed {latestRun.processedAt ? new Date(latestRun.processedAt).toLocaleDateString() : "—"}</div>
                </div>
                <Badge tone={statusTone(latestRun.status)}>{latestRun.status}</Badge>
              </div>
              {latestRun.status === "completed" && (
                <Link to={`/payroll/runs`} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  <CheckCircle2 size={13} /> Approve this run
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/payroll/salary-structures">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
                <Wallet size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Salary Structures</div>
                <div className="text-xs text-gray-500">Define earnings and deductions.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
        <Link to="/payroll/employee-salaries">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700">
                <Users size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Employee Salaries</div>
                <div className="text-xs text-gray-500">{d.employeeCount} employees assigned.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
        <Link to="/payroll/payslips">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-700">
                <Receipt size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Payslips</div>
                <div className="text-xs text-gray-500">Review employee payslips.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
    </div>
  );
}