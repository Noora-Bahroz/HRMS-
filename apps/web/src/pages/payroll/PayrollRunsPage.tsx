import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Download } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { PayrollPeriod, PayrollRun } from "./types";

export function PayrollRunsPage() {
  const qc = useQueryClient();
  const [showProcess, setShowProcess] = useState(false);
  const [form, setForm] = useState({ payrollPeriodId: "" });
  const [error, setError] = useState("");

  const runsQuery = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: async () => (await api.get("/payroll/runs")).data.data as PayrollRun[],
  });
  const periodsQuery = useQuery({
    queryKey: ["payroll-periods"],
    queryFn: async () => (await api.get("/payroll/periods")).data.data as PayrollPeriod[],
  });

  const processMut = useMutation({
    mutationFn: () => api.post("/payroll/runs/process", { payrollPeriodId: form.payrollPeriodId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      qc.invalidateQueries({ queryKey: ["payroll-periods"] });
      qc.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      setShowProcess(false);
      setForm({ payrollPeriodId: "" });
    },
    onError: (e: any) => setError(extractError(e)),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.post(`/payroll/runs/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      qc.invalidateQueries({ queryKey: ["payroll-periods"] });
      qc.invalidateQueries({ queryKey: ["payroll-dashboard"] });
    },
    onError: (e: any) => setError(extractError(e)),
  });

  const exportRun = async (id: string) => {
    try {
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

  if (runsQuery.isLoading) return <Spinner />;
  if (runsQuery.isError) return <ErrorState message={(runsQuery.error as Error).message} />;

  const runs = runsQuery.data!;
  const draftPeriods = (periodsQuery.data ?? []).filter((p) => p.status === "draft");

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle={`${runs.length} run(s)`}
        actions={
          <button
            onClick={() => { setError(""); setShowProcess(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Process Payroll
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {runs.length === 0 ? (
        <EmptyState message="No payroll runs yet. Process a payroll period to get started." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Processed At</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.payrollPeriod?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{r.processedAt ? new Date(r.processedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {r.status === "completed" && (
                        <button
                          onClick={() => { setError(""); approveMut.mutate(r.id); }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                      )}
                      <button onClick={() => exportRun(r.id)} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                        <Download size={12} /> Export CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showProcess && (
        <Modal title="Process Payroll" onClose={() => setShowProcess(false)}>
          <div className="space-y-3">
            <Field label="Payroll Period">
              <select className="input" value={form.payrollPeriodId} onChange={(e) => setForm({ ...form, payrollPeriodId: e.target.value })}>
                <option value="">Select period</option>
                {draftPeriods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            {draftPeriods.length === 0 && <p className="text-xs text-amber-600">No draft periods available to process.</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowProcess(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => processMut.mutate()} disabled={!form.payrollPeriodId || processMut.isPending} className="btn-primary">
                {processMut.isPending ? "Processing..." : "Process Payroll"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}