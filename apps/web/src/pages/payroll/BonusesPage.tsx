import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { SalaryBonus, employeeName, money } from "./types";

interface EmployeeOption { id: string; firstName: string; lastName: string; email: string }

export function BonusesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "bonus", amount: "", reason: "", date: "", status: "pending" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["payroll-bonuses"],
    queryFn: async () => (await api.get("/payroll/bonuses")).data.data as SalaryBonus[],
  });
  const empsQuery = useQuery({
    queryKey: ["employees-all"],
    queryFn: async () => {
      const res = await api.get<{ data: EmployeeOption[] }>("/employees", { params: { limit: 100 } });
      return res.data.data;
    },
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post("/payroll/bonuses", {
        employeeId: form.employeeId,
        type: form.type,
        amount: Number(form.amount),
        reason: form.reason,
        date: new Date(form.date).toISOString(),
        status: form.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-bonuses"] });
      qc.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      setShowCreate(false);
      setForm({ employeeId: "", type: "bonus", amount: "", reason: "", date: "", status: "pending" });
    },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const bonuses = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Bonuses & Incentives"
        subtitle={`${bonuses.length} record(s)`}
        actions={
          <button
            onClick={() => { setError(""); setShowCreate(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Add Bonus
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {bonuses.length === 0 ? (
        <EmptyState message="No bonuses or incentives recorded yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {bonuses.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{employeeName(b.employee)}</td>
                  <td className="px-4 py-3"><Badge tone={b.type === "bonus" ? "green" : "indigo"}>{b.type}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{b.reason}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600">{money(b.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(b.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showCreate && (
        <Modal title="Add Bonus / Incentive" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <Field label="Employee">
              <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Select employee</option>
                {(empsQuery.data ?? []).map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </Field>
            <div className="flex gap-2">
              <Field label="Type">
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="bonus">bonus</option>
                  <option value="incentive">incentive</option>
                </select>
              </Field>
              <Field label="Amount">
                <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Field label="Date">
                <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Status">
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="paid">paid</option>
                </select>
              </Field>
            </div>
            <Field label="Reason">
              <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Performance bonus" />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.employeeId || !form.amount || !form.reason || !form.date || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Saving..." : "Add Bonus"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}