import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { SalaryAssignment, SalaryStructure, employeeName, money } from "./types";

interface EmployeeOption { id: string; firstName: string; lastName: string; email: string }

export function EmployeeSalariesPage() {
  const qc = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ employeeId: "", salaryStructureId: "" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["employee-salaries"],
    queryFn: async () => (await api.get("/payroll/employees")).data.data as SalaryAssignment[],
  });
  const empsQuery = useQuery({
    queryKey: ["employees-all"],
    queryFn: async () => {
      const res = await api.get<{ data: EmployeeOption[]; meta: { total: number } }>("/employees", { params: { limit: 100 } });
      return res.data.data;
    },
  });
  const structuresQuery = useQuery({
    queryKey: ["salary-structures"],
    queryFn: async () => (await api.get("/payroll/structures")).data.data as SalaryStructure[],
  });

  const assignMut = useMutation({
    mutationFn: () => api.post("/payroll/structures/assign", { employeeId: form.employeeId, salaryStructureId: form.salaryStructureId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-salaries"] });
      qc.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      setShowAssign(false);
      setForm({ employeeId: "", salaryStructureId: "" });
    },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const rows = listQuery.data!;

  const rowNet = (r: SalaryAssignment) =>
    r.salaryStructure.components.filter((c) => c.type === "earning").reduce((s, c) => s + Number(c.amount), 0) -
    r.salaryStructure.components.filter((c) => c.type === "deduction").reduce((s, c) => s + Number(c.amount), 0);

  const assignedIds = new Set(rows.map((r) => r.employeeId));

  return (
    <div>
      <PageHeader
        title="Employee Salaries"
        subtitle={`${rows.length} employee(s) on payroll`}
        actions={
          <button
            onClick={() => { setError(""); setShowAssign(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Assign Structure
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {rows.length === 0 ? (
        <EmptyState message="No employees assigned to a salary structure yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Structure</th>
                <th className="px-4 py-3 font-medium">Earnings</th>
                <th className="px-4 py-3 font-medium">Deductions</th>
                <th className="px-4 py-3 font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {rows.map((r) => {
                const earnings = r.salaryStructure.components.filter((c) => c.type === "earning").reduce((s, c) => s + Number(c.amount), 0);
                const deductions = r.salaryStructure.components.filter((c) => c.type === "deduction").reduce((s, c) => s + Number(c.amount), 0);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{employeeName(r.employee)}</div>
                      <div className="text-[11px] text-gray-400">{r.employee?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.employee?.Department?.name ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone="blue">{r.salaryStructure.name}</Badge></td>
                    <td className="px-4 py-3 text-emerald-600">{money(earnings)}</td>
                    <td className="px-4 py-3 text-rose-500">{money(deductions)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{money(rowNet(r))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {showAssign && (
        <Modal title="Assign Salary Structure" onClose={() => setShowAssign(false)}>
          <div className="space-y-3">
            <Field label="Employee">
              <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Select employee</option>
                {(empsQuery.data ?? []).filter((e) => !assignedIds.has(e.id)).map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.email || e.email}</option>
                ))}
              </select>
            </Field>
            <Field label="Salary Structure">
              <select className="input" value={form.salaryStructureId} onChange={(e) => setForm({ ...form, salaryStructureId: e.target.value })}>
                <option value="">Select structure</option>
                {(structuresQuery.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAssign(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => assignMut.mutate()} disabled={!form.employeeId || !form.salaryStructureId || assignMut.isPending} className="btn-primary">
                {assignMut.isPending ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}