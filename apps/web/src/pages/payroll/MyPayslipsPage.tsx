import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal } from "../employees/components";
import { PayrollDetails, Payslip, employeeName, money } from "./types";

export function MyPayslipsPage() {
  const [selected, setSelected] = useState<Payslip | null>(null);
  const listQuery = useQuery({
    queryKey: ["my-payslips"],
    queryFn: async () => (await api.get("/payroll/payslips/mine")).data.data as Payslip[],
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const payslips = listQuery.data!;

  return (
    <div>
      <PageHeader title="My Payslips" subtitle={`${payslips.length} payslip(s)`} />
      {payslips.length === 0 ? (
        <EmptyState message="No payslips generated yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
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
                  <td className="px-4 py-3 font-medium text-gray-800">{p.payrollRun?.payrollPeriod?.name ?? "—"}</td>
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

export function PayslipModal({ payslip, onClose }: { payslip: Payslip; onClose: () => void }) {
  const details = (payslip.details ?? {}) as PayrollDetails;
  return (
    <Modal title="Payslip Details" onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-neutral-800/60">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Employee</span>
            <span className="font-medium text-gray-700">{employeeName(payslip.employee)}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Period</span>
            <span className="font-medium text-gray-700">{payslip.payrollRun?.payrollPeriod?.name ?? "—"}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Structure</span>
            <span className="font-medium text-gray-700">{details.structureName ?? "—"}</span>
          </div>
        </div>
        {(details.components ?? []).length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-gray-500">Components</div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {(details.components ?? []).map((c, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-xs text-gray-600">
                      {c.name} <span className="text-gray-400">({c.type})</span>
                    </td>
                    <td className="py-1.5 text-right text-xs font-medium text-gray-700">{money(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(details.bonuses ?? []).map((b, i) => (
          <div key={i} className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-900/20">
            <span className="text-emerald-700 dark:text-emerald-300">{b.reason} ({b.type})</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">+{money(b.amount)}</span>
          </div>
        ))}
        {(details.overtime ?? []).map((o, i) => (
          <div key={i} className="flex items-center justify-between rounded-md bg-cyan-50 px-3 py-2 text-xs dark:bg-cyan-900/20">
            <span className="text-cyan-700 dark:text-cyan-300">Overtime · {o.hours}h on {new Date(o.date).toLocaleDateString()}</span>
            <span className="font-semibold text-cyan-700 dark:text-cyan-300">+{money(o.amount)}</span>
          </div>
        ))}
        <div className="space-y-2 border-t border-gray-100 pt-3 text-sm dark:border-neutral-800">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Gross Pay</span>
            <span className="font-medium text-gray-700">{money(payslip.grossPay)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Total Deductions</span>
            <span className="font-medium text-rose-600">-{money(payslip.totalDeductions)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-800">
            <span>Net Pay</span>
            <span>{money(payslip.netPay)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}