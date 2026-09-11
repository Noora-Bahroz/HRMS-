import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { OvertimeEntry, employeeName, money } from "./types";

interface EmployeeOption { id: string; firstName: string; lastName: string; email: string }

export function OvertimePage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ employeeId: "", date: "", hours: "", rateFactor: "1.5", amount: "", status: "pending" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["payroll-overtime"],
    queryFn: async () => (await api.get("/payroll/overtime")).data.data as OvertimeEntry[],
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
      api.post("/payroll/overtime", {
        employeeId: form.employeeId,
        date: new Date(form.date).toISOString(),
        hours: Number(form.hours),
        rateFactor: Number(form.rateFactor),
        amount: Number(form.amount),
        status: form.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-overtime"] });
      qc.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      setShowCreate(false);
      setForm({ employeeId: "", date: "", hours: "", rateFactor: "1.5", amount: "", status: "pending" });
    },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const entries = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Overtime"
        subtitle={`${entries.length} record(s)`}
        actions={
          <button
            onClick={() => { setError(""); setShowCreate(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Add Overtime
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {entries.length === 0 ? (
        <EmptyState message="No overtime entries recorded yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Rate Factor</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {entries.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{employeeName(o.employee)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{Number(o.hours)}h</td>
                  <td className="px-4 py-3 text-gray-500">x{Number(o.rateFactor)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600">{money(o.amount)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showCreate && (
        <Modal title="Add Overtime Entry" onClose={() => setShowCreate(false)}>
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
              <Field label="Date">
                <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Hours">
                <input className="input" type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Field label="Rate Factor">
                <input className="input" type="number" step="0.1" value={form.rateFactor} onChange={(e) => setForm({ ...form, rateFactor: e.target.value })} />
              </Field>
              <Field label="Amount">
                <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
            </div>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="paid">paid</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.employeeId || !form.date || !form.hours || !form.amount || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Saving..." : "Add Overtime"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}