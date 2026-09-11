import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Payslip, PayrollRun, employeeName, money } from "./types";
import { PayslipModal } from "./MyPayslipsPage";

export function PayslipsPage() {
  const [runId, setRunId] = useState("");
  const [selected, setSelected] = useState<Payslip | null>(null);

  const listQuery = useQuery({
    queryKey: ["payroll-payslips", runId],
    queryFn: async () => (await api.get("/payroll/payslips", { params: { runId: runId || undefined } })).data.data as Payslip[],
  });
  const runsQuery = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: async () => (await api.get("/payroll/runs")).data.data as PayrollRun[],
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const payslips = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Payslips"
        subtitle={`${payslips.length} payslip(s)`}
        actions={
          <select className="input w-52" value={runId} onChange={(e) => setRunId(e.target.value)}>
            <option value="">All runs</option>
            {(runsQuery.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.payrollPeriod?.name ?? "Run"}</option>
            ))}
          </select>
        }
      />
      {payslips.length === 0 ? (
        <EmptyState message="No payslips found." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Gross Pay</th>
                <th className="px-4 py-3 font-medium">Deductions</th>
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {payslips.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{employeeName(p.employee)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.payrollRun?.payrollPeriod?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{money(p.grossPay)}</td>
                  <td className="px-4 py-3 text-gray-500">{money(p.totalDeductions)}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{money(p.netPay)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(p)} className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {selected && <PayslipModal payslip={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}