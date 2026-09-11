import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { PayrollPeriod } from "./types";

export function PayrollPeriodsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["payroll-periods"],
    queryFn: async () => (await api.get("/payroll/periods")).data.data as PayrollPeriod[],
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post("/payroll/periods", {
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-periods"] });
      setShowCreate(false);
      setForm({ name: "", startDate: "", endDate: "" });
    },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const periods = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Payroll Periods"
        subtitle={`${periods.length} period(s)`}
        actions={
          <button
            onClick={() => { setError(""); setShowCreate(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Create Period
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {periods.length === 0 ? (
        <EmptyState message="No payroll periods created yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
                <th className="px-4 py-3 font-medium">End Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {periods.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showCreate && (
        <Modal title="Create Payroll Period" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <Field label="Name">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. October 2026" />
            </Field>
            <Field label="Start Date">
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End Date">
              <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.name || !form.startDate || !form.endDate || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Creating..." : "Create Period"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}