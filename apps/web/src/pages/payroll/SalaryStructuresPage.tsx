import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { SalaryComponent, SalaryStructure, money } from "./types";

interface ComponentDraft { name: string; type: "earning" | "deduction"; amount: string }

export function SalaryStructuresPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", effectiveFrom: "" });
  const [components, setComponents] = useState<ComponentDraft[]>([
    { name: "", type: "earning", amount: "" },
    { name: "", type: "deduction", amount: "" },
  ]);
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["salary-structures"],
    queryFn: async () => (await api.get("/payroll/structures")).data.data as SalaryStructure[],
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post("/payroll/structures", {
        name: form.name,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        components: components
          .filter((c) => c.name && c.amount !== "")
          .map((c) => ({ name: c.name, type: c.type, amount: Number(c.amount) })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-structures"] });
      setShowCreate(false);
      setForm({ name: "", effectiveFrom: "" });
      setComponents([
        { name: "", type: "earning", amount: "" },
        { name: "", type: "deduction", amount: "" },
      ]);
    },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const structures = listQuery.data!;

  const structureNet = (s: SalaryStructure) =>
    s.components.filter((c) => c.type === "earning").reduce((sum, c) => sum + Number(c.amount), 0) -
    s.components.filter((c) => c.type === "deduction").reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <PageHeader
        title="Salary Structures"
        subtitle={`${structures.length} structure(s)`}
        actions={
          <button
            onClick={() => { setError(""); setShowCreate(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Create Structure
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {structures.length === 0 ? (
        <EmptyState message="No salary structures created yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {structures.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400">Effective {new Date(s.effectiveFrom).toLocaleDateString()}</div>
                </div>
                <Badge tone={statusTone("active")}>Active</Badge>
              </div>
              <div className="mt-3 divide-y divide-gray-100 dark:divide-neutral-800">
                {s.components.map((c: SalaryComponent) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-gray-600">
                      {c.name} <span className="text-gray-400">({c.type})</span>
                    </span>
                    <span className={c.type === "earning" ? "font-medium text-emerald-600" : "font-medium text-rose-500"}>
                      {c.type === "earning" ? "+" : "-"}{money(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-sm dark:border-neutral-800">
                <span className="text-xs text-gray-500">Net Monthly</span>
                <span className="font-semibold text-gray-800">{money(structureNet(s))}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showCreate && (
        <Modal title="Create Salary Structure" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <Field label="Name">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Manager Structure" />
            </Field>
            <Field label="Effective From">
              <input className="input" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
            </Field>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Components</span>
                <button
                  onClick={() => setComponents([...components, { name: "", type: "earning", amount: "" }])}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  + Add component
                </button>
              </div>
              {components.map((c, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => setComponents(components.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <select
                    className="input w-28"
                    value={c.type}
                    onChange={(e) => setComponents(components.map((x, xi) => (xi === i ? { ...x, type: e.target.value as "earning" | "deduction" } : x)))}
                  >
                    <option value="earning">earning</option>
                    <option value="deduction">deduction</option>
                  </select>
                  <input
                    className="input w-28"
                    type="number"
                    placeholder="Amount"
                    value={c.amount}
                    onChange={(e) => setComponents(components.map((x, xi) => (xi === i ? { ...x, amount: e.target.value } : x)))}
                  />
                  <button
                    onClick={() => setComponents(components.filter((_, xi) => xi !== i))}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-neutral-800"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.name || !form.effectiveFrom || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Creating..." : "Create Structure"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}