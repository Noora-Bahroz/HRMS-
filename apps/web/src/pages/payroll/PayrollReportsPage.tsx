import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, ErrorState, PageHeader, Spinner, statusTone } from "../../components/ui/ui";
import { PayrollDashboard, PayrollRun, employeeName, money } from "./types";

export function PayrollReportsPage() {
  const [expansion, setExpansion] = useState("");
  const [error, setError] = useState("");

  const dashQuery = useQuery({
    queryKey: ["payroll-dashboard"],
    queryFn: async () => (await api.get("/payroll/dashboard")).data.data as PayrollDashboard,
  });
  const runsQuery = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: async () => (await api.get("/payroll/runs")).data.data as PayrollRun[],
  });
  const detailQuery = useQuery({
    queryKey: ["payroll-run-detail", expansion],
    queryFn: async () => (await api.get(`/payroll/runs/${expansion}`)).data.data,
    enabled: !!expansion,
  });

  if (dashQuery.isLoading || runsQuery.isLoading) return <Spinner />;
  if (dashQuery.isError) return <ErrorState message={(dashQuery.error as Error).message} />;

  const d = dashQuery.data!;
  const runs = runsQuery.data!;

  const exportRun = async (id: string) => {
    try {
      setError("");
      const res = await api.get(`/payroll/runs/${id}/export`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payroll-run.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(extractError(e));
    }
  };

  return (
    <div>
      <PageHeader title="Payroll Reports" subtitle="Payroll run summaries and CSV exports" />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-gray-500">Total Gross</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{money(d.totals.gross)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">Total Deductions</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{money(d.totals.deductions)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">Total Net Paid</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{money(d.totals.net)}</div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Gross</th>
                <th className="px-4 py-3 font-medium">Deductions</th>
                <th className="px-4 py-3 font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {d.runTrend.map((r, i) => {
                const run = runs[i];
                return [
                  <tr key={r.periodName ?? i}>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.periodName ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{money(r.gross)}</td>
                    <td className="px-4 py-3 text-gray-500">{money(r.deductions)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{money(r.net)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {run && (
                          <button onClick={() => setExpansion(expansion === run.id ? "" : run.id)} className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                            {expansion === run.id ? "Hide payslips" : "View payslips"}
                          </button>
                        )}
                        {run && (
                          <button onClick={() => exportRun(run.id)} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                            <Download size={12} /> CSV
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>,
                  expansion !== "" && run?.id === expansion ? (
                    <tr key={`${r.periodName ?? i}-detail`}>
                      <td colSpan={6} className="px-4 py-3">
                        {detailQuery.isPending ? (
                          <Spinner label="Loading payslips..." />
                        ) : (
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-gray-100 text-xs text-gray-400 dark:border-neutral-800">
                                <th className="px-2 py-2 font-medium">Employee</th>
                                <th className="px-2 py-2 font-medium">Gross</th>
                                <th className="px-2 py-2 font-medium">Deductions</th>
                                <th className="px-2 py-2 font-medium">Net</th>
                                <th className="px-2 py-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-neutral-800/60">
                              {(detailQuery.data?.payslips ?? []).map((p: any) => (
                                <tr key={p.id}>
                                  <td className="px-2 py-2 text-gray-700">{employeeName(p.employee)}</td>
                                  <td className="px-2 py-2 text-gray-500">{money(p.grossPay)}</td>
                                  <td className="px-2 py-2 text-gray-500">{money(p.totalDeductions)}</td>
                                  <td className="px-2 py-2 font-medium text-gray-700">{money(p.netPay)}</td>
                                  <td className="px-2 py-2"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}